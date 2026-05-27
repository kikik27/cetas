// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract CetasPoints is ERC20, Initializable, UUPSUpgradeable {
    struct CetasPointsStorage {
        address owner;
        address pendingOwner;
        address gameContract;
        uint256 dailyClaimAmount;
        uint256 winRewardAmount;
        uint256 dailyCooldown;
        string name_;
        string symbol_;
        mapping(address => uint256) lastClaimTime;
    }

    bytes32 private constant STORAGE_SLOT = 0x975ac60f770fdf7ad118d34b59a06f5424cfcbb9cca83695f3d6f3a1f7648300;

    event DailyClaimed(address indexed player, uint256 amount, uint256 timestamp);
    event WinRewardClaimed(address indexed player, uint256 amount);
    event DailyClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event WinRewardAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event DailyCooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
    event GameContractUpdated(address indexed oldGame, address indexed newGame);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotGameContract();
    error DailyCooldownNotPassed();
    error ZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() ERC20("", "") {
        _disableInitializers();
    }

    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert ZeroAddress();
        CetasPointsStorage storage $ = _getStorage();
        $.owner = _owner;
        $.dailyClaimAmount = 10 * 10 ** 18;
        $.winRewardAmount = 50 * 10 ** 18;
        $.dailyCooldown = 1 days;
        $.name_ = "Cetas Points";
        $.symbol_ = "CETAS";
    }

    modifier onlyOwner() {
        if (_getStorage().owner != msg.sender) revert NotOwner();
        _;
    }
    modifier onlyGame() {
        if (_getStorage().gameContract != msg.sender) revert NotGameContract();
        _;
    }

    function _getStorage() internal pure returns (CetasPointsStorage storage $) {
        bytes32 slot = STORAGE_SLOT;
        assembly { $.slot := slot }
    }

    function name() public view override returns (string memory) { return _getStorage().name_; }
    function symbol() public view override returns (string memory) { return _getStorage().symbol_; }

    function dailyClaim() external {
        CetasPointsStorage storage $ = _getStorage();
        uint256 lastClaim = $.lastClaimTime[msg.sender];
        if (lastClaim != 0 && block.timestamp < lastClaim + $.dailyCooldown) revert DailyCooldownNotPassed();
        $.lastClaimTime[msg.sender] = block.timestamp;
        _mint(msg.sender, $.dailyClaimAmount);
        emit DailyClaimed(msg.sender, $.dailyClaimAmount, block.timestamp);
    }

    function claimWinReward(address player) external onlyGame {
        CetasPointsStorage storage $ = _getStorage();
        _mint(player, $.winRewardAmount);
        emit WinRewardClaimed(player, $.winRewardAmount);
    }

    function claimWinRewardBatch(address[] calldata players) external onlyGame {
        CetasPointsStorage storage $ = _getStorage();
        uint256 reward = $.winRewardAmount;
        for (uint256 i = 0; i < players.length; i++) {
            _mint(players[i], reward);
            emit WinRewardClaimed(players[i], reward);
        }
    }

    function burn(uint256 amount) external { _burn(msg.sender, amount); }

    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    function canClaimDaily(address player) external view returns (bool) {
        CetasPointsStorage storage $ = _getStorage();
        uint256 lastClaim = $.lastClaimTime[player];
        if (lastClaim == 0) return true;
        return block.timestamp >= lastClaim + $.dailyCooldown;
    }

    function getTimeUntilNextClaim(address player) external view returns (uint256) {
        CetasPointsStorage storage $ = _getStorage();
        uint256 lastClaim = $.lastClaimTime[player];
        if (lastClaim == 0) return 0;
        uint256 nextClaim = lastClaim + $.dailyCooldown;
        if (block.timestamp >= nextClaim) return 0;
        return nextClaim - block.timestamp;
    }

    function setDailyClaimAmount(uint256 newAmount) external onlyOwner {
        CetasPointsStorage storage $ = _getStorage();
        emit DailyClaimAmountUpdated($.dailyClaimAmount, newAmount);
        $.dailyClaimAmount = newAmount;
    }
    function setWinRewardAmount(uint256 newAmount) external onlyOwner {
        CetasPointsStorage storage $ = _getStorage();
        emit WinRewardAmountUpdated($.winRewardAmount, newAmount);
        $.winRewardAmount = newAmount;
    }
    function setDailyCooldown(uint256 newCooldown) external onlyOwner {
        CetasPointsStorage storage $ = _getStorage();
        emit DailyCooldownUpdated($.dailyCooldown, newCooldown);
        $.dailyCooldown = newCooldown;
    }
    function setGameContract(address game) external onlyOwner {
        if (game == address(0)) revert ZeroAddress();
        CetasPointsStorage storage $ = _getStorage();
        emit GameContractUpdated($.gameContract, game);
        $.gameContract = game;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        _getStorage().pendingOwner = newOwner;
    }
    function acceptOwnership() external {
        CetasPointsStorage storage $ = _getStorage();
        if (msg.sender != $.pendingOwner) revert NotOwner();
        emit OwnershipTransferred($.owner, msg.sender);
        $.owner = msg.sender;
        $.pendingOwner = address(0);
    }

    function owner() external view returns (address) { return _getStorage().owner; }
    function gameContract() external view returns (address) { return _getStorage().gameContract; }
    function dailyClaimAmount() external view returns (uint256) { return _getStorage().dailyClaimAmount; }
    function winRewardAmount() external view returns (uint256) { return _getStorage().winRewardAmount; }
    function dailyCooldown() external view returns (uint256) { return _getStorage().dailyCooldown; }
    function lastClaimTime(address player) external view returns (uint256) { return _getStorage().lastClaimTime[player]; }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}