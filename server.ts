import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory state storage for Live Prediction matching original format
interface GameState {
  issueNumber: string;
  timeLeft: number; // in seconds
  history: Array<{
    issue: string;
    number: number;
    color: 'red' | 'green' | 'violet' | 'red-violet' | 'green-violet';
    size: 'big' | 'small';
    time: string;
  }>;
}

// Generate an issue number based on date and an incrementing index
const getFormattedIssueNumber = (offsetMinutes = 0): string => {
  const now = new Date();
  if (offsetMinutes !== 0) {
    now.setMinutes(now.getMinutes() + offsetMinutes);
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Calculate index of minute in the day (e.g. 1440 mins in a day)
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const indexStr = String(totalMinutes + 1).padStart(4, '0');
  
  return `${year}${month}${day}${indexStr}`;
};

// Seed initial game histories
const generateInitialHistory = (count: number) => {
  const result = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const minOffset = -i - 1;
    const issueNum = getFormattedIssueNumber(minOffset);
    const num = Math.floor(Math.random() * 10);
    
    let color: 'red' | 'green' | 'violet' | 'red-violet' | 'green-violet' = 'red';
    if (num === 0) {
      color = 'red-violet';
    } else if (num === 5) {
      color = 'green-violet';
    } else if (num % 2 === 0) {
      color = 'red';
    } else {
      color = 'green';
    }

    const size = num >= 5 ? 'big' : 'small';
    const hTime = new Date(now.getTime() + minOffset * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    result.push({
      issue: issueNum,
      number: num,
      color,
      size,
      time: hTime
    });
  }
  return result;
};

const gameModes: { [key: string]: GameState } = {
  '1m': {
    issueNumber: getFormattedIssueNumber(),
    timeLeft: 60 - (new Date().getSeconds()),
    history: generateInitialHistory(30)
  },
  '3m': {
    issueNumber: getFormattedIssueNumber(),
    timeLeft: 180 - ((new Date().getMinutes() % 3) * 60 + new Date().getSeconds()),
    history: generateInitialHistory(30).map((h) => ({
      ...h,
      issue: h.issue.substring(0, h.issue.length - 1) + 'X' // Distinguish modes
    }))
  },
  '5m': {
    issueNumber: getFormattedIssueNumber(),
    timeLeft: 300 - ((new Date().getMinutes() % 5) * 60 + new Date().getSeconds()),
    history: generateInitialHistory(30)
  },
  '10m': {
    issueNumber: getFormattedIssueNumber(),
    timeLeft: 600 - ((new Date().getMinutes() % 10) * 60 + new Date().getSeconds()),
    history: generateInitialHistory(30)
  }
};

// VIP Level Configuration Utility Functions
function getVIPLevel(transactions: any[]): number {
  if (!transactions) return 1;
  const deposits = transactions.filter(t => t.type === 'deposit' && t.status === 'success' && t.id !== 'BONUS50');
  const totalDeposited = deposits.reduce((sum, t) => sum + t.amount, 0);
  if (totalDeposited >= 500000) return 7;
  if (totalDeposited >= 100000) return 6;
  if (totalDeposited >= 20000) return 5;
  if (totalDeposited >= 5000) return 4;
  if (totalDeposited >= 1000) return 3;
  if (totalDeposited >= 100) return 2;
  return 1;
}

function getTotalDeposits(transactions: any[]): number {
  if (!transactions) return 0;
  const deposits = transactions.filter(t => t.type === 'deposit' && t.status === 'success' && t.id !== 'BONUS50');
  return deposits.reduce((sum, t) => sum + t.amount, 0);
}

// In-Memory user sessions simulating live backend state
const userSessions: {
  [phone: string]: {
    phoneNumber: string;
    username: string;
    password?: string;
    balance: number;
    referralCode: string;
    bankCard?: any;
    transactions: any[];
    bets: any[];
  }
} = {
  '9876543210': {
    phoneNumber: '9876543210',
    username: 'JackwarLucky7',
    password: 'password123',
    balance: 50000.00,
    referralCode: 'JWCLUB119',
    bankCard: {
      cardholderName: "CHETAN SINGH",
      bankName: "State Bank of India",
      accountNumber: "XXXXXXXX4921",
      ifscCode: "SBIN0001827"
    },
    transactions: [
      { id: 'TXN1002', type: 'deposit', amount: 50000, status: 'success', timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString() },
      { id: 'TXN1001', type: 'deposit', amount: 1000, status: 'success', timestamp: new Date(Date.now() - 3600000 * 12).toLocaleString() }
    ],
    bets: []
  }
};

// Background ticking for game rounds
setInterval(() => {
  const currentSec = new Date().getSeconds();
  const currentMin = new Date().getMinutes();

  // 1m Mode
  let mode1 = gameModes['1m'];
  mode1.timeLeft = 60 - currentSec;
  if (mode1.timeLeft <= 0 || mode1.issueNumber !== getFormattedIssueNumber()) {
    // Round end, roll new result
    const newNum = Math.floor(Math.random() * 10);
    let newCol: 'red' | 'green' | 'violet' | 'red-violet' | 'green-violet' = 'red';
    if (newNum === 0) newCol = 'red-violet';
    else if (newNum === 5) newCol = 'green-violet';
    else if (newNum % 2 === 0) newCol = 'red';
    else newCol = 'green';
    
    const newSize = newNum >= 5 ? 'big' : 'small';
    const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    mode1.history.unshift({
      issue: mode1.issueNumber,
      number: newNum,
      color: newCol,
      size: newSize,
      time: newTime
    });
    if (mode1.history.length > 100) mode1.history.pop();
    
    // Process game bets for this round
    Object.keys(userSessions).forEach(phone => {
      const user = userSessions[phone];
      user.bets.forEach(b => {
        if (b.duration === '1m' && b.issue === mode1.issueNumber && b.status === 'pending') {
          let selection = b.selection;
          let won = false;
          let mult = b.multiplier;

          if (selection === 'green' && (newCol === 'green' || newCol === 'green-violet')) {
            won = true;
          } else if (selection === 'red' && (newCol === 'red' || newCol === 'red-violet')) {
            won = true;
          } else if (selection === 'violet' && (newCol === 'red-violet' || newCol === 'green-violet')) {
            won = true;
          } else if (selection === 'big' && newSize === 'big') {
            won = true;
          } else if (selection === 'small' && newSize === 'small') {
            won = true;
          } else if (selection === String(newNum)) {
            won = true;
          }

          if (won) {
            b.status = 'won';
            b.winAmount = b.amount * mult;
            user.balance += b.winAmount;
          } else {
            b.status = 'lost';
            b.winAmount = 0;
          }
        }
      });
    });

    mode1.issueNumber = getFormattedIssueNumber();
  }

  // 3m Mode
  let mode3 = gameModes['3m'];
  const mode3Left = 180 - ((currentMin % 3) * 60 + currentSec);
  mode3.timeLeft = mode3Left <= 0 ? 180 : mode3Left;
  if (mode3Left <= 0) {
    const newNum = Math.floor(Math.random() * 10);
    let newCol: 'red' | 'green' | 'violet' | 'red-violet' | 'green-violet' = 'red';
    if (newNum === 0) newCol = 'red-violet';
    else if (newNum === 5) newCol = 'green-violet';
    else if (newNum % 2 === 0) newCol = 'red';
    else newCol = 'green';
    
    const newSize = newNum >= 5 ? 'big' : 'small';
    const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    mode3.history.unshift({
      issue: mode3.issueNumber,
      number: newNum,
      color: newCol,
      size: newSize,
      time: newTime
    });
    if (mode3.history.length > 100) mode3.history.pop();

    Object.keys(userSessions).forEach(phone => {
      const user = userSessions[phone];
      user.bets.forEach(b => {
        if (b.duration === '3m' && b.issue === mode3.issueNumber && b.status === 'pending') {
          let selection = b.selection;
          let won = false;
          let mult = b.multiplier;

          if (selection === 'green' && (newCol === 'green' || newCol === 'green-violet')) won = true;
          else if (selection === 'red' && (newCol === 'red' || newCol === 'red-violet')) won = true;
          else if (selection === 'violet' && (newCol === 'red-violet' || newCol === 'green-violet')) won = true;
          else if (selection === 'big' && newSize === 'big') won = true;
          else if (selection === 'small' && newSize === 'small') won = true;
          else if (selection === String(newNum)) won = true;

          if (won) {
            b.status = 'won';
            b.winAmount = b.amount * mult;
            user.balance += b.winAmount;
          } else {
            b.status = 'lost';
            b.winAmount = 0;
          }
        }
      });
    });

    mode3.issueNumber = getFormattedIssueNumber() + 'X';
  }
}, 1000);

// API Endpoints
app.get("/api/game-state/:duration", (req, res) => {
  const duration = req.params.duration;
  if (gameModes[duration]) {
    res.json(gameModes[duration]);
  } else {
    res.status(404).json({ error: "Invalid duration mode" });
  }
});

// Auth Simulator
app.post("/api/login", (req, res) => {
  const { phoneNumber, password } = req.body;
  
  if (!phoneNumber || phoneNumber.length < 10) {
    return res.status(400).json({ error: "Please enter a valid 10-digit handset number" });
  }

  if (!password || password.trim().length === 0) {
    return res.status(400).json({ error: "Please enter your password" });
  }

  // Create or retrieve session
  if (!userSessions[phoneNumber]) {
    userSessions[phoneNumber] = {
      phoneNumber,
      password: password, // Core secure registration
      username: `JWPlayer_${phoneNumber.slice(-4)}`,
      balance: 0.00,
      referralCode: `JWCLUB${Math.floor(100 + Math.random() * 900)}`,
      transactions: [],
      bets: []
    };
  } else {
    // If user exists, verify password
    if (userSessions[phoneNumber].password && userSessions[phoneNumber].password !== password) {
      return res.status(401).json({ error: "Incorrect password. Please verify your phone number and password." });
    }
  }

  const user = userSessions[phoneNumber];
  const currentVIP = getVIPLevel(user.transactions);
  const totalDep = getTotalDeposits(user.transactions);

  res.json({
    phoneNumber,
    username: user.username,
    balance: user.balance,
    referralCode: user.referralCode,
    vipLevel: currentVIP,
    totalDeposits: totalDep
  });
});

app.get("/api/profile/:phone", (req, res) => {
  const phone = req.params.phone;
  if (userSessions[phone]) {
    const user = userSessions[phone];
    const currentVIP = getVIPLevel(user.transactions);
    const totalDep = getTotalDeposits(user.transactions);
    res.json({
      phoneNumber: user.phoneNumber,
      username: user.username,
      balance: user.balance,
      referralCode: user.referralCode,
      bankCard: user.bankCard,
      transactions: user.transactions,
      bets: user.bets,
      vipLevel: currentVIP,
      totalDeposits: totalDep
    });
  } else {
    res.status(404).json({ error: "Session expired or user not found" });
  }
});

// Submit placing bet
app.post("/api/bet", (req, res) => {
  const { phone, duration, selection, amount, multiplier, issue } = req.body;

  if (!phone || !userSessions[phone]) {
    return res.status(403).json({ error: "Unauthorized session" });
  }

  const user = userSessions[phone];
  if (user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance. Please deposit/recharge." });
  }

  user.balance -= amount;
  
  const newBet = {
    id: `JW-${Math.floor(100000 + Math.random() * 900000)}`,
    issue: issue || getFormattedIssueNumber(),
    duration: duration || '1m',
    selection: selection,
    amount,
    multiplier: multiplier || 1,
    status: 'pending',
    timestamp: new Date().toLocaleString()
  };

  user.bets.unshift(newBet);
  res.json({ success: true, balance: user.balance, bet: newBet });
});

// Real-Time Action Endpoints for Spribe, Jili, BGaming and InOut games:
// 1. Spribe Aviator Flight Placement
app.post("/api/games/aviator/bet", (req, res) => {
  const { phone, amount } = req.body;
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });
  
  const user = userSessions[phone];
  const amt = parseFloat(amount);
  if (user.balance < amt) return res.status(400).json({ error: "Insufficient balance" });
  
  user.balance -= amt;
  const newBet = {
    id: `AV-${Math.floor(100000 + Math.random() * 900000)}`,
    issue: "Aviator Live Flight",
    duration: "Instant",
    selection: "Aviator Flight",
    amount: amt,
    multiplier: 1,
    status: "pending",
    timestamp: new Date().toLocaleString()
  };
  user.bets.unshift(newBet);
  res.json({ success: true, balance: user.balance, betId: newBet.id });
});

