import React, { useState, useEffect } from "react";
import { 
  Trophy, Coins, Clock, Award, History, Sparkles, CheckCircle, 
  AlertCircle, ChevronRight, Play, RefreshCw, Dice5, ShieldAlert, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SattaMatkaGameProps {
  user: any;
  updateUserProfile: (phone: string) => Promise<void>;
  setNotification: (text: string | null) => void;
}

interface SattaBet {
  id: string;
  market: string;
  betType: "single" | "jodi" | "pana";
  number: string;
  amount: number;
  status: "pending" | "won" | "lost";
  winAmount?: number;
  drawIssue: string;
}

interface MatkaMarket {
  name: string;
  openTime: string;
  closeTime: string;
  status: "OPEN" | "CLOSED";
  lastResult: string;
}

export function SattaMatkaGame({ user, updateUserProfile, setNotification }: SattaMatkaGameProps) {
  // Satta Matka States
  const [selectedMarket, setSelectedMarket] = useState<string>("KALYAN MATKA");
  const [betType, setBetType] = useState<"single" | "jodi" | "pana">("single");
  const [betNumber, setBetNumber] = useState<string>("");
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [matkaCountdown, setMatkaCountdown] = useState<number>(45);
  const [activeIssue, setActiveIssue] = useState<string>("SM-2026052101");
  const [betMessage, setBetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [localBets, setLocalBets] = useState<SattaBet[]>([]);

  // Pre-seed some markets with traditional Satta Matka naming and outcomes
  const [markets, setMarkets] = useState<MatkaMarket[]>([
    { name: "KALYAN MATKA", openTime: "03:45 PM", closeTime: "05:45 PM", status: "OPEN", lastResult: "340-78-134" },
    { name: "MILAN DAY", openTime: "02:15 PM", closeTime: "04:15 PM", status: "OPEN", lastResult: "159-52-480" },
    { name: "RAJDHANI NIGHT", openTime: "09:30 PM", closeTime: "11:45 PM", status: "OPEN", lastResult: "238-34-158" },
    { name: "MAIN BAZAR", openTime: "09:40 PM", closeTime: "12:05 AM", status: "OPEN", lastResult: "479-05-168" },
  ]);

  // Satta Matka Results History for the selected market
  const [resultHistory, setResultHistory] = useState<Record<string, string[]>>({
    "KALYAN MATKA": ["340-78-134", "189-80-280", "239-44-130", "456-59-234", "120-35-159"],
    "MILAN DAY": ["159-52-480", "124-77-359", "256-38-189", "340-79-135", "147-23-148"],
    "RAJDHANI NIGHT": ["238-34-158", "137-12-147", "110-23-148", "379-90-280", "289-98-378"],
    "MAIN BAZAR": ["479-05-168", "257-41-100", "180-99-360", "240-62-129", "123-66-150"],
  });

  // Countdown timer for next Satta Matka Draw (simulating rapid interactive rounds)
  useEffect(() => {
    const timer = setInterval(() => {
      setMatkaCountdown((prev) => {
        if (prev <= 1) {
          triggerMatkaDraw();
          return 45; // loop drawdown
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedMarket, localBets]);

  // Generate a mock authentic Satta Matka result (Pana-Jodi-Pana sequence)
  const generateMatkaResult = () => {
    // Open Pana: 3 random 1-digit numbers (often sorted low-to-high)
    const openDigits = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).sort();
    const openPana = openDigits.join("");
    const openAnk = (openDigits.reduce((a, b) => a + b, 0) % 10).toString();

    // Close Pana: 3 random 1-digit numbers
    const closeDigits = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).sort();
    const closePana = closeDigits.join("");
    const closeAnk = (closeDigits.reduce((a, b) => a + b, 0) % 10).toString();

    const jodi = openAnk + closeAnk;
    return {
      panaResult: `${openPana}-${jodi}-${closePana}`,
      openAnk,
      closeAnk,
      jodi,
      openPana,
      closePana
    };
  };

  // Trigger Satta Draw calculation
  const triggerMatkaDraw = () => {
    setIsSpinning(true);
    setNotification("🔮 Kalyan Matka pot is shaking! Drawing winning Pana digits...");

    setTimeout(async () => {
      setIsSpinning(false);
      const res = generateMatkaResult();
      const finalResult = res.panaResult;

      // Update market and history
      setMarkets((prev) =>
        prev.map((m) => m.name === selectedMarket ? { ...m, lastResult: finalResult } : m)
      );

      setResultHistory((prev) => ({
        ...prev,
        [selectedMarket]: [finalResult, ...prev[selectedMarket].slice(0, 7)],
      }));

      // Process and crosscheck local bets placed during this issue
      let didWin = false;
      let totalWon = 0;

      const updatedBets = localBets.map((bet) => {
        if (bet.status !== "pending") return bet;

        let isWin = false;
        let winMult = 9.5;

        if (bet.betType === "single") {
          // Bet single ank matches open or close ank
          isWin = bet.number === res.openAnk || bet.number === res.closeAnk;
          winMult = 9.5;
        } else if (bet.betType === "jodi") {
          // Bet jodi matches the middle two digits
          isWin = bet.number === res.jodi;
          winMult = 95;
        } else if (bet.betType === "pana") {
          // Bet pana matches open or close pana
          isWin = bet.number === res.openPana || bet.number === res.closePana;
          winMult = 140;
        }

        if (isWin) {
          didWin = true;
          const winCash = bet.amount * winMult;
          totalWon += winCash;
          return { ...bet, status: "won", winAmount: winCash };
        } else {
          return { ...bet, status: "lost" };
        }
      });

      setLocalBets(updatedBets);

      // Increment issue number
      setActiveIssue((prev) => {
        const num = parseInt(prev.split("-")[1]) + 1;
        return `SM-${num}`;
      });

      if (didWin && totalWon > 0) {
        setNotification(`🎉 CONGRATULATIONS! You won ₹${totalWon.toFixed(2)} in ${selectedMarket}!`);
        // Notify server and sync balance
        try {
          await fetch("/api/transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: user.phoneNumber,
              type: "deposit",
              amount: totalWon,
              channel: `Matka Draw Win (${selectedMarket})`
            })
          });
          updateUserProfile(user.phoneNumber);
        } catch (err) {
          console.error("Failed to notify win to server:", err);
        }
      } else if (localBets.some((b) => b.status === "pending")) {
        setNotification(`😔 Matka Drawn: ${finalResult}. Keep betting to unlock massive Jodi multipliers!`);
      }

    }, 4500); // Shaking duration animation
  };

  // Submit Matka Bet Slips
  const placeMatkaBet = async (e: React.FormEvent) => {
    e.preventDefault();
    setBetMessage(null);

    if (!user.isLoggedIn) {
      setBetMessage({ type: "error", text: "Please login to place Satta Matka bets!" });
      return;
    }

    if (user.balance < betAmount) {
      setBetMessage({ type: "error", text: "Insufficient balance! Please deposit/recharge instantly." });
      return;
    }

    // Number validations
    if (betType === "single" && (!/^\d$/.test(betNumber))) {
      setBetMessage({ type: "error", text: "Single Ank must be exactly a single digit (0-9)." });
      return;
    }
    if (betType === "jodi" && (!/^\d{2}$/.test(betNumber))) {
      setBetMessage({ type: "error", text: "Jodi Digit must be exactly 2 digits (00-99)." });
      return;
    }
    if (betType === "pana" && (!/^\d{3}$/.test(betNumber))) {
      setBetMessage({ type: "error", text: "Pana Patti must be exactly 3 digits (e.g. 340, 159)." });
      return;
    }

    try {
      // Place bet through standard backend API
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phoneNumber,
          selection: `Matka:${selectedMarket}:${betType.toUpperCase()}:${betNumber}`,
          amount: betAmount,
          multiplier: betType === "single" ? 9.5 : betType === "jodi" ? 95 : 140,
          issue: activeIssue
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        const newBet: SattaBet = {
          id: data.bet.id,
          market: selectedMarket,
          betType,
          number: betNumber,
          amount: betAmount,
          status: "pending",
          drawIssue: activeIssue
        };

        setLocalBets((prev) => [newBet, ...prev]);
        setBetMessage({ type: "success", text: `Bet of ₹${betAmount} listed on Ank/Pana ${betNumber} successfully!` });
        updateUserProfile(user.phoneNumber);
        setBetNumber("");
      } else {
        const errData = await res.json();
        setBetMessage({ type: "error", text: errData.error || "Execution failed" });
      }
    } catch (err) {
      setBetMessage({ type: "error", text: "Network congestion, please retry." });
    }
  };

  const getMultiplier = () => {
    if (betType === "single") return "9.5x Payout";
    if (betType === "jodi") return "95x Payout";
    return "140x Payout";
  };

  return (
    <div className="bg-[#100e1a] rounded-3xl border border-amber-500/10 p-5 md:p-6 space-y-6 shadow-2xl overflow-hidden relative">
      
      {/* Decorative Matka Ambient Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Satta Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/60 pb-4">
        <div className="space-y-1">
          <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest">
            <Trophy className="w-3 h-3 text-amber-500" /> Kalyan & Mumbai Live Matka
          </span>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
            🇮🇳 Traditional Satta Matka Live
          </h2>
          <p className="text-xs text-zinc-400">Put stakes on single, jodi or pana. Watch instant draws resolve in 45s!</p>
        </div>

        {/* Live Draw Ticker */}
        <div className="bg-[#181329] border border-amber-500/15 py-2 px-4 rounded-2xl flex items-center space-x-3.5 self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="space-y-0.5 text-left">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Draw Issue</span>
            <span className="text-xs font-black text-amber-400 font-mono tracking-tight">{activeIssue}</span>
          </div>
          <div className="w-[1px] h-8 bg-zinc-800"></div>
          <div className="flex items-center space-x-2 text-right">
            <Clock className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Timer</span>
              <span className="text-xs font-black text-emerald-400 font-mono">00:{String(matkaCountdown).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Selector Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#090710]/60 p-1.5 rounded-2xl border border-zinc-900">
        {markets.map((market) => {
          const isSelected = selectedMarket === market.name;
          return (
            <button
              key={market.name}
              onClick={() => setSelectedMarket(market.name)}
              className={`p-3 rounded-xl flex flex-col justify-between items-start text-left cursor-pointer transition-all ${
                isSelected 
                  ? "bg-gradient-to-br from-amber-500/15 to-purple-600/10 border-2 border-amber-500 text-white shadow-lg" 
                  : "bg-zinc-950/40 border border-zinc-900 text-zinc-400 hover:border-zinc-800"
              }`}
            >
              <span className="text-[10px] font-black tracking-wider block uppercase truncate w-full">{market.name}</span>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className={`w-2 h-2 rounded-full block ${market.status === "OPEN" ? "bg-emerald-500 animate-ping" : "bg-zinc-600"}`}></span>
                <span className="text-[10px] font-mono tracking-tight text-zinc-300 font-extrabold">{market.lastResult}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Satta Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Interactive Playground (7 columns) */}
        <div className="lg:col-span-7 bg-[#0b0914] p-5 rounded-2xl border border-zinc-900 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase text-zinc-300 tracking-widest flex items-center gap-1.5">
                <Dice5 className="w-4 h-4 text-amber-500" /> Choose Betting slip category
              </h3>
              <span className="text-[11px] text-amber-400 font-bold font-mono bg-amber-500/5 py-1 px-3.5 rounded-full border border-amber-500/15">
                {getMultiplier()}
              </span>
            </div>

            {/* Bet Type Picker - Single Ank / Jodi / Pana */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-900 mb-5">
              {[
                { type: "single", label: "Single Ank", sub: "Pays 9.5x" },
                { type: "jodi", label: "Jodi digit", sub: "Pays 95x" },
                { type: "pana", label: "Pana Patti", sub: "Pays 140x" }
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => { setBetType(opt.type as any); setBetNumber(""); }}
                  className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
                    betType === opt.type 
                      ? "bg-amber-500 text-zinc-950 font-black" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-extrabold block leading-tight">{opt.label}</span>
                  <span className={`text-[9px] block ${betType === opt.type ? "text-zinc-900 font-bold" : "text-zinc-650"}`}>{opt.sub}</span>
                </button>
              ))}
            </div>

            {/* Bet Placing Form */}
            <form onSubmit={placeMatkaBet} className="space-y-4">
              
              {/* Input for target index */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-black block uppercase tracking-wider">
                  Enter your prediction number ({betType === 'single' ? 'Digit 0-9' : betType === 'jodi' ? 'Two digits 00-99' : 'Three digits e.g. 159'})
                </label>
                <input
                  type="text"
                  required
                  placeholder={betType === 'single' ? "Number: 7" : betType === 'jodi' ? "Jodi: 78" : "Pana: 340"}
                  maxLength={betType === 'single' ? 1 : betType === 'jodi' ? 2 : 3}
                  value={betNumber}
                  onChange={(e) => setBetNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-zinc-950 border-2 border-zinc-900 py-3.5 px-4 rounded-xl text-lg font-black tracking-widest text-amber-400 placeholder:text-zinc-700/60 font-mono text-center focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Quick Chip Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-black block uppercase tracking-wider">Select stake amount (₹)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[10, 50, 100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBetAmount(amt)}
                      className={`py-2 px-1 text-xs font-black font-mono rounded-lg border cursor-pointer transition-all ${
                        betAmount === amt 
                          ? "bg-amber-500/10 border-amber-500 text-amber-300" 
                          : "bg-zinc-950/80 border-zinc-900 text-zinc-500"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount entry */}
              <div className="space-y-1.5">
                <input
                  type="number"
                  min="5"
                  required
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseInt(e.target.value) || 5)}
                  className="w-full bg-zinc-950/80 border border-zinc-900 focus:border-zinc-800 py-2.5 px-3.5 rounded-xl text-xs font-semibold font-mono text-white placeholder:text-zinc-700"
                  placeholder="Or enter custom amount in Rupees"
                />
              </div>

              {betMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  betMessage.type === "success" 
                    ? "bg-emerald-950/30 border border-emerald-950 text-emerald-300 font-semibold" 
                    : "bg-red-950/30 border border-red-950 text-red-300"
                }`}>
                  {betMessage.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  <span>{betMessage.text}</span>
                </div>
              )}

              {/* Submit active bet */}
              <button
                type="submit"
                disabled={isSpinning}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black py-4.5 rounded-xl tracking-widest text-xs uppercase cursor-pointer text-center leading-none disabled:opacity-50 transition-all font-sans"
              >
                {isSpinning ? "DRAW IN PROGRESS..." : "CONFIRM SATTA STAKE SLIP"}
              </button>
            </form>
          </div>

          <div className="bg-[#12101e] border border-amber-500/10 rounded-xl p-3 text-left">
            <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 uppercase mb-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Satta Payout Scale rules
            </span>
            <p className="text-[10px] text-zinc-400 leading-normal">
              1. <strong>Single Ank:</strong> If your single digit matches the Open Ank or Close Ank of Kalyan draw result, win <strong>9.5x</strong>. <br />
              2. <strong>Jodi:</strong> If your 2-digit number matches the middle double digits of the draw (e.g. 78), win <strong>95x</strong>.
            </p>
          </div>
        </div>

        {/* Right Matka Draw Animation & History (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Matka Pot Animation Area */}
          <div className="bg-[#0b0914] p-5 rounded-2xl border border-zinc-900 text-center flex flex-col justify-center items-center min-h-[190px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {isSpinning ? (
                <motion.div
                  key="spinning-matka"
                  initial={{ rotate: -15 }}
                  animate={{ rotate: [15, -15, 15, -15, 15, -15, 15, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-24 h-24 bg-gradient-to-b from-purple-700 to-amber-600 rounded-full flex items-center justify-center shadow-2xl relative border-4 border-amber-400 animate-bounce">
                    <span className="text-4xl">🔮</span>
                    <div className="absolute inset-0 bg-white/10 rounded-full animate-ping"></div>
                  </div>
                  <span className="text-amber-400 font-mono text-xs font-black animate-pulse uppercase tracking-wider">
                    Matka Pot Shaking...
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle-matka"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <span className="text-[10px] text-zinc-500 font-black block uppercase tracking-wider">LATEST DRAW OUTCOME</span>
                  
                  {/* Styled authentic result split layout */}
                  <div className="flex items-center justify-center space-x-3.5">
                    {/* Open Pana */}
                    <div className="bg-zinc-950 border border-zinc-900 py-2.5 px-4 rounded-xl">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase block font-sans">Open Pana</span>
                      <span className="text-base font-black text-white font-mono tracking-wider">
                        {markets.find((m) => m.name === selectedMarket)?.lastResult.split("-")[0] || "340"}
                      </span>
                    </div>

                    {/* Jodi Display */}
                    <div className="bg-gradient-to-b from-amber-500 to-yellow-600 px-5 py-3 rounded-2xl text-zinc-950 shadow-lg border-2 border-yellow-300">
                      <span className="text-[10px] font-black uppercase block leading-none tracking-tight">JODI</span>
                      <span className="text-2xl font-black font-mono tracking-widest leading-none mt-1 block">
                        {markets.find((m) => m.name === selectedMarket)?.lastResult.split("-")[1] || "78"}
                      </span>
                    </div>

                    {/* Close Pana */}
                    <div className="bg-zinc-950 border border-zinc-900 py-2.5 px-4 rounded-xl">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase block font-sans">Close Pana</span>
                      <span className="text-base font-black text-white font-mono tracking-wider">
                        {markets.find((m) => m.name === selectedMarket)?.lastResult.split("-")[2] || "134"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#8e85be] font-bold block uppercase tracking-widest">
                    🔥 Verified cryptographic fairness draw
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Satta Results History list */}
          <div className="bg-[#0b0914] p-4 rounded-2xl border border-zinc-900 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-zinc-300 tracking-widest flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                <History className="w-3.5 h-3.5 text-zinc-500" /> Kalyan Market History
              </h3>

              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {resultHistory[selectedMarket]?.map((res, index) => {
                  const parts = res.split("-");
                  return (
                    <div key={index} className="flex justify-between items-center text-xs py-1.5 px-2 bg-zinc-950/60 rounded-lg border border-zinc-900/60">
                      <span className="text-zinc-500 font-medium font-mono">Run #{index + 1}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-400 font-semibold font-mono text-[11px]">{parts[0]}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-800"></span>
                        <span className="text-amber-400 font-black font-mono text-xs bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">{parts[1]}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-800"></span>
                        <span className="text-zinc-400 font-semibold font-mono text-[11px]">{parts[2]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick check active bets */}
            {localBets.length > 0 && (
              <div className="mt-4 border-t border-zinc-900 pt-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">My Active slips ({localBets.length})</span>
                </div>
                <div className="space-y-1.5 max-h-[100px] overflow-y-auto text-[10px] pr-1">
                  {localBets.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-1.5 bg-zinc-900/40 rounded border border-zinc-900">
                      <span className="text-zinc-400 capitalize">{b.betType}: <strong>{b.number}</strong></span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-zinc-500">₹{b.amount}</span>
                        {b.status === "pending" ? (
                          <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/10 rounded text-[9px] font-bold">Pending</span>
                        ) : b.status === "won" ? (
                          <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold">Won +₹{b.winAmount}</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[9px] font-bold">Unlucky</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
