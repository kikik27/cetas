// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CetasReward
 * @notice ERC-20 reward token for Celo Tactics players.
 *         Minted to winners who place in the top ranks of a tournament match.
 */
contract CetasReward is ERC20, Ownable {
    uint256 public constant REWARD_PER_WIN = 50 * 10 ** 18; // 50 CETAS

    constructor() ERC20("Cetas Reward", "CETAS") Ownable(msg.sender) {}

    /**
     * @notice Mint reward tokens to a winning player.
     * @param winner Address of the winning player.
     */
    function mintReward(address winner) external onlyOwner {
        _mint(winner, REWARD_PER_WIN);
    }

    /**
     * @notice Batch mint to multiple winners (top 4).
     * @param winners Array of winner addresses.
     */
    function mintBatchReward(address[] calldata winners) external onlyOwner {
        for (uint256 i = 0; i < winners.length; i++) {
            _mint(winners[i], REWARD_PER_WIN);
        }
    }

    /**
     * @notice Burn tokens (used for entry fees or upgrades).
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