app.post("/api/games/aviator/claim", (req, res) => {
  const { phone, betId, multiplier } = req.body;
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });
  
  const user = userSessions[phone];
  const bet = user.bets.find(b => b.id === betId);
  if (!bet || bet.status !== "pending") return res.status(400).json({ error: "Invalid flight session" });
  
  const multVal = parseFloat(multiplier);
  const win = bet.amount * multVal;
  
  bet.status = "won";
  bet.multiplier = multVal;
  bet.winAmount = win;
  user.balance += win;
  
  res.json({ success: true, balance: user.balance, winAmount: win });
});

// 2. Jili Slot Engine
app.post("/api/games/slot/spin", (req, res) => {
  const { phone, amount, multiplier } = req.body;
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });
  
  const user = userSessions[phone];
  const stake = parseFloat(amount);
  if (user.balance < stake) return res.status(400).json({ error: "Insufficient scale balance" });
  
  user.balance -= stake;
  
  // Decide slot multiplier result
  const roll = Math.random();
  let payoutMultiplier = 0;
  let status: 'won' | 'lost' = 'lost';
  
  if (roll > 0.95) { payoutMultiplier = 20; status = 'won'; } // Super Big
  else if (roll > 0.82) { payoutMultiplier = 5; status = 'won'; } // Mini mega
  else if (roll > 0.55) { payoutMultiplier = 2; status = 'won'; } // Double reward
  else if (roll > 0.38) { payoutMultiplier = 0.5; status = 'won'; } // Return half
  
  const win = stake * payoutMultiplier;
  user.balance += win;

  const newBet = {
    id: `JL-${Math.floor(100000 + Math.random() * 900000)}`,
    issue: "Jili Fortune Slot",
    duration: "Instant",
    selection: "Slot Reel",
    amount: stake,
    multiplier: payoutMultiplier,
    winAmount: win,
    status: status,
    timestamp: new Date().toLocaleString()
  };
  
  user.bets.unshift(newBet);
  res.json({ success: true, balance: user.balance, multiplier: payoutMultiplier, winAmount: win });
});

