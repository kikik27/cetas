// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GameUnits.sol";
import "./RewardToken.sol";

/**
 * @title CeloTactics
 * @notice Main game contract for Celo Tactics auto-battler.
 *
 *         Manages:
 *         - Tournament match entry with cUSD stake
 *         - Unit purchase & merge (delegates to GameUnits ERC-1155)
 *         - Battle result settlement & prize distribution
 *         - Reward token minting for winners
 */
contract CeloTactics is Ownable, ReentrancyGuard {
    GameUnits public gameUnits;
    CetasReward public rewardToken;

    // ---- Match / Tournament State ----
    struct Match {
        uint256 id;
        uint8   playerCount;
        uint8   maxPlayers;       // 8 players per match
        uint256 entryFee;         // in wei (cUSD, 18 decimals)
        uint256 prizePool;        // accumulated entry fees
        bool    settled;          // true after rewards distributed
        uint256 createdAt;
    }

    struct PlayerEntry {
        bool    entered;
        uint8   rank;             // 1-8, 0 = not yet ranked
        bool    claimed;
    }

    // matchId => Match
    mapping(uint256 => Match) public matches;
    // matchId => player => PlayerEntry
    mapping(uint256 => mapping(address => PlayerEntry)) public matchPlayers;

    uint256 public nextMatchId;
    uint256 public constant MAX_PLAYERS = 8;
    uint256 public constant TOP_WINNERS = 4;

    // ---- Treasury (developer fee) ----
    uint256 public treasuryBalance;
    uint256 public constant TREASURY_FEE_BPS = 500; // 5%

    // ---- Events ----
    event MatchCreated(uint256 indexed matchId, uint256 entryFee);
    event PlayerEntered(uint256 indexed matchId, address indexed player);
    event UnitPurchased(uint256 indexed matchId, address indexed player, uint256 unitId, uint8 stars);
    event UnitsMerged(uint256 indexed matchId, address indexed player, uint256 unitId, uint8 newStars);
    event BattleSettled(uint256 indexed matchId, address[] winners, uint256[] prizes);
    event RewardClaimed(uint256 indexed matchId, address indexed player, uint256 prizeAmount, uint256 tokenAmount);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

    constructor(address _gameUnits, address _rewardToken) Ownable(msg.sender) {
        gameUnits = GameUnits(_gameUnits);
        rewardToken = CetasReward(_rewardToken);
    }

    // ========== MATCH MANAGEMENT ==========

    /**
     * @notice Create a new tournament match with specified entry fee.
     * @param entryFee Entry fee in wei (cUSD has 18 decimals, so 0.1 cUSD = 0.1e18).
     */
    function createMatch(uint256 entryFee) external onlyOwner returns (uint256) {
        uint256 matchId = nextMatchId++;

        matches[matchId] = Match({
            id: matchId,
            playerCount: 0,
            maxPlayers: uint8(MAX_PLAYERS),
            entryFee: entryFee,
            prizePool: 0,
            settled: false,
            createdAt: block.timestamp
        });

        emit MatchCreated(matchId, entryFee);
        return matchId;
    }

    /**
     * @notice Player enters a match by paying the entry fee in cUSD.
     * @param matchId The match to enter.
     */
    function enterMatch(uint256 matchId) external payable nonReentrant {
        Match storage m = matches[matchId];
        require(m.id == matchId && !m.settled, "Match not active");
        require(m.playerCount < m.maxPlayers, "Match full");
        require(!matchPlayers[matchId][msg.sender].entered, "Already entered");
        require(msg.value >= m.entryFee, "Insufficient entry fee");

        // Refund excess
        if (msg.value > m.entryFee) {
            payable(msg.sender).transfer(msg.value - m.entryFee);
        }

        m.playerCount++;
        m.prizePool += m.entryFee;
        matchPlayers[matchId][msg.sender] = PlayerEntry({
            entered: true,
            rank: 0,
            claimed: false
        });

        emit PlayerEntered(matchId, msg.sender);
    }

    // ========== UNIT OPERATIONS ==========

    /**
     * @notice Buy a unit from the shop. Costs gold (tracked off-chain per match session),
     *         but the mint is recorded on-chain for ownership.
     * @param matchId Current match.
     * @param unitId  Unit type (0=Warrior, 1=Archer, 2=Knight, 3=Rogue).
     */
    function buyUnit(uint256 matchId, uint256 unitId) external returns (uint256) {
        require(matchPlayers[matchId][msg.sender].entered, "Not in match");
        require(!matches[matchId].settled, "Match settled");

        uint8 stars = 1;
        uint256 tokenId = gameUnits.mintUnit(msg.sender, unitId, stars);

        emit UnitPurchased(matchId, msg.sender, unitId, stars);
        return tokenId;
    }

    /**
     * @notice Merge 3 units of same type+star into 1 stronger unit.
     * @param matchId      Current match.
     * @param unitId       Unit type.
     * @param stars        Current star level (1 or 2).
     * @param burnTokenIds The 3 token IDs to burn.
     */
    function mergeUnits(
        uint256 matchId,
        uint256 unitId,
        uint8 stars,
        uint256[3] calldata burnTokenIds
    ) external returns (uint256) {
        require(matchPlayers[matchId][msg.sender].entered, "Not in match");
        require(!matches[matchId].settled, "Match settled");

        uint256 newTokenId = gameUnits.mergeUnits(msg.sender, unitId, stars, burnTokenIds);

        emit UnitsMerged(matchId, msg.sender, unitId, stars + 1);
        return newTokenId;
    }

    // ========== BATTLE SETTLEMENT ==========

    /**
     * @notice Settle a match after battle completes. Distributes cUSD prizes to top 4,
     *         mints CETAS reward tokens to winners, takes treasury cut.
     * @param matchId The match to settle.
     * @param rankedPlayers Array of player addresses in rank order (index 0 = rank 1).
     * @param ranks Array of ranks corresponding to each player (1-8).
     */
    function settleMatch(
        uint256 matchId,
        address[] calldata rankedPlayers,
        uint8[] calldata ranks
    ) external onlyOwner nonReentrant {
        Match storage m = matches[matchId];
        require(!m.settled, "Already settled");
        require(rankedPlayers.length == ranks.length, "Length mismatch");
        require(rankedPlayers.length <= MAX_PLAYERS, "Too many players");

        // Record ranks
        for (uint256 i = 0; i < rankedPlayers.length; i++) {
            address player = rankedPlayers[i];
            require(matchPlayers[matchId][player].entered, "Player not in match");
            matchPlayers[matchId][player].rank = ranks[i];
        }

        // Identify top winners
        address[] memory winners = new address[](TOP_WINNERS);
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < rankedPlayers.length && winnerCount < TOP_WINNERS; i++) {
            if (ranks[i] > 0 && ranks[i] <= TOP_WINNERS) {
                winners[winnerCount] = rankedPlayers[i];
                winnerCount++;
            }
        }

        // Prize pool split among winners (equal split for simplicity)
        uint256 treasuryCut = (m.prizePool * TREASURY_FEE_BPS) / 10000;
        uint256 winnablePool = m.prizePool - treasuryCut;
        treasuryBalance += treasuryCut;

        uint256[] memory prizes = new uint256[](winnerCount);

        if (winnerCount > 0) {
            uint256 prizePerWinner = winnablePool / winnerCount;

            for (uint256 i = 0; i < winnerCount; i++) {
                prizes[i] = prizePerWinner;
                matchPlayers[matchId][winners[i]].claimed = false; // ready to claim
            }

            // Mint CETAS reward tokens to winners
            address[] memory winnerAddrs = new address[](winnerCount);
            for (uint256 i = 0; i < winnerCount; i++) {
                winnerAddrs[i] = winners[i];
            }
            rewardToken.mintBatchReward(winnerAddrs);
        }

        m.settled = true;

        emit BattleSettled(matchId, winners, prizes);
    }

    /**
     * @notice Winner claims their cUSD prize from the prize pool.
     * @param matchId The settled match.
     */
    function claimPrize(uint256 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        require(m.settled, "Match not settled");
        PlayerEntry storage entry = matchPlayers[matchId][msg.sender];
        require(entry.entered && entry.rank > 0 && entry.rank <= TOP_WINNERS, "Not a winner");
        require(!entry.claimed, "Already claimed");

        uint256 prizePool = m.prizePool;
        uint256 treasuryCut = (prizePool * TREASURY_FEE_BPS) / 10000;
        uint256 winnablePool = prizePool - treasuryCut;

        // Count winners
        uint256 winnerCount = 0;
        // We iterate over all possible entrants (max 8) - simplified approach
        // In production, store winner list separately
        winnerCount = _countWinners(matchId);

        uint256 prizeAmount = winnablePool / winnerCount;
        entry.claimed = true;

        (bool sent, ) = payable(msg.sender).call{value: prizeAmount}("");
        require(sent, "cUSD transfer failed");

        uint256 tokenAmount = CetasReward(address(rewardToken)).REWARD_PER_WIN();

        emit RewardClaimed(matchId, msg.sender, prizeAmount, tokenAmount);
    }

    // ========== ADMIN ==========

    function withdrawTreasury(address to) external onlyOwner {
        uint256 amount = treasuryBalance;
        treasuryBalance = 0;
        (bool sent, ) = payable(to).call{value: amount}("");
        require(sent, "Treasury withdrawal failed");
        emit TreasuryWithdrawn(to, amount);
    }

    // ========== VIEWS ==========

    function getMatchInfo(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function getPlayerEntry(uint256 matchId, address player) external view returns (PlayerEntry memory) {
        return matchPlayers[matchId][player];
    }

    // ========== INTERNAL ==========

    function _countWinners(uint256 matchId) private view returns (uint256 count) {
        // This is a simplified count. In production, track winner addresses in a separate array.
        // For now, we approximate based on entry count and top 4 logic.
        Match storage m = matches[matchId];
        if (m.playerCount <= TOP_WINNERS) return m.playerCount;
        return TOP_WINNERS;
    }

    receive() external payable {}
}
