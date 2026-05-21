import React, { useState } from "react";
import { Sparkles, Trophy, Circle, RefreshCw, Star } from "lucide-react";

interface CasinoRouletteGameProps {
  userBalance: number;
  phoneNumber: string;
  updateProfile: (phone: string) => void;
  setNotification: (msg: string | null) => void;
}

export function CasinoRouletteGame({ userBalance, phoneNumber, updateProfile, setNotification }: CasinoRouletteGameProps) {
  const [betAmt, setBetAmt] = useState<number>(100);
  const [selection, setSelection] = useState<string>("red"); // "red", "black", "even", "odd" or "0"-"36"
  const [spinning, setSpinning] = useState(false);
  const [recentOutcomes, setRecentOutcomes] = useState<Array<{ num: number; color: string }>>([
    { num: 14, color: "red" },
    { num: 32, color: "red" },
    { num: 0, color: "green" },
    { num: 26, color: "black" },
  ]);
  const [spinState, setSpinState] = useState<{
    winningNumber: number | null;
    colorOutcome: string | null;
    winAmount: number | null;
    message: string | null;
    angle: number;
  }>({
    winningNumber: null,
    colorOutcome: null,
    winAmount: null,
    message: null,
    angle: 0
  });

  const handleRouletteSpin = async () => {
    if (!phoneNumber) {
      setNotification("Please authenticate first to place Casino bets!");
      return;
    }
    if (userBalance < betAmt) {
      setNotification("Insufficient balance. Please recharge UPI to spin!");
      return;
    }
    if (spinning) return;

    setSpinning(true);
    setSpinState(prev => ({
      ...prev,
      winningNumber: null,
      colorOutcome: null,
      winAmount: null,
      message: null,
      angle: prev.angle + 1080 + Math.random() * 360 // rotate 3 rounds minimum
    }));

    try {
      const res = await (await fetch("/api/games/roulette/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, amount: betAmt, selection })
      })).json();

      if (res.success) {
        // Slow down spinning momentum simulation
        setTimeout(() => {
          setSpinState(prev => ({
            ...prev,
            winningNumber: res.winningNumber,
            colorOutcome: res.colorOutcome,
            winAmount: res.winAmount,
            message: res.winAmount > 0 
              ? `🎉 ROULETTE HIT! Multiplier matches! Received +₹${res.winAmount.toFixed(2)}`
              : `😔 Dropped on slot ${res.winningNumber} (${res.colorOutcome.toUpperCase()}). Better luck next spin!`
          }));

          setRecentOutcomes(prev => [
            { num: res.winningNumber, color: res.colorOutcome },
            ...prev.slice(0, 5)
          ]);

          if (res.winAmount > 0) {
            setNotification(`🎡 Royal Roulette won: ₹${res.winAmount.toFixed(2)}!`);
          }
          updateProfile(phoneNumber);
          setSpinning(false);
        }, 2200);
      } else {
        setNotification(res.error || "Roulette connection error");
        setSpinning(false);
      }
    } catch (e) {
      console.error(e);
      setSpinning(false);
    }
  };

  return (
    <div className="bg-[#0c0a1a] border-2 border-[#1c1836] rounded-3xl p-5 md:p-6 space-y-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3 text-left">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl">🎡</span>
          <div>
            <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-tight flex items-center gap-1.5">
              <span>Vegas Royal Roulette</span>
              <span className="text-[9px] bg-emerald-500 text-zinc-950 px-1.5 py-0.5 rounded font-black tracking-widest">LIVE</span>
            </h3>
            <p className="text-[10px] text-zinc-400">Spin the wheel. Even odds pay 2x, exact number pays a legendary 36x!</p>
          </div>
        </div>
      </div>

      {/* Wheel Render */}
      <div className="flex flex-col items-center justify-center space-y-4 py-3 relative">
        <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-4 border-amber-500/30 bg-zinc-950 shadow-2xl overflow-hidden">
          {/* Wheel spin visualization */}
          <div 
            style={{ 
              transform: `rotate(${spinState.angle}deg)`, 
              transition: spinning ? 'transform 2.2s cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none' 
            }}
            className="absolute inset-2 rounded-full border-2 border-zinc-800 bg-[conic-gradient(from_0deg,#e11d48_0deg_15deg,#18181b_15deg_30deg,#e11d48_30deg_45deg,#18181b_45deg_60deg,#e11d48_60deg_75deg,#18181b_75deg_90deg,#e11d48_90deg_105deg,#18181b_105deg_120deg,#e11d48_120deg_135deg,#18181b_135deg_150deg,#10b981_150deg_165deg,#e11d48_165deg_180deg,#18181b_180deg_195deg,#e11d48_195deg_210deg,#18181b_210deg_225deg,#e11d48_225deg_240deg,#18181b_240deg_255deg,#e11d48_255deg_270deg,#18181b_270deg_285deg,#e11d48_285deg_300deg,#18181b_300deg_315deg,#10b981_315deg_330deg,#e11d48_330deg_345deg,#18181b_345deg_360deg)] shadow-inner"
          ></div>

          {/* Golden Center Hub Pin */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-600 border border-zinc-900 shadow-xl flex items-center justify-center z-10">
            {spinning ? (
              <RefreshCw className="w-5 h-5 text-zinc-950 animate-spin" />
            ) : spinState.winningNumber !== null ? (
              <span className="text-sm font-black text-zinc-950">{spinState.winningNumber}</span>
            ) : (
              <span className="text-xl">🌟</span>
            )}
          </div>
          
          {/* Top Pointer Indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-amber-500 z-20 animate-pulse"></div>
        </div>

        {/* Recent Outcomes Tickers */}
        <div className="flex items-center space-x-1.5 text-[10px] font-mono justify-center">
          <span className="text-zinc-500 font-extrabold uppercase">History:</span>
          {recentOutcomes.map((o, idx) => {
            const isRed = o.color === "red";
            const col = o.color === "green" ? "bg-emerald-500 border-emerald-400" : (isRed ? "bg-rose-600 border-rose-500" : "bg-zinc-900 border-zinc-800");
            return (
              <span key={idx} className={`w-5 h-5 rounded-full flex items-center justify-center border font-black text-[9px] text-white ${col}`}>
                {o.num}
              </span>
            );
          })}
        </div>
      </div>

      {/* Custom Result Banner Display */}
      {spinState.message && (
        <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-2xl text-center text-xs animate-fadeIn space-y-1">
          <p className="text-zinc-200 font-black text-[12px] uppercase tracking-wide">{spinState.message}</p>
          {spinState.colorOutcome && (
            <div className="inline-flex gap-1.5 text-[9px] font-black uppercase text-amber-400 mt-1">
              <span>Index landed:</span>
              <span className={`px-1.5 py-0.2 rounded border text-white ${
                spinState.colorOutcome === "red" ? 'bg-red-650' : (spinState.colorOutcome === "black" ? 'bg-zinc-900' : 'bg-emerald-600')
              }`}>
                {spinState.winningNumber} ({spinState.colorOutcome})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Betting Slips Grid Options */}
      <div className="space-y-4">
        {/* Simple Red/Black/Odd/Even Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "red", label: "Red 2x", col: "bg-red-650 ring-red-500 border-red-500" },
            { id: "black", label: "Black 2x", col: "bg-zinc-90 w-full hover:bg-zinc-850 ring-zinc-700 border-zinc-800 text-zinc-300" },
            { id: "even", label: "Even 2x", col: "bg-zinc-950 hover:bg-zinc-900 border-zinc-900 text-zinc-400" },
            { id: "odd", label: "Odd 2x", col: "bg-zinc-950 hover:bg-zinc-900 border-zinc-900 text-zinc-400" }
          ].map((item) => {
            const isSel = selection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => !spinning && setSelection(item.id)}
                className={`py-2 px-1 text-center font-black rounded-xl border text-[10px] uppercase cursor-pointer transition-all duration-150 flex flex-col justify-center items-center ${
                  isSel 
                    ? "ring-2 ring-amber-500 bg-amber-500/15 text-amber-400" 
                    : `${item.col} opacity-75 hover:opacity-100`
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Exact Number input for the legendary 36x outcome */}
        <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-900 flex justify-between items-center text-xs">
          <div className="text-left space-y-0.5">
            <span className="text-[9px] text-zinc-500 font-extrabold uppercase block tracking-wider leading-none">Jackpot Target Draw Match</span>
            <span className="font-extrabold text-zinc-200">OR: Bet Specific slots (0 - 36) [36x]</span>
          </div>

          <input 
            type="number"
            min="0"
            max="36"
            placeholder="No."
            value={["red", "black", "even", "odd"].includes(selection) ? "" : selection}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (Number(val) >= 0 && Number(val) <= 36)) {
                setSelection(val);
              }
            }}
            disabled={spinning}
            className="w-16 px-2 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg text-center font-mono font-black text-amber-400 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Stake selection list */}
        <div className="bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900 space-y-2">
          <span className="text-[9px] text-zinc-500 font-extrabold uppercase block text-left">Stake Amount (₹)</span>
          <div className="grid grid-cols-6 gap-1">
            {[10, 50, 100, 500, 1000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => !spinning && setBetAmt(amt)}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                  betAmt === amt 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Start Spin Action Button */}
        <button
          onClick={handleRouletteSpin}
          disabled={spinning}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-550 hover:brightness-110 font-black text-xs py-4 rounded-xl uppercase tracking-widest text-zinc-950 cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-40"
        >
          {spinning ? (
            <div className="flex justify-center items-center gap-1.5">
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
              <span>ROULETTE ROTATING...</span>
            </div>
          ) : (
            `Spin for ₹${betAmt}`
          )}
        </button>
      </div>
    </div>
  );
}