// 3. BGaming Plinko Engine
app.post("/api/games/plinko/drop", (req, res) => {
  const { phone, amount, targetMultiplier } = req.body;
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });
  
  const user = userSessions[phone];
  const stake = parseFloat(amount);
  if (user.balance < stake) return res.status(400).json({ error: "Insufficient balance for drop" });
  
  user.balance -= stake;
  
  const mult = parseFloat(targetMultiplier);
  const win = stake * mult;
  user.balance += win;
  
  const newBet = {
    id: `BG-${Math.floor(100000 + Math.random() * 900000)}`,
    issue: "Plinko Drop Arena",
    duration: "Instant",
    selection: `Bucket ${mult}x`,
    amount: stake,
    multiplier: mult,
    winAmount: win,
    status: mult >= 1.0 ? "won" : "lost",
    timestamp: new Date().toLocaleString()
  };
  
  user.bets.unshift(newBet);
  res.json({ success: true, balance: user.balance, winAmount: win });
});

// 4. InOut Mines Engine
app.post("/api/games/mines/start", (req, res) => {
  const { phone, amount } = req.body;
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });
  
  const user = userSessions[phone];
  const stake = parseFloat(amount);
  if (user.balance < stake) return res.status(400).json({ error: "Insufficient balance" });
  
  user.balance -= stake;
  
  const betId = `MN-${Math.floor(100000 + Math.random() * 900000)}`;
  const newBet = {
    id: betId,
    issue: "InOut Mines Grid",
    duration: "Instant",
    selection: "Mines Field",
    amount: stake,
    multiplier: 1,
    status: "pending",
    timestamp: new Date().toLocaleString()
  };
  
  user.bets.unshift(newBet);
  res.json({ success: true, balance: user.balance, betId });
});

