import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Play, Award, Smartphone, User, ShieldCheck, HelpCircle, 
  ChevronRight, RefreshCw, Wallet, Flame, Trophy, Coins, CheckCircle, 
  X, AlertCircle, Copy, FileText, ArrowUpRight, ArrowDownLeft, Plus, LogIn, Settings, Edit2,
  Gift, Share2, Compass, Gamepad2, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Import types and unified modular sub-components
import { UserProfile, GameDuration, GameHistoryItem, Bet, BankCard, Transaction } from "./types";
import { JackwarLogo } from "./components/JackwarLogo";
import { AviatorGame } from "./components/AviatorGame";
import { JiliSlots } from "./components/JiliSlots";
import { PlinkoGame } from "./components/PlinkoGame";
import { MinesGame } from "./components/MinesGame";
import { SattaMatkaGame } from "./components/SattaMatkaGame";
import { SportsBettingGame } from "./components/SportsBettingGame";
import { DragonTigerGame } from "./components/DragonTigerGame";
import { CasinoRouletteGame } from "./components/CasinoRouletteGame";
import { FishingHunterGame } from "./components/FishingHunterGame";

// Custom VIP dynamic states
export function getVIPBadgeStyles(level: number) {
  const styles = [
    { text: "VIP 1", bg: "from-zinc-700 to-zinc-800 border-zinc-650 text-zinc-300" }, 
    { text: "VIP 2", bg: "from-amber-800 to-amber-950 border-amber-800 text-amber-200" }, 
    { text: "VIP 3", bg: "from-slate-500 via-slate-600 to-slate-800 border-slate-500 text-slate-100" }, 
    { text: "VIP 4", bg: "from-yellow-600 to-yellow-850 border-yellow-500 text-yellow-100" }, 
    { text: "VIP 5", bg: "from-teal-600 to-teal-850 border-teal-500 text-teal-100" }, 
    { text: "VIP 6", bg: "from-purple-600 via-indigo-750 to-indigo-950 border-indigo-500 text-indigo-100" }, 
    { text: "VIP 7", bg: "from-rose-600 via-amber-500 to-yellow-500 border-amber-400 text-zinc-950 font-black animate-pulse" }, 
  ];
  return styles[(level - 1) || 0] || styles[0];
}

export function getTargetForNextLevel(currentLevel: number): number {
  const levels = [0, 100, 1000, 5000, 20000, 100000, 500000];
  if (currentLevel >= 7) return 500000;
  return levels[currentLevel] || 100;
}

