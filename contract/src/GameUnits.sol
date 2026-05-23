// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GameUnits
 * @notice ERC-1155 NFT representing in-game units for Celo Tactics.
 *         Each unit type has a token ID. Star quality (1-3) affects metadata but stays same token ID.
 */
contract GameUnits is ERC1155, Ownable {
    using Strings for uint256;

    // ---- Unit Types (token IDs) ----
    uint256 public constant WARRIOR  = 0;
    uint256 public constant ARCHER   = 1;
    uint256 public constant KNIGHT   = 2;
    uint256 public constant ROGUE    = 3;

    // ---- Unit Names ----
    string[4] public unitNames = ["Warrior", "Archer", "Knight", "Rogue"];

    // ---- Unit Base Costs (in cUSD scaled to wei-decimals equivalent) ----
    uint256[4] public unitCosts = [
        1 ether,  // Warrior  = 1
        1 ether,  // Archer   = 1
        2 ether,  // Knight   = 2
        1 ether   // Rogue    = 1
    ];

    // ---- Star multiplier (basis points) ----
    uint256 public constant STAR_1_MULTIPLIER = 10000; // ×1.00
    uint256 public constant STAR_2_MULTIPLIER = 18000; // ×1.80
    uint256 public constant STAR_3_MULTIPLIER = 32000; // ×3.20

    // ---- Operator address (authorised to mint/burn on behalf of game) ----
    address public gameOperator;

    // Track current star level for each unit token
    mapping(uint256 => uint8) private _unitStar;

    // ---- Events ----
    event UnitMinted(address indexed player, uint256 indexed unitId, uint8 stars, uint256 tokenId);
    event UnitMerged(address indexed player, uint256 indexed unitId, uint8 newStars);
    event OperatorSet(address indexed oldOperator, address indexed newOperator);

    modifier onlyOperator() {
        require(msg.sender == gameOperator || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() ERC1155("") Ownable(msg.sender) {}

    // ---- Operator Management ----

    function setGameOperator(address _operator) external onlyOwner {
        emit OperatorSet(gameOperator, _operator);
        gameOperator = _operator;
    }

    // ---- Minting / Buying Units ----

    /**
     * @notice Mint a unit NFT for a player. Called by game contract when player buys from shop.
     * @param player Address receiving the unit.
     * @param unitId  Unit type (WARRIOR=0, ARCHER=1, KNIGHT=2, ROGUE=3).
     * @param stars   Initial star level (always 1 for new purchases).
     * @return tokenId Internal tracking ID.
     */
    function mintUnit(
        address player,
        uint256 unitId,
        uint8 stars
    ) external onlyOperator returns (uint256) {
        require(unitId < 4, "Invalid unit type");
        require(stars >= 1 && stars <= 3, "Invalid star level");

        uint256 tokenId = _nextTokenId();
        _mint(player, tokenId, 1, abi.encodePacked(unitId, stars));

        emit UnitMinted(player, unitId, stars, tokenId);
        return tokenId;
    }

    // ---- Merging Units ----

    /**
     * @notice Burn 3 units of same type+stars and mint 1 unit with +1 star.
     * @param player Address of the player.
     * @param unitId Unit type.
     * @param stars  Current star level (must be 1 or 2).
     * @param burnTokenIds Token IDs of the 3 units to burn.
     * @return newTokenId The newly minted merged unit.
     */
    function mergeUnits(
        address player,
        uint256 unitId,
        uint8 stars,
        uint256[3] calldata burnTokenIds
    ) external onlyOperator returns (uint256) {
        require(stars >= 1 && stars <= 2, "Can only merge stars 1 or 2");
        require(unitId < 4, "Invalid unit type");

        // Burn the 3 source units
        for (uint256 i = 0; i < 3; i++) {
            require(balanceOf(player, burnTokenIds[i]) >= 1, "Player doesn't own unit");
            _burn(player, burnTokenIds[i], 1);
        }

        uint8 newStars = stars + 1;
        uint256 newTokenId = _nextTokenId();
        _mint(player, newTokenId, 1, abi.encodePacked(unitId, newStars));

        emit UnitMerged(player, unitId, newStars);
        return newTokenId;
    }

    // ---- Metadata ----

    function uri(uint256 tokenId) public view override returns (string memory) {
        // Return a JSON metadata URI. In production, this would point to IPFS/API.
        return string(
            abi.encodePacked(
                '{"name":"', unitNames[tokenId % 4], '","unitId":', tokenId.toString(), '}'
            )
        );
    }

    // ---- View Helpers ----

    function getUnitCost(uint256 unitId) external view returns (uint256) {
        require(unitId < 4, "Invalid unit type");
        return unitCosts[unitId];
    }

    function getStarMultiplier(uint8 stars) external pure returns (uint256) {
        if (stars == 2) return STAR_2_MULTIPLIER;
        if (stars == 3) return STAR_3_MULTIPLIER;
        return STAR_1_MULTIPLIER;
    }

    // ---- Internal ----

    uint256 private _tokenIdCounter;

    function _nextTokenId() private returns (uint256) {
        _tokenIdCounter++;
        return _tokenIdCounter;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