app.post("/api/games/mines/claim", (req, res) => {
  const { phone, betId, multiplier, hitBomb } = req.body;
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });
  
  const user = userSessions[phone];
  const bet = user.bets.find(b => b.id === betId);
  if (!bet || bet.status !== "pending") return res.status(400).json({ error: "Invalid Mines session" });
  
  if (hitBomb) {
    bet.status = "lost";
    bet.multiplier = 0;
    bet.winAmount = 0;
    return res.json({ success: true, balance: user.balance, winAmount: 0 });
  }
  
  const multVal = parseFloat(multiplier);
  const win = bet.amount * multVal;
  
  bet.status = "won";
  bet.multiplier = multVal;
  bet.winAmount = win;
  user.balance += win;
  
  res.json({ success: true, balance: user.balance, winAmount: win });
});

// 5. PVC Dragon Tiger Game
app.post("/api/games/dragontiger/play", (req, res) => {
  const { phone, amount, selection } = req.body;
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });

  const user = userSessions[phone];
  const stake = parseFloat(amount);
  if (user.balance < stake) return res.status(400).json({ error: "Insufficient balance" });

  user.balance -= stake;

  // Draw two distinct card ranks (1-13)
  const dragonCard = Math.floor(1 + Math.random() * 13);
  const tigerCard = Math.floor(1 + Math.random() * 13);
  const suits = ["♠", "♥", "♦", "♣"];
  const dragonSuit = suits[Math.floor(Math.random() * 4)];
  const tigerSuit = suits[Math.floor(Math.random() * 4)];

  let outcome: 'dragon' | 'tiger' | 'tie' = 'tie';
  if (dragonCard > tigerCard) outcome = 'dragon';
  else if (tigerCard > dragonCard) outcome = 'tiger';

  let multiplier = 0;
  if (selection === outcome) {
    if (outcome === 'tie') {
      multiplier = 9; // Tie pays 9x
    } else {
      multiplier = 2; // Dragon or Tiger wins pay 2x
    }
  } else if (outcome === 'tie' && (selection === 'dragon' || selection === 'tiger')) {
    // Return half stake upon sudden tie
    multiplier = 0.5;
  }

  const win = stake * multiplier;
  user.balance += win;

  const newBet = {
    id: `DT-${Math.floor(100000 + Math.random() * 900000)}`,
    issue: "Dragon Tiger PVC",
    duration: "Instant",
    selection: `${selection.toUpperCase()}`,
    amount: stake,
    multiplier: multiplier,
    winAmount: win,
    status: win > stake ? "won" : (win > 0 ? "won" : "lost"),
    timestamp: new Date().toLocaleString()
  };

  user.bets.unshift(newBet);

  res.json({
    success: true,
    balance: user.balance,
    dragonCard,
    dragonSuit,
    tigerCard,
    tigerSuit,
    outcome,
    winAmount: win,
    multiplier
  });
});