export default function App() {
  // Session State
  const [user, setUser] = useState<UserProfile>({
    username: "",
    phoneNumber: "",
    balance: 0,
    referralCode: "",
    isLoggedIn: false
  });

  // Navigation system
  const [activeTab, setActiveTab] = useState<'home' | 'recharge' | 'withdraw' | 'history' | 'profile' | 'promotion' | 'activity' | 'wallet'>('home');
  const [selectedGameTab, setSelectedGameTab] = useState<'wingo' | 'aviator' | 'slots' | 'plinko' | 'mines' | 'sattamatka' | 'sports'>('wingo');
  const [activeCategory, setActiveCategory] = useState<'lottery' | 'minigames' | 'slots' | 'pvc' | 'casino' | 'sports'>('lottery');
  const [activeGame, setActiveGame] = useState<'wingo' | 'sattamatka' | 'aviator' | 'slots' | 'plinko' | 'mines' | 'sports' | null>(null);
  const [gameMode, setGameMode] = useState<GameDuration>('1m');

  // Input states
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showDemoBox, setShowDemoBox] = useState(false);

  // Active Game State from server (Win-Go)
  const [gameState, setGameState] = useState<{
    issueNumber: string;
    timeLeft: number;
    history: GameHistoryItem[];
  }>({
    issueNumber: "202605210001",
    timeLeft: 60,
    history: []
  });

  // Bet Dialog State
  const [betSelection, setBetSelection] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [betMultiplier, setBetMultiplier] = useState<number>(1);
  const [isBetDialogOpen, setIsBetDialogOpen] = useState(false);
  const [bettingStatus, setBettingStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Recharge / Withdraw states
  const [rechargeAmt, setRechargeAmt] = useState<number>(500);
  const [rechargeChannel, setRechargeChannel] = useState<string>("UPI QuickPay");
  const [upiUTR, setUpiUTR] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [rechargeError, setRechargeError] = useState("");
  const [isRechargeSucess, setIsRechargeSuccess] = useState(false);

  const [withdrawAmt, setWithdrawAmt] = useState<number>(500);
  const [withdrawPassword, setWithdrawPassword] = useState<string>("");
  const [bankDetails, setBankDetails] = useState<BankCard>({
    cardholderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: ""
  });
  const [isWithdrawSuccess, setIsWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  const [serverProfile, setServerProfile] = useState<{
    bankCard?: BankCard;
    transactions: Transaction[];
    bets: Bet[];
  }>({
    transactions: [],
    bets: []
  });

  const [notification, setNotification] = useState<string | null>(
    "👑 Welcome to JackwarClub! Recharge at least ₹100 using UPI to unlock elite withdrawals and VIP milestones."
  );

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  // Sync state loop with backend API
  useEffect(() => {
    let tickCount = 0;
    const fetchGameState = async () => {
      try {
        const res = await fetch(`/api/game-state/${gameMode}`);
        if (res.ok) {
          const data = await res.json();
          setGameState(data);
          
          if (user.isLoggedIn) {
            tickCount++;
            // Check/sync user profile every 5 seconds instead of every 1 second to prevent network congestion/rate limiting
            if (tickCount >= 5) {
              updateUserProfile(user.phoneNumber);
              tickCount = 0;
            }
          }
        }
      } catch (err) {
        // Demote network polling errors to silent logs since transient offline states are normal in preview toggles
        console.debug("Transient game state sync pause:", err);
      }
    };

    fetchGameState();
    const timer = setInterval(fetchGameState, 1000);
    return () => clearInterval(timer);
  }, [gameMode, user.isLoggedIn]);

  const updateUserProfile = async (phone: string) => {
    try {
      const res = await fetch(`/api/profile/${phone}`);
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({
          ...prev,
          balance: data.balance,
          username: data.username,
          referralCode: data.referralCode,
          vipLevel: data.vipLevel,
          totalDeposits: data.totalDeposits
        }));
        setServerProfile({
          bankCard: data.bankCard,
          transactions: data.transactions,
          bets: data.bets
        });
        if (data.bankCard) {
          setBankDetails(data.bankCard);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    if (!phoneInput || phoneInput.length < 10) {
      setAuthError("Enter a valid 10-digit handset number");
      setAuthLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneInput, password: passwordInput })
      });

      if (res.ok) {
        const data = await res.json();
        setUser({
          username: data.username,
          phoneNumber: data.phoneNumber,
          balance: data.balance,
          referralCode: data.referralCode,
          isLoggedIn: true,
          vipLevel: data.vipLevel,
          totalDeposits: data.totalDeposits
        });
        setNewUsername(data.username);
        updateUserProfile(data.phoneNumber);
        setNotification(`🔐 Signed in successfully! Wallet balance: ₹${data.balance.toFixed(2)}`);
      } else {
        const errData = await res.json();
        setAuthError(errData.error || "Authentication blocked");
      }
    } catch (err) {
      setAuthError("Handset authorization timeouts. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser({
      username: "",
      phoneNumber: "",
      balance: 0,
      referralCode: "",
      isLoggedIn: false
    });
    setPhoneInput("");
    setPasswordInput("");
    setServerProfile({ transactions: [], bets: [] });
    setNotification("Session logged out. Securely signed off.");
  };

  const openBetModal = (selection: string) => {
    if (!user.isLoggedIn) {
      setNotification("⚠️ Please sign in or register to place prediction bets.");
      window.scrollTo({ top: 380, behavior: "smooth" });
      return;
    }
    setBetSelection(selection);
    setBetAmount(100);
    setBetMultiplier(1);
    setBettingStatus(null);
    setIsBetDialogOpen(true);
  };

  const placeBet = async () => {
    if (!betSelection) return;
    const totalCost = betAmount * betMultiplier;

    if (user.balance < totalCost) {
      setBettingStatus({ type: 'error', msg: 'Insufficient wallet credits. Check quick recharge.' });
      return;
    }

    try {
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phoneNumber,
          duration: gameMode,
          selection: betSelection,
          amount: totalCost,
          multiplier: betMultiplier,
          issue: gameState.issueNumber
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, balance: data.balance }));
        setBettingStatus({ type: 'success', msg: `Win Go Bet saved on "${betSelection.toUpperCase()}"!` });
        updateUserProfile(user.phoneNumber);
        setTimeout(() => {
          setIsBetDialogOpen(false);
          setBetSelection(null);
        }, 1200);
      } else {
        const err = await res.json();
        setBettingStatus({ type: 'error', msg: err.error || 'Failed to authorize prediction' });
      }
    } catch (err) {
      setBettingStatus({ type: 'error', msg: 'System timeouts. Retry prediction.' });
    }
  };

  const processRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeError("");
    if (rechargeAmt <= 0) return;

    if (!upiUTR || upiUTR.length !== 12) {
      setRechargeError("Enforce error: Please input a valid, authentic 12-digit UPI UTR/Ref number before claiming reload credits.");
      return;
    }

    try {
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phoneNumber,
          type: 'deposit',
          amount: rechargeAmt,
          channel: `${rechargeChannel} (Ref: ${upiUTR})`
        })
      });

      if (res.ok) {
        setIsRechargeSuccess(true);
        updateUserProfile(user.phoneNumber);
        setUpiUTR("");
        setSelectedFileName(null);
        setTimeout(() => {
          setIsRechargeSuccess(false);
          setActiveTab('home');
        }, 2500);
      } else {
        const errorData = await res.json();
        setRechargeError(errorData.error || "Transaction registration expired");
      }
    } catch (err) {
      console.error(err);
      setRechargeError("Recharge network is currently congested");
    }
  };

  const processWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");

    if (withdrawAmt > user.balance) {
      setWithdrawError("Withdrawal amount surpasses active balance");
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.ifscCode) {
      setWithdrawError("Ensure IFSC and core accounting codes are filled");
      return;
    }

    try {
      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phoneNumber,
          type: 'withdrawal',
          amount: withdrawAmt,
          bankDetails: bankDetails
        })
      });

      if (res.ok) {
        setIsWithdrawSuccess(true);
        updateUserProfile(user.phoneNumber);
        setTimeout(() => {
          setIsWithdrawSuccess(false);
          setActiveTab('home');
        }, 2000);
      } else {
        const data = await res.json();
        setWithdrawError(data.error || "Processing failed");
      }
    } catch (err) {
      setWithdrawError("Banking channel is currently congested");
    }
  };

  const saveUsername = async () => {
    if (!newUsername.trim()) return;
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user.phoneNumber, username: newUsername })
      });
      if (res.ok) {
        setUser(prev => ({ ...prev, username: newUsername }));
        setIsEditingUsername(false);
        setNotification("Profile handle successfully renamed!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0b15] text-zinc-100 font-sans selection:bg-amber-500 selection:text-zinc-950 pb-24">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0d0b15]/90 border-b border-zinc-900 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            {/* Embedded Logo in header matching the uploaded design */}
            <JackwarLogo size="sm" showText={false} />
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent uppercase">
                JackwarClub
              </span>
              <span className="text-[10px] block text-zinc-500 font-mono tracking-widest uppercase font-bold">
                Jalwa Game Studio
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user.isLoggedIn ? (
              <div className="flex items-center space-x-2">
                {/* Visual VIP Badge */}
                <div 
                  onClick={() => setActiveTab('profile')}
                  className={`hidden sm:inline-flex items-center px-2 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest bg-gradient-to-r border cursor-pointer hover:scale-105 transition-all ${getVIPBadgeStyles(user.vipLevel || 1).bg}`}
                >
                  👑 VIP {user.vipLevel || 1}
                </div>
                
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-zinc-900 to-zinc-950 border border-amber-500/20 rounded-full py-1.5 px-3.5 pr-2 cursor-pointer hover:border-amber-500/50 transition-all shadow-inner"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Balance</span>
                    <span className="text-sm font-black text-amber-400 font-mono">₹{user.balance.toFixed(2)}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-xs text-zinc-950 font-black tracking-tighter shadow-md">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    const el = document.getElementById("auth-portal");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 font-bold text-xs py-2 px-4 rounded-lg flex items-center space-x-1.5 text-zinc-950 shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Interactive Authentication</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Broad alerts */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border-b border-amber-500/15 text-amber-200 text-xs py-2.5 px-4 text-center flex items-center justify-center gap-2 font-medium"
          >
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-amber-400 font-bold ml-1 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        
        {/* Core Mascot Hero Panel */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 to-[#12101e] border-2 border-amber-500/15 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
          <div className="space-y-4 z-10 max-w-lg text-center md:text-left">
            <span className="inline-flex items-center space-x-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Authentic Jalwa Color Predictions Suite</span>
            </span>
            <h1 className="text-3xl font-black md:text-4xl text-white tracking-tight leading-none uppercase">
              Where Predictions Meet Royal Gaming.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              Earn high-tier multipliers on Correct Colors, Numbers, Aviator flights, and Gold Mines. Log in below to access seamless deposit/withdrawing direct channels.
            </p>
          </div>
          
          {/* Logo element displayed beautifully */}
          <div className="relative">
            <JackwarLogo size="lg" className="scale-110 drop-shadow-[0_0_35px_rgba(234,179,8,0.2)]" />
          </div>
        </section>

        {/* Interactive Wallet Action Panel (styled exactly like the mobile image) */}
        <section className="bg-gradient-to-br from-[#1c1a3a] to-[#121021] border border-zinc-900 rounded-3xl p-5 md:p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
            <div className="space-y-1">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">Wallet balance</span>
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl md:text-3xl font-black font-mono bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  ₹{user.isLoggedIn ? user.balance.toFixed(2) : "1.22"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (user.isLoggedIn) {
                      updateUserProfile(user.phoneNumber);
                      setNotification("🔄 Syncing wallet balance with secure node channels...");
                    } else {
                      setNotification("🔒 Please authenticate to sync live wallet assets.");
                    }
                  }}
                  className="p-1.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-full text-zinc-400 hover:text-white cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (user.isLoggedIn) {
                    setActiveTab('withdraw');
                    setNotification("💸 Routing to secure cash-withdrawal ledger desk.");
                  } else {
                    setNotification("⚠️ Secure login credentials required.");
                  }
                }}
                className="flex-1 sm:flex-none text-center bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-extrabold text-xs px-5 py-3 rounded-2xl cursor-pointer text-white shadow-lg active:scale-95 transition-all border border-amber-400/20"
              >
                Withdraw
              </button>
              <button
                onClick={() => {
                  if (user.isLoggedIn) {
                    setActiveTab('recharge');
                    setNotification("⚡ Opening instant UPI pay scanner.");
                  } else {
                    setNotification("⚠️ Please login first to perform UPI Deposits.");
                  }
                }}
                className="flex-1 sm:flex-none text-center bg-gradient-to-r from-red-500 via-rose-600 to-rose-500 font-extrabold text-xs px-5 py-3 rounded-2xl cursor-pointer text-white shadow-lg active:scale-95 transition-all border border-rose-500/20"
              >
                Deposit
              </button>
            </div>
          </div>
        </section>

        {/* Real-time Dynamic Game Lounge 3.0 (with 8 glossy category badges) */}
        <section className="space-y-6">
          
          {/* Categories Grid corresponding to the picture */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 bg-[#090710]/40 p-1.5 rounded-2xl border border-zinc-900/80">
            {[
              { id: "lottery", label: "Lottery", emoji: "🎱", bg: "bg-amber-500" },
              { id: "minigames", label: "Mini games", emoji: "🏆", bg: "bg-blue-600" },
              { id: "hotset", label: "Hot Slots", emoji: "❤️", bg: "bg-purple-600" },
              { id: "slots", label: "Slots", emoji: "🎰", bg: "bg-emerald-600" },
              { id: "fishing", label: "Fishing", emoji: "🐠", bg: "bg-cyan-500" },
              { id: "pvc", label: "PVC", emoji: "🃏", bg: "bg-indigo-600" },
              { id: "casino", label: "Casino", emoji: "🎡", bg: "bg-red-650" },
              { id: "sports", label: "Sports", emoji: "🏏", bg: "bg-teal-600" }
            ].map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id as any);
                    setActiveGame(null); // return to lists
                    setNotification(`📂 Switched category to ${cat.label}`);
                  }}
                  className={`p-2 py-2.5 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500 shadow-xl" 
                      : "opacity-65 hover:opacity-100"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${cat.bg} flex items-center justify-center text-lg shadow-md mb-1.5`}>
                    {cat.emoji}
                  </div>
                  <span className={`text-[10px] font-black tracking-normal leading-none uppercase ${isSelected ? "text-emerald-400 scale-105" : "text-zinc-400"}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* 1. RENDER ACTIVE GAME IF SELECTED */}
            {activeGame !== null ? (
              <motion.div
                key="active-playroom"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Floating Retro Control Bar */}
                <div className="flex justify-between items-center bg-zinc-950/90 py-2.5 px-4 rounded-2xl border border-zinc-900">
                  <button
                    onClick={() => {
                      setActiveGame(null);
                      setNotification("🔙 Returned to secure game lounges.");
                    }}
                    className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer py-1 px-3 bg-zinc-900 rounded-lg active:scale-95 transition-all border border-zinc-850"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-500" />
                    <span className="font-bold">Lobby</span>
                  </button>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#a19fce] font-extrabold flex items-center gap-1">
                    🟢 Active Symmetrical Channel: {activeGame.toUpperCase()}
                  </span>
                  <div className="text-right text-[11px] font-mono text-amber-400 font-bold">
                    Wallet: ₹{user.balance.toFixed(2)}
                  </div>
                </div>

                {/* Mount selected interactive component */}
                {activeGame === "wingo" && (
                  <div className="space-y-4">
                    {/* Interval mode tabs */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-900">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-500" /> Win Go Interval Range:
                      </span>
                      
                      <div className="flex gap-1">
                        {(['1m', '3m', '5m', '10m'] as GameDuration[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setGameMode(mode)}
                            className={`text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all ${
                              gameMode === mode 
                                ? 'bg-amber-500 text-zinc-950 font-black' 
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {mode} Mode
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Win Go Ticker */}
                      <div className="md:col-span-1 bg-gradient-to-br from-zinc-900 to-[#0e0c15] border border-zinc-805 rounded-2xl p-5 flex flex-col justify-between py-6 relative overflow-hidden text-center md:text-left shadow-xl">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">Active Game Period</span>
                          <span className="text-xl font-black text-amber-400 block tracking-wider font-mono">{gameState.issueNumber}</span>
                        </div>

                        <div className="py-6 space-y-1">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Time Left</span>
                          <div className="text-5xl font-black font-mono bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                            0{Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
                          </div>
                        </div>

                        <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              gameState.timeLeft <= 10 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                            }`}
                            style={{ width: `${(gameState.timeLeft / (gameMode === '1m' ? 60 : gameMode === '3m' ? 180 : gameMode === '5m' ? 300 : 600)) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Prediction grid selections */}
                      <div className="md:col-span-2 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-805 rounded-2xl p-6 space-y-5 shadow-xl">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2 text-xs">
                          <span className="font-bold text-zinc-400 uppercase">Interactive Categories</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Active
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <button 
                            disabled={gameState.timeLeft <= 5}
                            onClick={() => openBetModal('green')}
                            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 font-black text-sm py-3.5 rounded-xl uppercase tracking-widest text-white shadow-md cursor-pointer transition-all"
                          >
                            Green [2x]
                          </button>
                          <button 
                            disabled={gameState.timeLeft <= 5}
                            onClick={() => openBetModal('violet')}
                            className="bg-violet-600 hover:bg-violet-500 active:scale-95 disabled:opacity-40 font-black text-sm py-3.5 rounded-xl uppercase tracking-widest text-white shadow-md cursor-pointer transition-all"
                          >
                            Violet [4.5x]
                          </button>
                          <button 
                            disabled={gameState.timeLeft <= 5}
                            onClick={() => openBetModal('red')}
                            className="bg-[#e11d48] hover:bg-rose-500 active:scale-95 disabled:opacity-40 font-black text-sm py-3.5 rounded-xl uppercase tracking-widest text-white shadow-md cursor-pointer transition-all"
                          >
                            Red [2x]
                          </button>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] text-zinc-500 font-bold font-mono tracking-wider block uppercase">Select specific numbers [9x Payout]</span>
                          
                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 font-black font-mono">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                              let colClass = "bg-rose-600/10 text-rose-300 border-rose-900/40 text-sm";
                              if (num === 0) colClass = "bg-gradient-to-r from-rose-500/10 to-purple-500/10 text-purple-300 border-zinc-800 text-sm";
                              else if (num === 5) colClass = "bg-gradient-to-r from-emerald-500/10 to-purple-500/10 text-emerald-300 border-zinc-800 text-sm";
                              else if (num % 2 !== 0) colClass = "bg-emerald-500/10 text-emerald-300 border-emerald-900/40 text-sm";

                              return (
                                <button
                                  key={num}
                                  disabled={gameState.timeLeft <= 5}
                                  onClick={() => openBetModal(String(num))}
                                  className={`p-2 py-2.5 rounded-xl border font-bold text-center active:scale-95 transition-all text-white disabled:opacity-30 cursor-pointer hover:brightness-125 ${colClass}`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button 
                            disabled={gameState.timeLeft <= 5}
                            onClick={() => openBetModal('big')}
                            className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-xs py-3 rounded-xl font-bold tracking-widest uppercase text-zinc-300 cursor-pointer"
                          >
                            BIG (5-9) [2x]
                          </button>
                          <button 
                            disabled={gameState.timeLeft <= 5}
                            onClick={() => openBetModal('small')}
                            className="bg-zinc-950 border border-[#27272a] hover:bg-zinc-900 text-xs py-3 rounded-xl font-bold tracking-widest uppercase text-zinc-300 cursor-pointer"
                          >
                            SMALL (0-4) [2x]
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Embedding the Win-Go Real-Time outcome result history directly in options flow */}
                    <div className="bg-[#0b0914] border border-zinc-900 rounded-2xl p-4 md:p-5 text-left space-y-3">
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                        <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <Trophy className="w-4 h-4 text-amber-500 animate-pulse" /> Win Go {gameMode} Historic Results
                        </span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2.5 py-0.5 rounded-full font-black animate-pulse uppercase tracking-wider font-mono">
                          Live server
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-400">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">
                              <th className="py-2">Period ID</th>
                              <th className="py-2">Outcome</th>
                              <th className="py-2">Size</th>
                              <th className="py-2 text-right">Winning Color</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900 font-mono">
                            {gameState.history.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-zinc-600 font-bold uppercase text-[10px]">Syncing live ticker outcomes...</td>
                              </tr>
                            ) : (
                              gameState.history.slice(0, 10).map((row, idx) => {
                                let tagColor = "bg-rose-600/20 text-rose-300 ring-rose-500/20";
                                if (row.color === 'green') tagColor = "bg-emerald-600/20 text-emerald-300 ring-emerald-500/20";
                                else if (row.color === 'violet') tagColor = "bg-violet-650/20 text-violet-300 ring-violet-500/20";
                                else if (row.color === 'red-violet') tagColor = "bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-purple-200 ring-violet-500/10";
                                else if (row.color === 'green-violet') tagColor = "bg-gradient-to-r from-emerald-500/20 to-violet-500/20 text-purple-200 ring-violet-500/10";

                                return (
                                  <tr key={idx} className="hover:bg-zinc-900/20">
                                    <td className="py-2 font-bold text-zinc-300">{row.issue}</td>
                                    <td className="py-2">
                                      <span className="font-extrabold text-white bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">{row.number}</span>
                                    </td>
                                    <td className="py-2 font-bold uppercase text-[10px] text-zinc-400">{row.size}</td>
                                    <td className="py-2 text-right">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ring-1 ${tagColor}`}>
                                        {row.color}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

                {activeGame === "sattamatka" && (
                  <SattaMatkaGame 
                    user={user} 
                    updateUserProfile={updateUserProfile} 
                    setNotification={setNotification} 
                  />
                )}

                {activeGame === "aviator" && (
                  <AviatorGame 
                    userBalance={user.balance} 
                    phoneNumber={user.phoneNumber} 
                    updateProfile={updateUserProfile} 
                    setNotification={setNotification} 
                  />
                )}

                {activeGame === "slots" && (
                  <JiliSlots 
                    userBalance={user.balance} 
                    phoneNumber={user.phoneNumber} 
                    updateProfile={updateUserProfile} 
                    setNotification={setNotification} 
                  />
                )}

                {activeGame === "plinko" && (
                  <PlinkoGame 
                    userBalance={user.balance} 
                    phoneNumber={user.phoneNumber} 
                    updateProfile={updateUserProfile} 
                    setNotification={setNotification} 
                  />
                )}

                {activeGame === "mines" && (
                  <MinesGame 
                    userBalance={user.balance} 
                    phoneNumber={user.phoneNumber} 
                    updateProfile={updateUserProfile} 
                    setNotification={setNotification} 
                  />
                )}

                {activeGame === "sports" && (
                  <SportsBettingGame 
                    user={user} 
                    updateUserProfile={updateUserProfile} 
                    setNotification={setNotification} 
                  />
                )}
              </motion.div>
            ) : (
              // 2. RENDER THE GORGEOUS BENTO GAMES LIST FILTERED BY CATEGORIES
              <motion.div
                key="lobby-lists"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-1 border-b border-zinc-800/50 pb-2">
                  <span className="text-xs font-black uppercase text-white tracking-widest">
                    🔥 Active Lounge Categories: {activeCategory.toUpperCase()}
                  </span>
                </div>

                {activeCategory === "lottery" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* WINGO CARD WITH INTEGRATED PREDICTION RESULTS! matches "win go result inside it" */}
                    <div 
                      onClick={() => { setActiveGame("wingo"); setSelectedGameTab("wingo"); }}
                      className="bg-gradient-to-br from-[#122c4d] to-[#041122] border-2 border-blue-500/10 hover:border-blue-500/30 rounded-2xl p-4 cursor-pointer text-left transition-all hover:scale-[1.01] active:scale-95 space-y-4 shadow-xl flex flex-col justify-between min-h-[170px]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                            Live draw interval
                          </span>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">WIN GO LOTTO</h3>
                        </div>
                        {/* Realistic ball vectors from image */}
                        <div className="flex items-center space-x-1.5 bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/40 font-mono text-[10px]">
                          <span className="text-zinc-400">⏳</span>
                          <span className="text-emerald-400 font-extrabold animate-pulse">
                            0{Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                      </div>

                      {/* Integrated live results of Win-Go (this satisfies "WIN GO का result उसके अंदर डाला") */}
                      <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-zinc-500 font-extrabold uppercase block leading-none font-sans">PERIOD</span>
                          <span className="text-[11px] font-bold text-zinc-300 leading-none block font-mono">{gameState.issueNumber}</span>
                        </div>

                        {/* Row of latest 4 outcome indicators synced beautifully to server state */}
                        <div className="flex items-center gap-1.5">
                          {gameState.history.slice(0, 4).map((h, i) => {
                            let ballCol = "bg-rose-600 border-rose-400 text-white";
                            if (h.color === "green") ballCol = "bg-emerald-600 border-emerald-400 text-white";
                            else if (h.color === "violet" || h.color.includes("violet")) ballCol = "bg-gradient-to-r from-purple-600 to-rose-600 border-purple-400 text-white";
                            return (
                              <div 
                                key={i}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black font-mono shadow ${ballCol}`}
                              >
                                {h.number}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* SATTA MATKA DYNAMIC CARD */}
                    <div 
                      onClick={() => setActiveGame("sattamatka")}
                      className="bg-gradient-to-br from-[#3b121c] to-[#1a040b] border-2 border-red-500/10 hover:border-red-500/30 rounded-2xl p-4 cursor-pointer text-left transition-all hover:scale-[1.01] active:scale-95 space-y-4 shadow-xl flex flex-col justify-between min-h-[170px]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                            Indian Satta Matka
                          </span>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">KALYAN MATKA</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xl shadow">
                          🏺
                        </div>
                      </div>

                      {/* Display Kalyan Live drawn results directly on card */}
                      <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-zinc-500 font-extrabold uppercase block leading-none">LIVE RESULTS</span>
                          <span className="text-xs font-black text-amber-400 block font-mono">340-78-134</span>
                        </div>
                        <span className="text-[9px] text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 px-2 py-1 rounded font-black border border-emerald-500/10 animate-pulse">
                          🟢 OPEN SHAKE
                        </span>
                      </div>
                    </div>

                    {/* TRX WINGO BLOCK (Runs TRX color prediction countdown) */}
                    <div 
                      onClick={() => { setActiveGame("wingo"); setNotification("💸 Welcome to TRX Win Go predict! Place your crypto stakes."); }}
                      className="bg-gradient-to-br from-[#2f1146] to-[#11041c] border border-purple-500/15 hover:border-purple-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-purple-400 font-bold block uppercase tracking-widest">TRX Tokenpredict</span>
                          <h3 className="text-base font-black text-zinc-100 uppercase tracking-tight">TRX WINGO</h3>
                        </div>
                        <span className="text-xl">💎</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 font-medium">Auto cryptocurrency tracker predicting digits inside tron network. Instant payout scales 9x.</p>
                    </div>

                    {/* K3 LOTTERY CARD */}
                    <div 
                      onClick={() => { setActiveGame("wingo"); setNotification("🎲 Fast Predict K3 Dice. Put stakes on sums."); }}
                      className="bg-gradient-to-br from-[#401334] to-[#180412] border border-pink-500/15 hover:border-pink-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-pink-400 font-bold block uppercase tracking-widest">3-Dice Stand</span>
                          <h3 className="text-base font-black text-zinc-100 uppercase tracking-tight">K3 LOTTO</h3>
                        </div>
                        <span className="text-xl">🎲</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 font-medium">Prediction of 3-dice rolls. Bet on specific triple, single sums or doubles with 150x payouts.</p>
                    </div>

                  </div>
                )}

                {activeCategory === "minigames" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Spribe Aviator */}
                    <div 
                      onClick={() => setActiveGame("aviator")}
                      className="bg-gradient-to-br from-[#3c090d] to-[#1a0405] border border-red-500/15 hover:border-red-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-red-500 font-bold block uppercase tracking-widest">Aviator dynamic</span>
                        <span className="text-xl">✈️</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-zinc-100 uppercase">Spribe Aviator</h4>
                        <p className="text-[10px] text-zinc-500">Live flight multiplier crashes. Pull back before flight vanishes.</p>
                      </div>
                    </div>

                    {/* Plinko Game */}
                    <div 
                      onClick={() => setActiveGame("plinko")}
                      className="bg-gradient-to-br from-[#0c311c] to-[#04140a] border border-emerald-500/15 hover:border-emerald-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-emerald-500 font-bold block uppercase tracking-widest">Drop Ball Pegs</span>
                        <span className="text-xl">🔴</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-zinc-100 uppercase">BGaming Plinko</h4>
                        <p className="text-[10px] text-zinc-500">Ball bouncing multipliers boards. Infinite continuous drops.</p>
                      </div>
                    </div>

                    {/* Mines Game */}
                    <div 
                      onClick={() => setActiveGame("mines")}
                      className="bg-gradient-to-br from-[#1b0a3c] to-[#090317] border border-purple-500/15 hover:border-purple-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[140px]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-purple-500 font-bold block uppercase tracking-widest">Mine Grid Sweep</span>
                        <span className="text-xl">💣</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-zinc-100 uppercase">InOut Mines</h4>
                        <p className="text-[10px] text-zinc-500">Find golden stars in a 5x5 minefield. Set custom triggers.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeCategory === "slots" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Jili Slots */}
                    <div 
                      onClick={() => setActiveGame("slots")}
                      className="bg-gradient-to-br from-[#453c0d] to-[#1a1604] border border-yellow-500/15 hover:border-yellow-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[150px]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-yellow-400 font-black block uppercase tracking-widest">777 Fortune Slots</span>
                        <span className="text-xl">🎰</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase mt-4">JILI FORTUNE SLOT</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">Spin classic Jili Reels with up to 2500x mega payout jackpot lines.</p>
                      </div>
                    </div>

                    {/* Hot Slots */}
                    <div 
                      onClick={() => setActiveGame("slots")}
                      className="bg-gradient-to-br from-[#0c3c3a] to-[#031414] border border-cyan-500/15 hover:border-cyan-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[150px]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-cyan-400 font-black block uppercase tracking-widest">Neon mega slots</span>
                        <span className="text-xl">🌟</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase mt-4">HOT REELS SPIN</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">Cyan background fruit slot machine spinner. Simple direct claims.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeCategory === "sports" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Live Cricket Matches */}
                    <div 
                      onClick={() => { setActiveGame("sports"); setNotification("🏏 Loaded Live IPL cricket broker. Select outcome odds to place bet."); }}
                      className="bg-gradient-to-br from-[#0c2f3c] to-[#031118] border-2 border-cyan-500/10 hover:border-cyan-500/35 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[150px] shadow-xl text-left"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-cyan-400 font-extrabold block uppercase tracking-widest bg-cyan-950/40 border border-cyan-900/60 px-2 py-0.5 rounded-full">
                          IPL Live Odds
                        </span>
                        <span className="text-xl">🏏</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase mt-4">IPL & T20 Live Bets</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">Place instant outcome bets on matches, score tickers and commentary logs with up to 9x yields.</p>
                      </div>
                    </div>

                    {/* Football Matches */}
                    <div 
                      onClick={() => { setActiveGame("sports"); setNotification("⚽ Loaded Champions tournament. Back your premium teams."); }}
                      className="bg-gradient-to-br from-[#2f3c0c] to-[#111803] border-2 border-lime-500/10 hover:border-lime-500/35 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[150px] shadow-xl text-left"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-lime-400 font-extrabold block uppercase tracking-widest bg-lime-950/40 border border-lime-900/60 px-2 py-0.5 rounded-full">
                          Champions League
                        </span>
                        <span className="text-xl">⚽</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase mt-4">Football Champions Cup</h4>
                        <p className="text-[10px] text-zinc-400 mt-1">Real-time match prediction, win/draw/loss odds, and quick automated simulated ticket settlements.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Level Lock simulation for placeholder categories */}
                {["hotset", "fishing", "pvc", "casino"].includes(activeCategory) && (
                  <div className="bg-[#121021]/80 border-2 border-dashed border-amber-500/10 rounded-2xl p-8 text-center space-y-4">
                    <span className="text-2xl block animate-bounce">🔒</span>
                    <h4 className="text-base font-black text-white uppercase">Lounge Locked at current VIP level</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Games under {activeCategory.toUpperCase()} require increased VIP ranking. Add ₹200.00 to your secure wallet scanner deposit today to increase VIP progress instantly.
                    </p>
                    <button
                      onClick={() => setActiveTab("recharge")}
                      className="inline-flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer"
                    >
                      <span>Deposit now</span>
                    </button>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Authentication Form Portal */}
        {!user.isLoggedIn && (
          <section id="auth-portal" className="bg-gradient-to-b from-[#141221] to-zinc-950 border border-amber-500/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-amber-950/20 to-zinc-900/60 p-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                <h2 className="font-extrabold text-xs tracking-wider text-zinc-200">AUTHENTIC RECHARGE & LOGIN PORTAL</h2>
              </div>
              <span className="bg-zinc-900 text-amber-500 text-[9px] font-mono px-2 py-0.5 rounded border border-amber-500/20 font-bold">SSL 256-BIT</span>
            </div>
            
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {/* Premium Golden Demo Pass helper block */}
              {showDemoBox && (
                <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-left animate-fadeIn">
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-500 font-extrabold block uppercase tracking-wider leading-none">📋 VIP GUEST DEMO ACCESS</span>
                    <p className="text-[11px] text-zinc-300 leading-snug">
                      Use Mobile: <strong className="font-mono text-amber-400 text-xs text-[#00ffcc]">9876543210</strong> & Password: <strong className="font-mono text-zinc-100 text-xs">password123</strong> to experience automatic VIP status plus <strong className="text-amber-400 font-bold font-mono">₹50,000.00</strong> real test scale balance!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneInput("9876543210");
                      setPasswordInput("password123");
                      setNotification("📋 Auto-filled demo credentials! Click the 'SECURE LOG IN' button below.");
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    Click to Auto-fill
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Handset phone number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold text-sm">+91</span>
                    <input 
                      type="number"
                      placeholder="Enter mobile number"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Core password</label>
                  <input 
                    type="password"
                    placeholder="Create or Type Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-950/30 border border-red-900/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-widest cursor-pointer hover:brightness-110 shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Verifying and Logging...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-zinc-950" />
                    <span>SECURE LOG IN / REGISTRATION</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowDemoBox(!showDemoBox)}
                  className="text-zinc-600 hover:text-amber-500/80 transition-colors text-[9px] uppercase font-extrabold tracking-widest cursor-pointer inline-flex items-center gap-1 bg-transparent border-0"
                >
                  <span>{showDemoBox ? "Hide Demo Pass" : "🔑 Show Guest Demo Account"}</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Financial bank portal */}
        {user.isLoggedIn && (
          <section className="bg-zinc-900/40 border border-zinc-850 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-850 pb-4">
              <div>
                <h3 className="text-md font-extrabold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-500" />
                  <span>Jalwa Financial Cash Desk</span>
                </h3>
                <p className="text-xs text-zinc-400">Manage instant UPI scan recharging or bank transfer cash withdrawals.</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => setActiveTab('home')} 
                  className={`text-xs font-bold py-2 px-3.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                    activeTab === 'home' ? 'bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/10' : 'bg-zinc-950 border border-zinc-900 hover:text-white text-zinc-400'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Summary</span>
                </button>
                <button 
                  onClick={() => setActiveTab('recharge')} 
                  className={`text-xs font-bold py-2 px-3.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                    activeTab === 'recharge' ? 'bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/10' : 'bg-zinc-950 border border-zinc-900 hover:text-white text-zinc-400'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Deposit UPI/Scanner</span>
                </button>
                <button 
                  onClick={() => setActiveTab('withdraw')} 
                  className={`text-xs font-bold py-2 px-3.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                    activeTab === 'withdraw' ? 'bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/10' : 'bg-zinc-950 border border-zinc-900 hover:text-white text-zinc-400'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Withdraw Earnings</span>
                </button>
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`text-xs font-bold py-2 px-3.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                    activeTab === 'profile' ? 'bg-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/10' : 'bg-zinc-950 border border-zinc-900 hover:text-white text-zinc-400'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>VIP Club</span>
                </button>
              </div>
            </div>

            {activeTab === 'recharge' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column: QR scanner representation built matching user yellow/cream layout */}
                  <div className="bg-[#fbdca9] p-5 rounded-2xl border-2 border-[#f5b85d] flex flex-col items-center justify-center text-zinc-950 text-center w-full lg:w-72 shadow-xl flex-shrink-0">
                    <span className="text-xs font-black tracking-widest uppercase text-zinc-800 font-mono">SCAN TO RECHARGE</span>
                    
                    <span className="text-[13px] font-extrabold font-sans text-zinc-900 bg-white/40 px-3 py-1 rounded-full border border-[#f5b85d]/30 mt-2 block">
                      chetanjj@fam
                    </span>

                    {/* Highly stylized interactive SVG QR Code */}
                    <div className="my-4 bg-white p-2.5 rounded-xl shadow-lg border-2 border-amber-600/10">
                      <svg className="w-36 h-36" viewBox="0 0 100 100">
                        {/* QR codes layout */}
                        <rect x="10" y="10" width="20" height="20" fill="none" stroke="black" strokeWidth="4"/>
                        <rect x="15" y="15" width="10" height="10" fill="black"/>
                        <rect x="70" y="10" width="20" height="20" fill="none" stroke="black" strokeWidth="4"/>
                        <rect x="75" y="15" width="10" height="10" fill="black"/>
                        <rect x="10" y="70" width="20" height="20" fill="none" stroke="black" strokeWidth="4"/>
                        <rect x="15" y="75" width="10" height="10" fill="black"/>
                        {/* QR mock details */}
                        <rect x="42" y="15" width="4" height="4" fill="black"/>
                        <rect x="50" y="12" width="4" height="4" fill="black"/>
                        <rect x="58" y="16" width="4" height="4" fill="black"/>
                        <rect x="46" y="24" width="4" height="4" fill="black"/>
                        <rect x="12" y="44" width="4" height="4" fill="black"/>
                        <rect x="22" y="48" width="4" height="4" fill="black"/>
                        <rect x="28" y="40" width="4" height="4" fill="black"/>
                        <rect x="40" y="40" width="8" height="8" fill="black"/>
                        <rect x="52" y="42" width="4" height="4" fill="black"/>
                        <rect x="48" y="50" width="4" height="4" fill="black"/>
                        <rect x="58" y="48" width="4" height="4" fill="black"/>
                        <rect x="42" y="58" width="4" height="4" fill="black"/>
                        <rect x="74" y="40" width="4" height="4" fill="black"/>
                        <rect x="82" y="48" width="4" height="4" fill="black"/>
                        <rect x="86" y="42" width="4" height="4" fill="black"/>
                        <rect x="40" y="74" width="4" height="4" fill="black"/>
                        <rect x="48" y="80" width="4" height="4" fill="black"/>
                        <rect x="56" y="74" width="4" height="4" fill="black"/>
                        <rect x="44" y="84" width="4" height="4" fill="black"/>
                        <rect x="72" y="72" width="8" height="8" fill="black"/>
                        <rect x="84" y="74" width="4" height="4" fill="black"/>
                        <rect x="80" y="82" width="4" height="4" fill="black"/>
                      </svg>
                    </div>

                    <div className="flex items-center space-x-1.5 mt-1">
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("chetanjj@fam");
                          setNotification("📋 UPI Address copied successfully!");
                        }}
                        className="text-[11px] bg-zinc-950 text-white font-bold py-1.5 px-3.5 rounded-lg border border-zinc-900 active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-amber-400" />
                        <span>Copy UPI Address</span>
                      </button>
                    </div>

                    <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mt-3.5 flex items-center gap-1">
                      🛡️ SECURE triö UPI PAYTRON
                    </span>
                  </div>

                  {/* Right Column: Recharge Amount & UTR Details */}
                  <div className="flex-1 space-y-4">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Provide Payment Details</h4>
                    
                    <form onSubmit={processRecharge} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">1. Select amount to recharge (₹)</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {[100, 200, 500, 1000, 5000, 10000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setRechargeAmt(amt)}
                              className={`py-2 text-xs font-mono font-bold rounded-lg border cursor-pointer transition-all ${
                                rechargeAmt === amt 
                                  ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                              }`}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Confirm input recharge amount (₹)</label>
                          <input 
                            type="number"
                            min="10"
                            required
                            value={rechargeAmt}
                            onChange={e => setRechargeAmt(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Gateway provider</label>
                          <select 
                            value={rechargeChannel}
                            onChange={e => setRechargeChannel(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-900 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-amber-500 h-[38px]"
                          >
                            <option>Scanner FastPay Gateway (0% Tax)</option>
                            <option>Google Pay Direct API</option>
                            <option>PhonePe UPI QR Code</option>
                          </select>
                        </div>
                      </div>

                      {/* 12-digit UPI UTR Number */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-extrabold uppercase block tracking-wider flex items-center gap-1.5">
                          <span>2. ENTER 12-DIGIT UPI TRANSACTION REF/UTR NUMBER</span>
                        </label>
                        <input 
                          type="text"
                          required
                          pattern="\d{12}"
                          placeholder="Example: 304812948102"
                          maxLength={12}
                          value={upiUTR}
                          onChange={e => setUpiUTR(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 rounded-xl text-sm font-mono text-zinc-50 focus:outline-none focus:border-amber-500 tracking-wider placeholder:text-zinc-700"
                        />
                      </div>

                      {/* DRAG AND DROP FILE UPLOAD AREA */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase block">3. Upload transaction screenshot receipt (Optional)</label>
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                          onDragLeave={() => setIsDraggingFile(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              setSelectedFileName(e.dataTransfer.files[0].name);
                              setNotification(`📎 Screenshot "${e.dataTransfer.files[0].name}" linked to UPI recharge validation sequence!`);
                            }
                          }}
                          onClick={() => document.getElementById('screenshot-upload')?.click()}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                            isDraggingFile ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                          }`}
                        >
                          <input 
                            id="screenshot-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSelectedFileName(e.target.files[0].name);
                                setNotification(`📎 Screenshot "${e.target.files[0].name}" linked successfully!`);
                              }
                            }}
                          />
                          <FileText className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
                          <p className="text-xs font-bold text-zinc-400">
                            {selectedFileName ? `Screenshot: ${selectedFileName}` : "Drag and drop checkout screenshot here, or click to browse"}
                          </p>
                          <span className="text-[10px] text-zinc-650 block mt-1 font-mono">Supports PNG, JPG, JPEG</span>
                        </div>
                      </div>

                      {rechargeError && (
                        <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 text-xs rounded-xl">
                          {rechargeError}
                        </div>
                      )}

                      {isRechargeSucess ? (
                        <div className="p-3 bg-emerald-950/30 border border-emerald-950 text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Recharge registered! Verified ₹{rechargeAmt} credited instantly.</span>
                        </div>
                      ) : (
                        <button 
                          type="submit" 
                          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 text-xs font-black py-4.5 rounded-xl w-full tracking-widest uppercase cursor-pointer animate-pulse"
                        >
                          SUBMIT AND CLAIM INSTANT RECHARGE
                        </button>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'withdraw' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-300 text-xs rounded-xl">
                  ⚠️ Note: Withdrawals are processed straight into your designated Bank Account Card. Ensure your bank details and IFSC credentials match your physical checking ledger exactly. Minimum account lifetime deposit requirement: ₹100.
                </div>
                
                <form onSubmit={processWithdrawal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">1. Destination Card Account Details</span>
                      <input 
                        type="text" 
                        placeholder="Beneficiary cardholder Name" 
                        required
                        value={bankDetails.cardholderName}
                        onChange={e => setBankDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Indian Bank Name (e.g. State Bank of India)" 
                        required
                        value={bankDetails.bankName}
                        onChange={e => setBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Core bank Account Number" 
                        required
                        value={bankDetails.accountNumber}
                        onChange={e => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white"
                      />
                      <input 
                        type="text" 
                        placeholder="Bank IFSC Code" 
                        required
                        value={bankDetails.ifscCode}
                        onChange={e => setBankDetails(prev => ({ ...prev, ifscCode: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white"
                      />
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">2. Cash withdrawal Sizing</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Withdraw amount limiting (₹)</label>
                        <input 
                          type="number" 
                          min="200" 
                          required
                          value={withdrawAmt}
                          onChange={e => setWithdrawAmt(parseInt(e.target.value) || 0)}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider font-bold">Verification password</label>
                        <input 
                          type="password" 
                          required
                          placeholder="Password credentials sign off"
                          value={withdrawPassword}
                          onChange={e => setWithdrawPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {withdrawError && (
                    <div className="p-3 bg-red-950/30 border border-red-900/30 text-red-400 text-xs rounded-xl font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>{withdrawError}</span>
                    </div>
                  )}

                  {isWithdrawSuccess ? (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-900/30 text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Success. Withdrawal request accepted and routed successfully!</span>
                    </div>
                  ) : (
                    <button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-4 rounded-xl w-full tracking-widest uppercase cursor-pointer"
                    >
                      REQUEST BALANCED DIRECT TRANSFER
                    </button>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Dynamic VIP Club levels 1 to 7 status overview */}
                <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1.5 flex flex-col items-center md:items-start">
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r px-3.5 py-1.5 rounded-full border text-xs font-black uppercase text-zinc-100 tracking-wider">
                      <span>👑 YOUR VIP LEVEL:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase block font-black ${getVIPBadgeStyles(user.vipLevel || 1).bg}`}>
                        VIP {user.vipLevel || 1}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 text-center md:text-left">
                      Dynamic ranking updates automatically based on lifetime UPI scanner deposits.
                    </p>
                  </div>

                  <div className="flex flex-col items-center md:items-end w-full md:w-56 space-y-1">
                    <div className="flex justify-between w-full text-xs font-bold font-mono text-zinc-400">
                      <span>Progress</span>
                      <span>₹{user.totalDeposits || 0} / ₹{getTargetForNextLevel(user.vipLevel || 1)}</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, ((user.totalDeposits || 0) / getTargetForNextLevel(user.vipLevel || 1)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block text-center">
                      {user.vipLevel === 7 ? "ROYAL ELITE LEVEL CAP UNLOCKED 🎖️" : `₹${Math.max(0, getTargetForNextLevel(user.vipLevel || 1) - (user.totalDeposits || 0))} TO UNLOCK NEXT VIPTIER`}
                    </span>
                  </div>
                </div>

                {/* VIP Club dynamic details list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" /> VIP Rank Milestone Progression benefits [Levels 1 - 7]
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {[
                      { l: 1, dep: "₹0 - ₹99", bonus: "₹0 instant", color: "bg-zinc-800 text-zinc-300 border-zinc-700", desc: "Basic features, standard commission multiplier, automatic credit loop locks." },
                      { l: 2, dep: "₹100 - ₹999", bonus: "₹10 instant", color: "bg-amber-950 text-amber-400 border-amber-900/40", desc: "Unlock withdrawals card access, ₹10,000 max single withdrawal ticket limit." },
                      { l: 3, dep: "₹1,000 - ₹4,999", bonus: "₹100 instant", color: "bg-teal-950 text-teal-400 border-teal-900/40", desc: "Dynamic multiplier cashbacks, 3% extra reload bonus, 1.1x Plinko payouts." },
                      { l: 4, dep: "₹5,000 - ₹19,999", bonus: "₹500 instant", color: "bg-yellow-950 text-yellow-500 border-yellow-850", desc: "Priority channel withdrawals, 5% extra reload bonus, customized Jalwa support." },
                      { l: 5, dep: "₹20,000 - ₹99,999", bonus: "₹2,500 instant", color: "bg-indigo-950 text-indigo-400 border-indigo-900/40", desc: "Exclusive beta slots, 1.2x Win-Go number predictions payout scales." },
                      { l: 6, dep: "₹100,000 - ₹499,999", bonus: "₹12,000 instant", color: "bg-purple-950/80 text-purple-300 border-purple-800/40", desc: "Fast-line payouts with instant automated ledgering. VIP Slot limits lifted." },
                      { l: 7, dep: "₹500,000+", bonus: "₹50,000 instant", color: "bg-red-950/80 text-rose-300 border-rose-800/40", desc: "Crown privileges: dynamic personal account supervisor, unlimited daily withdrawals." },
                    ].map((v) => (
                      <div 
                        key={v.l} 
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 hover:scale-[1.01] transition-all cursor-default ${
                          user.vipLevel === v.l ? 'ring-2 ring-amber-500 bg-amber-500/10' : 'bg-zinc-950/40'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-zinc-100 ${v.color}`}>
                            VIP {v.l}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 font-sans tracking-wide">{v.dep}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-tight block">{v.desc}</p>
                        <div className="pt-1.5 border-t border-zinc-900/40 flex justify-between text-[10px] font-semibold text-amber-500">
                          <span>Claims Reward:</span>
                          <span>{v.bonus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand Ambassador Promotion (Cristiano Ronaldo - CR7) */}
                <div 
                  id="vip-invitation-card"
                  className="bg-gradient-to-br from-[#1c1d30] via-[#0e0a1b] to-[#1a142e] border border-amber-500/20 rounded-3xl p-5 md:p-6 space-y-5 text-left relative overflow-hidden shadow-2xl pointer-events-auto"
                >
                  {/* Glowing background spotlights */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Header Badging */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
                    <div className="space-y-1">
                      <span className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                        ⭐ Official CR7 Partnership ⭐
                      </span>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight mt-1">
                        Cristiano Ronaldo × Jalwa Commission Hub
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono">Endorsement Level</span>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/15 uppercase font-sans">
                        Siiiii Team bonus
                      </span>
                    </div>
                  </div>

                  {/* CR7 Portrait / Quote Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center border-t border-b border-zinc-800/60 py-4.5 relative z-10">
                    {/* Portrait Card */}
                    <div className="md:col-span-5 relative group overflow-hidden rounded-2xl border border-amber-500/20 bg-zinc-950 p-4 text-center flex flex-col items-center justify-center space-y-2">
                      <span className="text-5xl animate-bounce">⚽🤵</span>
                      <div className="space-y-0.5">
                        <span className="text-sm font-black text-amber-400 block tracking-wider font-mono">CRISTIANO RONALDO</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold block">Official Brand Ambassador</span>
                      </div>
                      <div className="bg-amber-500/10 text-amber-300 font-mono text-[9px] font-extrabold px-2.5 py-0.5 rounded border border-amber-500/15">
                        REGISTRY CODE #007
                      </div>
                    </div>

                    {/* Promotion Terms */}
                    <div className="md:col-span-7 space-y-3.5">
                      <div className="bg-zinc-950/60 p-4.5 rounded-2xl border border-zinc-900 leading-relaxed relative">
                        <span className="absolute top-2 right-3 text-3xl opacity-10 select-none font-serif text-white">”</span>
                        <p className="text-xs text-zinc-300 italic font-medium font-sans">
                          "I invite you to build the strongest betting team on JackwarClub! Invite details below are verified by me. Play with focus, recharge responsibly, and climb VIP tiers to unlock ultimate commissions together!"
                        </p>
                        <span className="text-[10px] font-black uppercase text-amber-400 block text-right mt-2 tracking-wider">
                          — Cristiano Ronaldo (CR7)
                        </span>
                      </div>

                      {/* Benefits metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono leading-none">
                        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/60">
                          <span className="text-amber-400 font-black block text-sm">3-Tier</span>
                          <span className="text-zinc-500 font-semibold block mt-1 uppercase">Commissions</span>
                        </div>
                        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/60">
                          <span className="text-emerald-400 font-black block text-sm">₹500+</span>
                          <span className="text-zinc-500 font-semibold block mt-1 uppercase">Per Signup</span>
                        </div>
                        <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/60">
                          <span className="text-purple-400 font-black block text-sm">Instant</span>
                          <span className="text-zinc-500 font-semibold block mt-1 uppercase">Settlement</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Link/Code action bar */}
                  <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                    <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
                      <span className="text-[9px] uppercase font-mono font-black text-zinc-500 block leading-none">Your Invitation Referrer Code</span>
                      <span className="text-base font-black text-amber-400 font-mono tracking-widest">{user.referralCode}</span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`https://jackwarclub.com/#/register?code=${user.referralCode}`);
                          setNotification("📋 CR7 Team signup link copied onto your device clipboard! Share it now!");
                        }} 
                        className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-[11px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                      >
                        <Copy className="w-4 h-4 text-zinc-950 animate-pulse" /> Copy CR7 Link
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'home' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block">Payout Destination Card</span>
                    <span className="text-sm font-bold text-zinc-200 block truncate max-w-[200px]">
                      {serverProfile.bankCard ? `${serverProfile.bankCard.bankName} - ${serverProfile.bankCard.cardholderName}` : "Not Binded yet"}
                    </span>
                  </div>
                  <button onClick={() => setActiveTab('withdraw')} className="text-xs text-amber-500 font-bold hover:underline cursor-pointer flex-shrink-0">
                    Manage Bank
                  </button>
                </div>

                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block">Invitation Promo link</span>
                    <span className="text-sm font-black text-amber-400 font-mono tracking-wider">{user.referralCode}</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://jackwarclub.com/#/register?code=${user.referralCode}`);
                      setNotification("📋 Invitation promotion link copied onto your device clipboard!");
                    }} 
                    className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Dynamic transaction tables */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Win Go prediction history results */}
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-850 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-amber-500" /> Win Go {gameMode} Historic Results
              </span>
              <span className="text-[9px] text-zinc-500 font-mono font-bold">REAL-TIME GRIDS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-400">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">
                    <th className="py-2">Period ID</th>
                    <th className="py-2">Number</th>
                    <th className="py-2">Size</th>
                    <th className="py-2 text-right">Winning Color</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono">
                  {gameState.history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-600 font-bold uppercase">Connecting to Real-time servers...</td>
                    </tr>
                  ) : (
                    gameState.history.slice(0, 8).map((row, idx) => {
                      let tagColor = "bg-rose-600/20 text-rose-300 ring-rose-500/20";
                      if (row.color === 'green') tagColor = "bg-emerald-600/20 text-emerald-300 ring-emerald-500/20";
                      else if (row.color === 'violet') tagColor = "bg-violet-650/20 text-violet-300 ring-violet-500/20";
                      else if (row.color === 'red-violet') tagColor = "bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-purple-200 ring-violet-500/10";
                      else if (row.color === 'green-violet') tagColor = "bg-gradient-to-r from-emerald-500/20 to-violet-500/20 text-purple-200 ring-violet-500/10";

                      return (
                        <tr key={idx} className="hover:bg-zinc-900/20">
                          <td className="py-2.5 font-bold tracking-tight text-zinc-300">{row.issue}</td>
                          <td className="py-2.5">
                            <span className="font-extrabold text-[#ffffff] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">{row.number}</span>
                          </td>
                          <td className="py-2.5 font-bold uppercase text-[11px] text-zinc-400">{row.size}</td>
                          <td className="py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ring-1 ${tagColor}`}>
                              {row.color}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right hand layout: recent transactions / My bets */}
          <div className="lg:col-span-1 bg-zinc-900/40 border border-[#161226] rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-zinc-850 pb-2">
              Recent Activity Logs
            </h4>

            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1 select-none font-mono">
              {!user.isLoggedIn ? (
                <div className="text-center py-12 text-zinc-600 uppercase text-[10px] font-bold">
                  Authenticate to inspect transaction histories.
                </div>
              ) : serverProfile.bets.length === 0 ? (
                <div className="text-center py-12 text-zinc-600 uppercase text-[10px] font-bold">
                  No predictions register logged yet.
                </div>
              ) : (
                serverProfile.bets.slice(0, 10).map((b, idx) => {
                  let badge = "text-zinc-500";
                  if (b.status === "won") badge = "text-emerald-400 font-bold";
                  else if (b.status === "lost") badge = "text-red-500";

                  return (
                    <div key={idx} className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-zinc-300">
                        <span className="text-[10px]">{b.selection.toUpperCase()}</span>
                        <span className={badge}>{b.status.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500 text-[10px]">
                        <span>Staked ₹{b.amount}</span>
                        <span>{b.status === "won" ? `+₹${b.winAmount?.toFixed(1)}` : `₹0`}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Embedded Betting Picker Modal Overlay */}
      <AnimatePresence>
        {isBetDialogOpen && betSelection && (
          <div className="fixed inset-0 z-50 bg-[#000000]/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0d19] border-2 border-amber-500/20 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-xs font-black text-zinc-200 uppercase tracking-widest">Authorize Win Go Bet</span>
                <button onClick={() => setIsBetDialogOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Selected Category:</span>
                  <span className="text-amber-400 font-black uppercase font-mono">{betSelection}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Period Match Limit:</span>
                  <span className="text-zinc-300 font-black font-mono">{gameState.issueNumber}</span>
                </div>
              </div>

              {/* Set betting stake values */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Choose multiplier unit stake (₹)</span>
                <div className="grid grid-cols-4 gap-1.5 font-mono">
                  {[10, 50, 100, 500].map(val => (
                    <button
                      key={val}
                      onClick={() => setBetAmount(val)}
                      className={`py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                        betAmount === val 
                          ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500' 
                          : 'bg-zinc-950 border-zinc-900 text-zinc-400'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Times factor multiplier</span>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number"
                    min="1"
                    max="100"
                    value={betMultiplier}
                    onChange={e => setBetMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-900 rounded-lg text-xs font-mono text-center text-white"
                  />
                  <div className="grid grid-cols-5 gap-1 flex-1 font-mono">
                    {[1, 5, 10, 20, 50].map(v => (
                      <button
                        key={v}
                        onClick={() => setBetMultiplier(v)}
                        className={`py-1 text-[10px] font-bold rounded border cursor-pointer ${
                          betMultiplier === v 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                            : 'bg-zinc-950 border-zinc-905 text-zinc-500'
                        }`}
                      >
                        {v}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-900 pt-3 flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-zinc-400 uppercase">Subtotal Amount:</span>
                <span className="text-lg text-amber-400">₹{(betAmount * betMultiplier).toFixed(2)}</span>
              </div>

              {bettingStatus && (
                <div className={`p-3 text-xs rounded-xl border ${
                  bettingStatus.type === 'success' ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-red-950/20 border-red-900/40 text-red-300'
                }`}>
                  {bettingStatus.msg}
                </div>
              )}

              <button
                onClick={placeBet}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 text-xs font-black py-4.5 rounded-xl uppercase tracking-widest shadow-xl cursor-pointer"
              >
                SECURE RECORD DEED PREDICTION
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Sticky Bottom Navigation Bar (matches mobile category layout) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#121021]/95 border-t border-zinc-805/80 p-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.5)] backdrop-blur-lg flex justify-around items-center text-zinc-400 select-none max-w-4xl mx-auto rounded-t-3xl md:border-x md:border-zinc-800/50">
        
        {/* Promotion */}
        <button
          onClick={() => {
            setActiveTab('profile');
            setNotification("📢 Shifted account area: copy your invitation promo link below!");
            setTimeout(() => {
              const el = document.getElementById("vip-invitation-card");
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 300);
          }}
          className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' && !activeGame ? 'text-amber-400 font-extrabold' : 'hover:text-zinc-200'
          }`}
        >
          <Share2 className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold font-sans">Promotion</span>
        </button>

        {/* Activity */}
        <button
          onClick={() => {
            setActiveTab('profile');
            setNotification("🎁 Daily VIP Progress Bonus. Complete deposits to level up!");
            setTimeout(() => {
              const el = document.getElementById("vip-club-tier-list");
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 300);
          }}
          className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'hover:text-amber-300' : 'hover:text-zinc-200'
          }`}
        >
          <Gift className="w-5 h-5 text-rose-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold font-sans">Activity</span>
        </button>

        {/* Center Game Lounge Controller */}
        <button
          onClick={() => {
            setActiveTab('home');
            setActiveGame(null);
            setNotification("🎯 Welcome back to the Jalwa Games Lounge!");
          }}
          className={`relative group flex flex-col items-center justify-center -mt-6 bg-gradient-to-tr from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 w-14 h-14 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-zinc-950 font-black border-4 border-[#0d0b15] cursor-pointer`}
        >
          <Gamepad2 className="w-6 h-6 animate-bounce" />
        </button>

        {/* Wallet payments */}
        <button
          onClick={() => {
             setActiveTab('recharge');
             setNotification("💳 UPI Deposit scanner opened below!");
             setTimeout(() => {
               const el = document.getElementById("financial-tab-panel");
               if (el) el.scrollIntoView({ behavior: 'smooth' });
             }, 300);
          }}
          className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'recharge' || activeTab === 'withdraw' ? 'text-blue-400 font-extrabold' : 'hover:text-zinc-200'
          }`}
        >
          <Wallet className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold font-sans">Wallet</span>
        </button>

        {/* Account settings */}
        <button
          onClick={() => {
            setActiveTab('profile');
            setNotification("👤 Loaded account parameters and balance registries.");
            setTimeout(() => {
              const el = document.getElementById("financial-tab-panel");
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 300);
          }}
          className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-amber-500 font-extrabold' : 'hover:text-zinc-200'
          }`}
        >
          <User className="w-5 h-5 text-zinc-300" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold font-sans">Account</span>
        </button>

      </div>
    </div>
  );
}
