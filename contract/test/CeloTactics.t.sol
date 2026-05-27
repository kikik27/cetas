// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/CetasPoints.sol";
import "../src/CetasTreasury.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract CetasPointsTest is Test {
    CetasPoints points;
    address owner = makeAddr("owner");
    address player = makeAddr("player");
    address game = makeAddr("game");

    function setUp() public {
        CetasPoints impl = new CetasPoints();
        points = CetasPoints(address(new ERC1967Proxy(
            address(impl),
            abi.encodeWithSelector(CetasPoints.initialize.selector, owner)
        )));
    }

    function test_initialize() public view {
        assertEq(points.owner(), owner);
        assertEq(points.dailyClaimAmount(), 10 ether);
        assertEq(points.winRewardAmount(), 50 ether);
        assertEq(points.dailyCooldown(), 1 days);
    }
    function test_metadata() public view {
        assertEq(points.name(), "Cetas Points");
        assertEq(points.symbol(), "CETAS");
    }
    function test_dailyClaim() public {
        vm.prank(player);
        points.dailyClaim();
        assertEq(points.balanceOf(player), 10 ether);
    }
    function test_dailyClaim_cooldown() public {
        vm.prank(player);
        points.dailyClaim();
        vm.expectRevert(CetasPoints.DailyCooldownNotPassed.selector);
        vm.prank(player);
        points.dailyClaim();
    }
    function test_dailyClaim_afterCooldown() public {
        vm.prank(player);
        points.dailyClaim();
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(player);
        points.dailyClaim();
        assertEq(points.balanceOf(player), 20 ether);
    }
    function test_winReward() public {
        vm.prank(owner);
        points.setGameContract(game);
        vm.prank(game);
        points.claimWinReward(player);
        assertEq(points.balanceOf(player), 50 ether);
    }
    function test_winReward_onlyGame() public {
        vm.expectRevert(CetasPoints.NotGameContract.selector);
        points.claimWinReward(player);
    }
    function test_burn() public {
        vm.prank(owner);
        points.setGameContract(game);
        vm.prank(game);
        points.claimWinReward(player);
        vm.prank(player);
        points.burn(20 ether);
        assertEq(points.balanceOf(player), 30 ether);
    }
    function test_adminSetters() public {
        vm.prank(owner);
        points.setDailyClaimAmount(20 ether);
        assertEq(points.dailyClaimAmount(), 20 ether);
    }
    function test_transferOwnership() public {
        address newOwner = makeAddr("newOwner");
        vm.prank(owner);
        points.transferOwnership(newOwner);
        vm.prank(newOwner);
        points.acceptOwnership();
        assertEq(points.owner(), newOwner);
    }
}

contract CetasTreasuryTest is Test {
    CetasPoints points;
    CetasTreasury treasury;
    address owner = makeAddr("owner");
    address user = makeAddr("user");
    address game = makeAddr("game");

    function setUp() public {
        CetasPoints impl = new CetasPoints();
        points = CetasPoints(address(new ERC1967Proxy(
            address(impl),
            abi.encodeWithSelector(CetasPoints.initialize.selector, owner)
        )));

        CetasTreasury treasuryImpl = new CetasTreasury();
        treasury = CetasTreasury(payable(address(new ERC1967Proxy(
            address(treasuryImpl),
            abi.encodeWithSelector(CetasTreasury.initialize.selector, owner, address(points), 1e15)
        ))));

        vm.deal(owner, 50 ether);
    }

    function test_initialize() public view {
        assertEq(treasury.owner(), owner);
        assertEq(treasury.exchangeRate(), 1e15);
    }
    function test_depositCelo() public {
        vm.prank(owner);
        treasury.depositCelo{value: 5 ether}();
        assertEq(treasury.celoReserve(), 5 ether);
    }
    function test_receive() public {
        (bool s,) = address(treasury).call{value: 1 ether}("");
        assertTrue(s);
        assertEq(treasury.celoReserve(), 1 ether);
    }
    function test_swap() public {
        vm.prank(owner);
        treasury.depositCelo{value: 10 ether}();

        vm.prank(owner);
        points.setGameContract(game);
        vm.prank(game);
        points.claimWinReward(user);

        vm.prank(user);
        points.approve(address(treasury), 50 ether);

        uint256 balBefore = user.balance;
        vm.prank(user);
        treasury.swapPointsToCelo(50 ether);

        uint256 expected = (50 ether * 1e15) / 1e18;
        assertEq(user.balance - balBefore, expected);
        assertEq(points.balanceOf(user), 0);
    }
    function test_swap_paused() public {
        vm.prank(owner);
        treasury.depositCelo{value: 1 ether}();
        vm.prank(owner);
        treasury.pauseSwap();

        vm.expectRevert(CetasTreasury.SwapIsPaused.selector);
        treasury.swapPointsToCelo(10 ether);
    }
    function test_withdrawCelo() public {
        vm.prank(owner);
        treasury.depositCelo{value: 10 ether}();
        uint256 balBefore = owner.balance;
        vm.prank(owner);
        treasury.withdrawCelo(owner, 3 ether);
        assertEq(owner.balance - balBefore, 3 ether);
    }
    function test_setExchangeRate() public {
        vm.prank(owner);
        treasury.setExchangeRate(2e15);
        assertEq(treasury.exchangeRate(), 2e15);
    }
    function test_flow_dailyClaimToSwap() public {
        vm.prank(owner);
        treasury.depositCelo{value: 5 ether}();

        vm.prank(user);
        points.dailyClaim();
        assertEq(points.balanceOf(user), 10 ether);

        vm.prank(user);
        points.approve(address(treasury), 10 ether);

        uint256 balBefore = user.balance;
        vm.prank(user);
        treasury.swapPointsToCelo(10 ether);

        assertGt(user.balance - balBefore, 0);
        assertEq(points.balanceOf(user), 0);
    }
}