// 6. Casino Royal Roulette Spin
app.post("/api/games/roulette/spin", (req, res) => {
  const { phone, amount, selection } = req.body; // selection: "red" | "black" | "even" | "odd" | a string number "0"-"36"
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });

  const user = userSessions[phone];
  const stake = parseFloat(amount);
  if (user.balance < stake) return res.status(400).json({ error: "Insufficient balance" });

  user.balance -= stake;

  const winningNumber = Math.floor(Math.random() * 37); // 0 to 36
  
  const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const isRed = reds.includes(winningNumber);
  const colorOutcome = winningNumber === 0 ? "green" : (isRed ? "red" : "black");
  
  const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
  const isOdd = winningNumber % 2 !== 0;

  let multiplier = 0;
  if (selection === "red" && colorOutcome === "red") multiplier = 2;
  else if (selection === "black" && colorOutcome === "black") multiplier = 2;
  else if (selection === "even" && isEven) multiplier = 2;
  else if (selection === "odd" && isOdd) multiplier = 2;
  else if (selection === String(winningNumber)) multiplier = 36; // Number jackpot pays 36x

  const win = stake * multiplier;
  user.balance += win;

  const newBet = {
    id: `RL-${Math.floor(100000 + Math.random() * 900000)}`,
    issue: "Vegas Royal Roulette",
    duration: "Instant",
    selection: `${selection.toUpperCase()}`,
    amount: stake,
    multiplier: multiplier,
    winAmount: win,
    status: win > 0 ? "won" : "lost",
    timestamp: new Date().toLocaleString()
  };

  user.bets.unshift(newBet);

  res.json({
    success: true,
    balance: user.balance,
    winningNumber,
    colorOutcome,
    winAmount: win,
    multiplier
  });
});

