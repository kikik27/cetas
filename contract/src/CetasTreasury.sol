// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CetasPoints.sol";

contract CetasTreasury is Initializable, UUPSUpgradeable, ReentrancyGuard {
    struct CetasTreasuryStorage {
        address owner;
        address pendingOwner;
        CetasPoints pointsToken;
        uint256 exchangeRate;
        bool swapPaused;
        uint256 totalSwapped;
        uint256 totalPointsBurned;
        mapping(address => uint256) swappedAmounts;
    }

    bytes32 private constant STORAGE_SLOT = 0x9e4d8412cd55252b78ea32578d66190bfeda8d1eb438556ff8205ee5b16f9e00;

    event PointsSwapped(address indexed user, uint256 pointsBurned, uint256 celoReceived);
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    event CeloDeposited(address indexed from, uint256 amount);
    event CeloWithdrawn(address indexed to, uint256 amount);
    event SwapPaused(address account);
    event SwapUnpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error SwapIsPaused();
    error NotPaused();
    error ZeroAddress();
    error InsufficientCeloReserve();
    error InsufficientPoints();
    error ZeroAmount();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address _owner, address _pointsToken, uint256 _exchangeRate) external initializer {
        if (_owner == address(0) || _pointsToken == address(0)) revert ZeroAddress();
        if (_exchangeRate == 0) revert ZeroAmount();
        CetasTreasuryStorage storage $ = _getStorage();
        $.owner = _owner;
        $.pointsToken = CetasPoints(_pointsToken);
        $.exchangeRate = _exchangeRate;
    }

    modifier onlyOwner() {
        if (_getStorage().owner != msg.sender) revert NotOwner();
        _;
    }
    modifier whenNotPaused() {
        if (_getStorage().swapPaused) revert SwapIsPaused();
        _;
    }
    modifier whenPaused() {
        if (!_getStorage().swapPaused) revert NotPaused();
        _;
    }

    function _getStorage() internal pure returns (CetasTreasuryStorage storage $) {
        bytes32 slot = STORAGE_SLOT;
        assembly { $.slot := slot }
    }

    receive() external payable { emit CeloDeposited(msg.sender, msg.value); }

    function swapPointsToCelo(uint256 pointsAmount) external nonReentrant whenNotPaused {
        if (pointsAmount == 0) revert ZeroAmount();
        CetasTreasuryStorage storage $ = _getStorage();
        uint256 celoAmount = (pointsAmount * $.exchangeRate) / 1e18;
        if (celoAmount == 0) revert InsufficientPoints();
        if (address(this).balance < celoAmount) revert InsufficientCeloReserve();

        $.pointsToken.burnFrom(msg.sender, pointsAmount);

        $.totalPointsBurned += pointsAmount;
        $.totalSwapped += celoAmount;
        $.swappedAmounts[msg.sender] += celoAmount;

        (bool sent, ) = payable(msg.sender).call{value: celoAmount}("");
        require(sent, "CELO transfer failed");
        emit PointsSwapped(msg.sender, pointsAmount, celoAmount);
    }

    function depositCelo() external payable {
        if (msg.value == 0) revert ZeroAmount();
        emit CeloDeposited(msg.sender, msg.value);
    }

    function withdrawCelo(address to, uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (address(this).balance < amount) revert InsufficientCeloReserve();
        (bool sent, ) = payable(to).call{value: amount}("");
        require(sent, "CELO transfer failed");
        emit CeloWithdrawn(to, amount);
    }

    function setExchangeRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert ZeroAmount();
        CetasTreasuryStorage storage $ = _getStorage();
        emit ExchangeRateUpdated($.exchangeRate, newRate);
        $.exchangeRate = newRate;
    }

    function pauseSwap() external onlyOwner whenNotPaused {
        _getStorage().swapPaused = true;
        emit SwapPaused(msg.sender);
    }
    function unpauseSwap() external onlyOwner whenPaused {
        _getStorage().swapPaused = false;
        emit SwapUnpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        _getStorage().pendingOwner = newOwner;
    }
    function acceptOwnership() external {
        CetasTreasuryStorage storage $ = _getStorage();
        if (msg.sender != $.pendingOwner) revert NotOwner();
        emit OwnershipTransferred($.owner, msg.sender);
        $.owner = msg.sender;
        $.pendingOwner = address(0);
    }


    function previewSwap(uint256 pointsAmount) external view returns (uint256) {
        CetasTreasuryStorage storage $ = _getStorage();
        return (pointsAmount * $.exchangeRate) / 1e18;
    }

    function owner() external view returns (address) { return _getStorage().owner; }
    function paused() external view returns (bool) { return _getStorage().swapPaused; }
    function exchangeRate() external view returns (uint256) { return _getStorage().exchangeRate; }
    function pointsToken() external view returns (address) { return address(_getStorage().pointsToken); }
    function celoReserve() external view returns (uint256) { return address(this).balance; }
    function totalSwapped() external view returns (uint256) { return _getStorage().totalSwapped; }
    function totalPointsBurned() external view returns (uint256) { return _getStorage().totalPointsBurned; }
    function swappedAmounts(address user) external view returns (uint256) { return _getStorage().swappedAmounts[user]; }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}