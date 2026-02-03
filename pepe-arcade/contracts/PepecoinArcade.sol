// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PepecoinArcade {
    address public owner;
    address public pepecoinAddress = 0xA9E8aCf069C58aEc8825542845Fd754e41a9489A;
    
    // Adjustable Parameters (Option B: 100 PEPE Entry)
    uint256 public entryFee = 100 * 10**18; 
    uint256 public cycleSize = 60;
    
    // Payout split: Total 6000 tokens collected per 60 games
    uint256 public payout1st = 2500 * 10**18;
    uint256 public payout2nd = 1000 * 10**18;
    uint256 public payout3rd = 500 * 10**18;
    uint256 public payoutDev = 2000 * 10**18;

    struct Player {
        address addr;
        uint256 score;
        string name;
    }

    // Top 3 Leaderboard
    Player[3] public topPlayers;
    uint256 public gameCount;

    event GamePlayed(address indexed player, uint256 totalGames);
    event PayoutTriggered(address indexed p1, address indexed p2, address indexed p3, uint256 totalAmount);
    event NewHighScore(address indexed player, uint256 score, uint256 rank);
    event SettingsUpdated(string parameter, uint256 newValue);

    constructor() {
        owner = 0xAfBDfCDfa5454E45aa9AeE833DF87cC3Ec511d1b;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ADMIN FUNCTIONS - Change rules without redeploying
    function setEntryFee(uint256 _fee) external onlyOwner {
        entryFee = _fee;
        emit SettingsUpdated("entryFee", _fee);
    }

    function setCycleSize(uint256 _size) external onlyOwner {
        cycleSize = _size;
        emit SettingsUpdated("cycleSize", _size);
    }

    function setPayouts(uint256 _p1, uint256 _p2, uint256 _p3, uint256 _dev) external onlyOwner {
        // Ensure total equals the tokens collected in a cycle (e.g. 60 coins)
        payout1st = _p1;
        payout2nd = _p2;
        payout3rd = _p3;
        payoutDev = _dev;
        emit SettingsUpdated("payoutsUpdated", _p1 + _p2 + _p3 + _dev);
    }

    function playGame() external {
        require(IERC20(pepecoinAddress).transferFrom(msg.sender, address(this), entryFee), "Transfer failed");
        
        gameCount++;
        emit GamePlayed(msg.sender, gameCount);

        if (gameCount >= cycleSize) {
            _triggerPayout();
        }
    }

    function submitScore(uint256 score, string memory name) external {
        // Find if score fits in Top 3
        int8 rank = -1;
        if (score > topPlayers[0].score) {
            rank = 0;
        } else if (score > topPlayers[1].score) {
            rank = 1;
        } else if (score > topPlayers[2].score) {
            rank = 2;
        }

        if (rank >= 0) {
            _updateLeaderboard(uint8(rank), msg.sender, score, name);
            emit NewHighScore(msg.sender, score, uint256(uint8(rank) + 1));
        }
    }

    function _updateLeaderboard(uint8 rank, address addr, uint256 score, string memory name) internal {
        // Shift lower ranks down
        if (rank == 0) {
            topPlayers[2] = topPlayers[1];
            topPlayers[1] = topPlayers[0];
        } else if (rank == 1) {
            topPlayers[2] = topPlayers[1];
        }
        
        // Insert new score
        topPlayers[rank] = Player(addr, score, name);
    }

    function _triggerPayout() internal {
        // Distribute to Top 3
        if (topPlayers[0].addr != address(0)) {
            IERC20(pepecoinAddress).transfer(topPlayers[0].addr, payout1st);
        } else {
            IERC20(pepecoinAddress).transfer(owner, payout1st);
        }

        if (topPlayers[1].addr != address(0)) {
            IERC20(pepecoinAddress).transfer(topPlayers[1].addr, payout2nd);
        } else {
            IERC20(pepecoinAddress).transfer(owner, payout2nd);
        }

        if (topPlayers[2].addr != address(0)) {
            IERC20(pepecoinAddress).transfer(topPlayers[2].addr, payout3rd);
        } else {
            IERC20(pepecoinAddress).transfer(owner, payout3rd);
        }

        // Distribute Dev share
        IERC20(pepecoinAddress).transfer(owner, payoutDev);

        emit PayoutTriggered(topPlayers[0].addr, topPlayers[1].addr, topPlayers[2].addr, payout1st + payout2nd + payout3rd + payoutDev);

        // Reset
        gameCount = 0;
        delete topPlayers;
    }

    function emergencyWithdraw() external {
        require(msg.sender == owner, "Not owner");
        uint256 balance = IERC20(pepecoinAddress).balanceOf(address(this));
        IERC20(pepecoinAddress).transfer(owner, balance);
    }
}