// 7. Jili Ocean Hunter Fishing Game
app.post("/api/games/fishing/shoot", (req, res) => {
  const { phone, amount, fishMultiplier, fishName } = req.body;
  if (!phone || !userSessions[phone]) return res.status(403).json({ error: "Unauthorized" });

  const user = userSessions[phone];
  const bulletCost = parseFloat(amount);
  if (user.balance < bulletCost) return res.status(400).json({ error: "Needs reload" });

  user.balance -= bulletCost;

  const mult = parseFloat(fishMultiplier);
  // Hit capture probability scales down for high-tier fish
  const captureProbability = Math.min(0.9, 0.72 / mult);
  const isCaptured = Math.random() < captureProbability;

  let win = 0;
  let multiplier = 0;
  if (isCaptured) {
    multiplier = mult;
    win = bulletCost * multiplier;
    user.balance += win;
  }

  // To keep player feeds clear, we write a single bet log upon high wins >= 3x bullet cost
  if (win >= bulletCost * 2) {
    const newBet = {
      id: `FS-${Math.floor(100000 + Math.random() * 900000)}`,
      issue: `Catch ${fishName}`,
      duration: "Instant",
      selection: `${fishName} ${mult}x`,
      amount: bulletCost,
      multiplier: multiplier,
      winAmount: win,
      status: "won",
      timestamp: new Date().toLocaleString()
    };
    user.bets.unshift(newBet);
  }

  res.json({
    success: true,
    balance: user.balance,
    isCaptured,
    winAmount: win
  });
});

// Process deposits/withdrawals
app.post("/api/transaction", (req, res) => {
  const { phone, type, amount, channel, bankDetails } = req.body;

  if (!phone || !userSessions[phone]) {
    return res.status(403).json({ error: "Unauthorized session" });
  }

  const user = userSessions[phone];
  const amt = parseFloat(amount);

  if (type === 'withdrawal') {
    // Check if player has deposited at least ₹100
    const deposits = user.transactions.filter(t => t.type === 'deposit' && t.status === 'success' && t.id !== 'BONUS50');
    const totalDeposited = deposits.reduce((sum, t) => sum + t.amount, 0);

    if (totalDeposited < 100) {
      return res.status(400).json({ 
        error: `To unlock withdrawals, you must first complete a minimum deposit of ₹100. Your current total deposit is ₹${totalDeposited}. Please deposit ₹100 or more using the UPI/Scanner.` 
      });
    }

    if (user.balance < amt) {
      return res.status(400).json({ error: "Insufficient balance for withdrawal" });
    }
    user.balance -= amt;
  } else {
    user.balance += amt;
  }

  if (bankDetails) {
    user.bankCard = bankDetails;
  }

  const newTxn = {
    id: `TXN${Math.floor(1000 + Math.random() * 9000)}`,
    type,
    amount: amt,
    status: 'success',
    channel: channel || 'UPI Instant',
    timestamp: new Date().toLocaleString()
  };

  user.transactions.unshift(newTxn);
  res.json({ success: true, balance: user.balance, transaction: newTxn });
});

// Update Profile
app.post("/api/profile/update", (req, res) => {
  const { phone, username } = req.body;
  if (!phone || !userSessions[phone]) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  userSessions[phone].username = username;
  res.json({ success: true, username });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
