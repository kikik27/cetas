// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/CeloTactics.sol";
import "../src/GameUnits.sol";
import "../src/RewardToken.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        CetasReward rewardToken = new CetasReward();
        console.log("CetasReward deployed to:", address(rewardToken));

        GameUnits gameUnits = new GameUnits();
        console.log("GameUnits deployed to:", address(gameUnits));

        CeloTactics celoTactics = new CeloTactics(
            address(gameUnits),
            address(rewardToken)
        );
        console.log("CeloTactics deployed to:", address(celoTactics));

        gameUnits.setGameOperator(address(celoTactics));
        console.log("GameUnits operator set to CeloTactics");

        rewardToken.transferOwnership(address(celoTactics));
        console.log("CetasReward ownership transferred to CeloTactics");

        vm.stopBroadcast();

        console.log("");
        console.log("--- Deployment Complete ---");
        console.log("CetasReward: ", address(rewardToken));
        console.log("GameUnits:   ", address(gameUnits));
        console.log("CeloTactics: ", address(celoTactics));
    }
}
