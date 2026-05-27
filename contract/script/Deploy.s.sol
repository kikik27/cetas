// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/CetasPoints.sol";
import "../src/CetasTreasury.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // --- 1. CetasPoints ---
        CetasPoints pointsImpl = new CetasPoints();
        console.log("CetasPoints impl:", address(pointsImpl));
        ERC1967Proxy pointsProxy = new ERC1967Proxy(
            address(pointsImpl),
            abi.encodeWithSelector(CetasPoints.initialize.selector, deployer)
        );
        CetasPoints points = CetasPoints(address(pointsProxy));
        console.log("CetasPoints proxy:", address(points));

        // --- 2. CetasTreasury ---
        CetasTreasury treasuryImpl = new CetasTreasury();
        console.log("CetasTreasury impl:", address(treasuryImpl));
        ERC1967Proxy treasuryProxy = new ERC1967Proxy(
            address(treasuryImpl),
            abi.encodeWithSelector(CetasTreasury.initialize.selector, deployer, address(points), 1e15)
        );
        CetasTreasury treasury = CetasTreasury(payable(address(treasuryProxy)));
        console.log("CetasTreasury proxy:", address(treasury));

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployed ===");
        console.log("CetasPoints:   ", address(points));
        console.log("Points impl:   ", address(pointsImpl));
        console.log("CetasTreasury: ", address(treasury));
        console.log("Treasury impl: ", address(treasuryImpl));
    }
}