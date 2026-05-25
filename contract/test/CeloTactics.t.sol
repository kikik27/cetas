// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import "../src/CeloTactics.sol";
import "../src/GameUnits.sol";
import "../src/RewardToken.sol";

contract CeloTacticsTest is Test {
    uint256 internal constant ENTRY_FEE = 0.1 ether;
    uint256 internal constant TOTAL_FEE = ENTRY_FEE * 8;
    uint256 internal constant TREASURY_CUT = (TOTAL_FEE * 500) / 10000;
    uint256 internal constant WINNABLE = TOTAL_FEE - TREASURY_CUT;
    uint256 internal constant PRIZE_PER_WINNER = WINNABLE / 4;
    uint256 internal constant REWARD_PER_WIN = 50 ether;

    CeloTactics internal celoTactics;
    GameUnits internal gameUnits;
    CetasReward internal rewardToken;

    address internal owner = makeAddr("owner");
    address internal player1 = makeAddr("player1");
    address internal player2 = makeAddr("player2");
    address internal player3 = makeAddr("player3");
    address internal player4 = makeAddr("player4");
    address internal player5 = makeAddr("player5");
    address internal player6 = makeAddr("player6");
    address internal player7 = makeAddr("player7");
    address internal player8 = makeAddr("player8");
    address internal other = makeAddr("other");

    event MatchCreated(uint256 indexed matchId, uint256 entryFee);
    event PlayerEntered(uint256 indexed matchId, address indexed player);
    event UnitPurchased(uint256 indexed matchId, address indexed player, uint256 unitId, uint8 stars);
    event UnitsMerged(uint256 indexed matchId, address indexed player, uint256 unitId, uint8 newStars);
    event BattleSettled(uint256 indexed matchId, address[] winners, uint256[] prizes);
    event RewardClaimed(uint256 indexed matchId, address indexed player, uint256 prizeAmount, uint256 tokenAmount);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

    function setUp() public {
        vm.startPrank(owner);

        gameUnits = new GameUnits();
        rewardToken = new CetasReward();
        celoTactics = new CeloTactics(address(gameUnits), address(rewardToken));

        gameUnits.setGameOperator(address(celoTactics));
        rewardToken.transferOwnership(address(celoTactics));

        vm.stopPrank();
    }

    function _createMatch() internal returns (uint256 matchId) {
        vm.prank(owner);
        matchId = celoTactics.createMatch(ENTRY_FEE);
    }

    function _enterAllPlayers(uint256 matchId) internal {
        address[8] memory allPlayers = [
            player1, player2, player3, player4,
            player5, player6, player7, player8
        ];

        for (uint256 i = 0; i < 8; i++) {
            vm.deal(allPlayers[i], 100 ether);
            vm.prank(allPlayers[i]);
            celoTactics.enterMatch{value: ENTRY_FEE}(matchId);
        }
    }

    function _createAndFillMatch() internal returns (uint256 matchId) {
        matchId = _createMatch();
        _enterAllPlayers(matchId);
    }

    function _settleMatch(uint256 matchId) internal {
        address[] memory rankedPlayers = new address[](4);
        rankedPlayers[0] = player1;
        rankedPlayers[1] = player2;
        rankedPlayers[2] = player3;
        rankedPlayers[3] = player4;

        uint8[] memory ranks = new uint8[](4);
        ranks[0] = 1;
        ranks[1] = 2;
        ranks[2] = 3;
        ranks[3] = 4;

        vm.prank(owner);
        celoTactics.settleMatch(matchId, rankedPlayers, ranks);
    }

    // =========================================================================
    // 1. DEPLOYMENT
    // =========================================================================
    function test_deployment_contractsDeployed() public view {
        assertTrue(address(celoTactics) != address(0));
        assertTrue(address(gameUnits) != address(0));
        assertTrue(address(rewardToken) != address(0));
    }

    function test_deployment_ownerIsCorrect() public view {
        assertEq(celoTactics.owner(), owner);
    }

    function test_deployment_gameOperatorSet() public view {
        assertEq(gameUnits.gameOperator(), address(celoTactics));
    }

    function test_deployment_rewardTokenOwnership() public view {
        assertEq(rewardToken.owner(), address(celoTactics));
    }

    function test_deployment_linkedContracts() public view {
        assertEq(address(celoTactics.gameUnits()), address(gameUnits));
        assertEq(address(celoTactics.rewardToken()), address(rewardToken));
    }

    function test_deployment_tokenMetadata() public view {
        assertEq(rewardToken.name(), "Cetas Reward");
        assertEq(rewardToken.symbol(), "CETAS");
    }

    function test_deployment_unitConstants() public view {
        assertEq(gameUnits.WARRIOR(), 0);
        assertEq(gameUnits.ARCHER(), 1);
        assertEq(gameUnits.KNIGHT(), 2);
        assertEq(gameUnits.ROGUE(), 3);
    }

    // =========================================================================
    // 2. MATCH CREATION
    // =========================================================================
    function test_matchCreation_correctParams() public {
        vm.expectEmit(true, true, false, true);
        emit MatchCreated(0, ENTRY_FEE);

        vm.prank(owner);
        celoTactics.createMatch(ENTRY_FEE);

        CeloTactics.Match memory m = celoTactics.getMatchInfo(0);
        assertEq(m.id, 0);
        assertEq(m.entryFee, ENTRY_FEE);
        assertEq(m.playerCount, 0);
        assertEq(m.maxPlayers, 8);
        assertEq(m.prizePool, 0);
        assertEq(m.settled, false);
    }

    function test_matchCreation_incrementsId() public {
        vm.startPrank(owner);
        celoTactics.createMatch(ENTRY_FEE);
        celoTactics.createMatch(0.2 ether);
        vm.stopPrank();

        assertEq(celoTactics.getMatchInfo(0).id, 0);
        assertEq(celoTactics.getMatchInfo(1).id, 1);
        assertEq(celoTactics.getMatchInfo(1).entryFee, 0.2 ether);
    }

    function test_matchCreation_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit MatchCreated(0, ENTRY_FEE);

        vm.prank(owner);
        celoTactics.createMatch(ENTRY_FEE);
    }

    function test_matchCreation_onlyOwner() public {
        vm.prank(other);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, other)
        );
        celoTactics.createMatch(ENTRY_FEE);
    }

    // =========================================================================
    // 3. PLAYER ENTRY
    // =========================================================================
    function test_playerEntry_recordedCorrectly() public {
        uint256 matchId = _createAndFillMatch();

        CeloTactics.PlayerEntry memory entry = celoTactics.getPlayerEntry(matchId, player1);
        assertTrue(entry.entered);
        assertEq(entry.rank, 0);
        assertEq(entry.claimed, false);
    }

    function test_playerEntry_emitsEvent() public {
        uint256 matchId = _createMatch();

        vm.expectEmit(true, true, false, false);
        emit PlayerEntered(matchId, player1);

        vm.deal(player1, 100 ether);
        vm.prank(player1);
        celoTactics.enterMatch{value: ENTRY_FEE}(matchId);
    }

    function test_playerEntry_updatesPlayerCountAndPrizePool() public {
        uint256 matchId = _createMatch();

        vm.deal(player1, 100 ether);
        vm.prank(player1);
        celoTactics.enterMatch{value: ENTRY_FEE}(matchId);
        assertEq(celoTactics.getMatchInfo(matchId).playerCount, 1);
        assertEq(celoTactics.getMatchInfo(matchId).prizePool, ENTRY_FEE);

        vm.deal(player2, 100 ether);
        vm.prank(player2);
        celoTactics.enterMatch{value: ENTRY_FEE}(matchId);
        assertEq(celoTactics.getMatchInfo(matchId).playerCount, 2);
        assertEq(celoTactics.getMatchInfo(matchId).prizePool, ENTRY_FEE * 2);
    }

    function test_playerEntry_eightPlayers() public {
        uint256 matchId = _createAndFillMatch();

        CeloTactics.Match memory m = celoTactics.getMatchInfo(matchId);
        assertEq(m.playerCount, 8);
        assertEq(m.prizePool, TOTAL_FEE);

        address[8] memory allPlayers = [
            player1, player2, player3, player4,
            player5, player6, player7, player8
        ];

        for (uint256 i = 0; i < 8; i++) {
            assertTrue(celoTactics.getPlayerEntry(matchId, allPlayers[i]).entered);
        }
    }

    function test_playerEntry_refundsExcess() public {
        uint256 matchId = _createMatch();

        vm.deal(player1, 100 ether);
        uint256 balanceBefore = player1.balance;

        uint256 overpay = ENTRY_FEE * 2;
        vm.prank(player1);
        celoTactics.enterMatch{value: overpay}(matchId);

        uint256 balanceAfter = player1.balance;
        assertEq(balanceBefore - balanceAfter, ENTRY_FEE);
    }

    // =========================================================================
    // 4. UNIT PURCHASE
    // =========================================================================
    function test_unitPurchase_mintWarrior() public {
        uint256 matchId = _createAndFillMatch();

        vm.expectEmit(true, true, true, false);
        emit UnitPurchased(matchId, player1, 0, 1);

        vm.prank(player1);
        celoTactics.buyUnit(matchId, 0);

        assertEq(gameUnits.balanceOf(player1, 1), 1);
    }

    function test_unitPurchase_mintArcher() public {
        uint256 matchId = _createAndFillMatch();

        vm.expectEmit(true, true, true, false);
        emit UnitPurchased(matchId, player1, 1, 1);

        vm.prank(player1);
        celoTactics.buyUnit(matchId, 1);

        assertEq(gameUnits.balanceOf(player1, 1), 1);
    }

    function test_unitPurchase_mintKnight() public {
        uint256 matchId = _createAndFillMatch();

        vm.prank(player1);
        celoTactics.buyUnit(matchId, 2);

        assertEq(gameUnits.balanceOf(player1, 1), 1);
    }

    function test_unitPurchase_mintRogue() public {
        uint256 matchId = _createAndFillMatch();

        vm.prank(player1);
        celoTactics.buyUnit(matchId, 3);

        assertEq(gameUnits.balanceOf(player1, 1), 1);
    }

    function test_unitPurchase_incrementsTokenId() public {
        uint256 matchId = _createAndFillMatch();

        vm.startPrank(player1);

        vm.expectEmit(true, true, true, false);
        emit UnitPurchased(matchId, player1, 0, 1);
        celoTactics.buyUnit(matchId, 0);

        vm.expectEmit(true, true, true, false);
        emit UnitPurchased(matchId, player1, 0, 1);
        celoTactics.buyUnit(matchId, 0);

        vm.expectEmit(true, true, true, false);
        emit UnitPurchased(matchId, player1, 1, 1);
        celoTactics.buyUnit(matchId, 1);

        vm.stopPrank();

        assertEq(gameUnits.balanceOf(player1, 1), 1);
        assertEq(gameUnits.balanceOf(player1, 2), 1);
        assertEq(gameUnits.balanceOf(player1, 3), 1);
    }

    function test_unitPurchase_differentPlayers() public {
        uint256 matchId = _createAndFillMatch();

        vm.prank(player1);
        celoTactics.buyUnit(matchId, 0);

        vm.prank(player2);
        celoTactics.buyUnit(matchId, 2);

        assertEq(gameUnits.balanceOf(player1, 1), 1);
        assertEq(gameUnits.balanceOf(player2, 2), 1);
    }

    // =========================================================================
    // 5. UNIT MERGE
    // =========================================================================
    function test_unitMerge_warriorsToStar2() public {
        uint256 matchId = _createAndFillMatch();

        vm.startPrank(player1);
        celoTactics.buyUnit(matchId, 0);
        celoTactics.buyUnit(matchId, 0);
        celoTactics.buyUnit(matchId, 0);
        vm.stopPrank();

        assertEq(gameUnits.balanceOf(player1, 1), 1);
        assertEq(gameUnits.balanceOf(player1, 2), 1);
        assertEq(gameUnits.balanceOf(player1, 3), 1);

        uint256[3] memory burnIds = [uint256(1), 2, 3];

        vm.expectEmit(true, true, true, false);
        emit UnitsMerged(matchId, player1, 0, 2);

        vm.prank(player1);
        celoTactics.mergeUnits(matchId, 0, 1, burnIds);

        assertEq(gameUnits.balanceOf(player1, 1), 0);
        assertEq(gameUnits.balanceOf(player1, 2), 0);
        assertEq(gameUnits.balanceOf(player1, 3), 0);
        assertEq(gameUnits.balanceOf(player1, 4), 1);
    }

    function test_unitMerge_archersToStar2() public {
        uint256 matchId = _createAndFillMatch();

        vm.startPrank(player1);
        celoTactics.buyUnit(matchId, 1);
        celoTactics.buyUnit(matchId, 1);
        celoTactics.buyUnit(matchId, 1);
        vm.stopPrank();

        uint256[3] memory burnIds = [uint256(1), 2, 3];

        vm.prank(player1);
        celoTactics.mergeUnits(matchId, 1, 1, burnIds);

        assertEq(gameUnits.balanceOf(player1, 1), 0);
        assertEq(gameUnits.balanceOf(player1, 2), 0);
        assertEq(gameUnits.balanceOf(player1, 3), 0);
        assertEq(gameUnits.balanceOf(player1, 4), 1);
    }

    function test_unitMerge_emitsEvent() public {
        uint256 matchId = _createAndFillMatch();

        vm.startPrank(player1);
        celoTactics.buyUnit(matchId, 2);
        celoTactics.buyUnit(matchId, 2);
        celoTactics.buyUnit(matchId, 2);
        vm.stopPrank();

        uint256[3] memory burnIds = [uint256(1), 2, 3];

        vm.expectEmit(true, true, true, false);
        emit UnitsMerged(matchId, player1, 2, 2);

        vm.prank(player1);
        celoTactics.mergeUnits(matchId, 2, 1, burnIds);
    }

    // =========================================================================
    // 6. BATTLE SETTLEMENT
    // =========================================================================
    function test_battleSettlement_settlesMatch() public {
        uint256 matchId = _createAndFillMatch();

        address[] memory rankedPlayers = new address[](8);
        rankedPlayers[0] = player1;
        rankedPlayers[1] = player2;
        rankedPlayers[2] = player3;
        rankedPlayers[3] = player4;
        rankedPlayers[4] = player5;
        rankedPlayers[5] = player6;
        rankedPlayers[6] = player7;
        rankedPlayers[7] = player8;

        uint8[] memory ranks = new uint8[](8);
        ranks[0] = 1;
        ranks[1] = 2;
        ranks[2] = 3;
        ranks[3] = 4;
        ranks[4] = 5;
        ranks[5] = 6;
        ranks[6] = 7;
        ranks[7] = 8;

        address[] memory expectedWinners = new address[](4);
        expectedWinners[0] = player1;
        expectedWinners[1] = player2;
        expectedWinners[2] = player3;
        expectedWinners[3] = player4;

        uint256[] memory expectedPrizes = new uint256[](4);
        expectedPrizes[0] = PRIZE_PER_WINNER;
        expectedPrizes[1] = PRIZE_PER_WINNER;
        expectedPrizes[2] = PRIZE_PER_WINNER;
        expectedPrizes[3] = PRIZE_PER_WINNER;

        vm.expectEmit(true, false, false, true);
        emit BattleSettled(matchId, expectedWinners, expectedPrizes);

        vm.prank(owner);
        celoTactics.settleMatch(matchId, rankedPlayers, ranks);

        assertTrue(celoTactics.getMatchInfo(matchId).settled);
    }

    function test_battleSettlement_recordsRanks() public {
        uint256 matchId = _createAndFillMatch();

        address[] memory rankedPlayers = new address[](4);
        rankedPlayers[0] = player1;
        rankedPlayers[1] = player2;
        rankedPlayers[2] = player3;
        rankedPlayers[3] = player4;

        uint8[] memory ranks = new uint8[](4);
        ranks[0] = 1;
        ranks[1] = 2;
        ranks[2] = 3;
        ranks[3] = 4;

        vm.prank(owner);
        celoTactics.settleMatch(matchId, rankedPlayers, ranks);

        assertEq(uint256(celoTactics.getPlayerEntry(matchId, player1).rank), 1);
        assertEq(uint256(celoTactics.getPlayerEntry(matchId, player2).rank), 2);
        assertEq(uint256(celoTactics.getPlayerEntry(matchId, player3).rank), 3);
        assertEq(uint256(celoTactics.getPlayerEntry(matchId, player4).rank), 4);
    }

    function test_battleSettlement_accruesTreasury() public {
        uint256 matchId = _createAndFillMatch();

        assertEq(celoTactics.treasuryBalance(), 0);

        _settleMatch(matchId);

        assertEq(celoTactics.treasuryBalance(), TREASURY_CUT);
    }

    // =========================================================================
    // 7. PRIZE CLAIM
    // =========================================================================
    function test_prizeClaim_winnerReceivesPrize() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        uint256 balanceBefore = player1.balance;

        vm.prank(player1);
        celoTactics.claimPrize(matchId);

        uint256 balanceAfter = player1.balance;
        assertEq(balanceAfter - balanceBefore, PRIZE_PER_WINNER);
    }

    function test_prizeClaim_emitsRewardClaimed() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        vm.expectEmit(true, true, false, false);
        emit RewardClaimed(matchId, player1, PRIZE_PER_WINNER, REWARD_PER_WIN);

        vm.prank(player1);
        celoTactics.claimPrize(matchId);
    }

    function test_prizeClaim_marksClaimed() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        vm.prank(player1);
        celoTactics.claimPrize(matchId);

        assertTrue(celoTactics.getPlayerEntry(matchId, player1).claimed);
    }

    function test_prizeClaim_allFourWinnersClaim() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        address[4] memory winners = [player1, player2, player3, player4];

        for (uint256 i = 0; i < 4; i++) {
            uint256 balanceBefore = winners[i].balance;
            vm.prank(winners[i]);
            celoTactics.claimPrize(matchId);
            uint256 balanceAfter = winners[i].balance;
            assertEq(balanceAfter - balanceBefore, PRIZE_PER_WINNER);
        }
    }

    // =========================================================================
    // 8. REWARD TOKEN MINTING
    // =========================================================================
    function test_rewardToken_mintsOnSettlement() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        address[4] memory winners = [player1, player2, player3, player4];
        for (uint256 i = 0; i < 4; i++) {
            assertEq(rewardToken.balanceOf(winners[i]), REWARD_PER_WIN);
        }
    }

    function test_rewardToken_doesNotMintNonWinners() public {
        uint256 matchId = _createAndFillMatch();

        address[] memory rankedPlayers = new address[](5);
        rankedPlayers[0] = player1;
        rankedPlayers[1] = player2;
        rankedPlayers[2] = player3;
        rankedPlayers[3] = player4;
        rankedPlayers[4] = player5;

        uint8[] memory ranks = new uint8[](5);
        ranks[0] = 1;
        ranks[1] = 2;
        ranks[2] = 3;
        ranks[3] = 4;
        ranks[4] = 5;

        vm.prank(owner);
        celoTactics.settleMatch(matchId, rankedPlayers, ranks);

        assertEq(rewardToken.balanceOf(player5), 0);
    }

    // =========================================================================
    // 9. EDGE CASES
    // =========================================================================
    function test_edgeCases_duplicateEntry() public {
        uint256 matchId = _createMatch();

        vm.deal(player1, 100 ether);
        vm.prank(player1);
        celoTactics.enterMatch{value: ENTRY_FEE}(matchId);

        vm.expectRevert("Already entered");
        vm.prank(player1);
        celoTactics.enterMatch(matchId);
    }

    function test_edgeCases_fullMatch() public {
        uint256 matchId = _createAndFillMatch();

        vm.deal(other, 100 ether);
        vm.prank(other);
        vm.expectRevert("Match full");
        celoTactics.enterMatch(matchId);
    }

    function test_edgeCases_insufficientFee() public {
        uint256 matchId = _createMatch();

        vm.deal(player1, 100 ether);
        vm.prank(player1);
        vm.expectRevert("Insufficient entry fee");
        celoTactics.enterMatch{value: 0.01 ether}(matchId);
    }

    function test_edgeCases_nonEntrantBuyUnit() public {
        uint256 matchId = _createMatch();

        vm.prank(other);
        vm.expectRevert("Not in match");
        celoTactics.buyUnit(matchId, 0);
    }

    function test_edgeCases_nonEntrantMerge() public {
        uint256 matchId = _createMatch();

        uint256[3] memory burnIds = [uint256(1), 2, 3];
        vm.prank(other);
        vm.expectRevert("Not in match");
        celoTactics.mergeUnits(matchId, 0, 1, burnIds);
    }

    function test_edgeCases_enterSettledMatch() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        vm.prank(player1);
        vm.expectRevert("Match not active");
        celoTactics.enterMatch(matchId);
    }

    function test_edgeCases_buyOnSettledMatch() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        vm.prank(player1);
        vm.expectRevert("Match settled");
        celoTactics.buyUnit(matchId, 0);
    }

    function test_edgeCases_mergeOnSettledMatch() public {
        uint256 matchId = _createAndFillMatch();

        vm.startPrank(player1);
        celoTactics.buyUnit(matchId, 0);
        celoTactics.buyUnit(matchId, 0);
        celoTactics.buyUnit(matchId, 0);
        vm.stopPrank();

        _settleMatch(matchId);

        uint256[3] memory burnIds = [uint256(1), 2, 3];
        vm.prank(player1);
        vm.expectRevert("Match settled");
        celoTactics.mergeUnits(matchId, 0, 1, burnIds);
    }

    function test_edgeCases_doubleSettle() public {
        uint256 matchId = _createAndFillMatch();

        address[] memory rankedPlayers = new address[](4);
        rankedPlayers[0] = player1;
        rankedPlayers[1] = player2;
        rankedPlayers[2] = player3;
        rankedPlayers[3] = player4;

        uint8[] memory ranks = new uint8[](4);
        ranks[0] = 1;
        ranks[1] = 2;
        ranks[2] = 3;
        ranks[3] = 4;

        vm.prank(owner);
        celoTactics.settleMatch(matchId, rankedPlayers, ranks);

        vm.expectRevert("Already settled");
        vm.prank(owner);
        celoTactics.settleMatch(matchId, rankedPlayers, ranks);
    }

    function test_edgeCases_claimUnsettledMatch() public {
        uint256 matchId = _createAndFillMatch();

        vm.prank(player1);
        vm.expectRevert("Match not settled");
        celoTactics.claimPrize(matchId);
    }

    function test_edgeCases_nonWinnerClaim() public {
        uint256 matchId = _createAndFillMatch();

        address[] memory rankedPlayers = new address[](5);
        rankedPlayers[0] = player1;
        rankedPlayers[1] = player2;
        rankedPlayers[2] = player3;
        rankedPlayers[3] = player4;
        rankedPlayers[4] = player5;

        uint8[] memory ranks = new uint8[](5);
        ranks[0] = 1;
        ranks[1] = 2;
        ranks[2] = 3;
        ranks[3] = 4;
        ranks[4] = 5;

        vm.prank(owner);
        celoTactics.settleMatch(matchId, rankedPlayers, ranks);

        vm.prank(player5);
        vm.expectRevert("Not a winner");
        celoTactics.claimPrize(matchId);
    }

    function test_edgeCases_doubleClaim() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        vm.prank(player1);
        celoTactics.claimPrize(matchId);

        vm.prank(player1);
        vm.expectRevert("Already claimed");
        celoTactics.claimPrize(matchId);
    }

    function test_edgeCases_invalidMatchId() public {
        vm.deal(player1, 100 ether);
        vm.prank(player1);
        vm.expectRevert();
        celoTactics.enterMatch(999);
    }

    // =========================================================================
    // 10. TREASURY WITHDRAWAL
    // =========================================================================
    function test_treasury_withdrawByOwner() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        assertEq(celoTactics.treasuryBalance(), TREASURY_CUT);

        uint256 balanceBefore = owner.balance;

        vm.expectEmit(true, false, false, true);
        emit TreasuryWithdrawn(owner, TREASURY_CUT);

        vm.prank(owner);
        celoTactics.withdrawTreasury(owner);

        assertEq(celoTactics.treasuryBalance(), 0);
        assertEq(owner.balance - balanceBefore, TREASURY_CUT);
    }

    function test_treasury_onlyOwnerCanWithdraw() public {
        vm.prank(other);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, other)
        );
        celoTactics.withdrawTreasury(other);
    }

    // =========================================================================
    // 11. GAMEUNITS ACCESS CONTROL
    // =========================================================================
    function test_gameUnits_nonOperatorCannotMint() public {
        vm.prank(other);
        vm.expectRevert("Not authorized");
        gameUnits.mintUnit(other, 0, 1);
    }

    function test_gameUnits_nonOperatorCannotMerge() public {
        uint256 matchId = _createAndFillMatch();

        vm.startPrank(player1);
        celoTactics.buyUnit(matchId, 0);
        celoTactics.buyUnit(matchId, 0);
        celoTactics.buyUnit(matchId, 0);
        vm.stopPrank();

        uint256[3] memory burnIds = [uint256(1), 2, 3];
        vm.prank(other);
        vm.expectRevert("Not authorized");
        gameUnits.mergeUnits(player1, 0, 1, burnIds);
    }

    // =========================================================================
    // 12. CETASREWARD ACCESS CONTROL
    // =========================================================================
    function test_cetasReward_nonOwnerCannotMint() public {
        vm.prank(other);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, other)
        );
        rewardToken.mintReward(other);
    }

    function test_cetasReward_holderCanBurn() public {
        uint256 matchId = _createAndFillMatch();
        _settleMatch(matchId);

        assertEq(rewardToken.balanceOf(player1), REWARD_PER_WIN);

        vm.prank(player1);
        rewardToken.burn(10 ether);

        assertEq(rewardToken.balanceOf(player1), REWARD_PER_WIN - 10 ether);
    }

    // =========================================================================
    // 13. RECEIVE FUNCTION
    // =========================================================================
    function test_receive_acceptsEth() public {
        vm.deal(owner, 10 ether);
        vm.prank(owner);
        (bool sent, ) = address(celoTactics).call{value: 1 ether}("");
        assertTrue(sent);

        assertEq(address(celoTactics).balance, 1 ether);
    }
}
