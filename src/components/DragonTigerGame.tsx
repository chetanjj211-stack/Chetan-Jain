import React, { useState } from "react";
import { Sparkles, Trophy, Heart, Shield, RefreshCw } from "lucide-react";

interface DragonTigerGameProps {
  userBalance: number;
  phoneNumber: string;
  updateProfile: (phone: string) => void;
  setNotification: (msg: string | null) => void;
}

export function DragonTigerGame({ userBalance, phoneNumber, updateProfile, setNotification }: DragonTigerGameProps) {
  const [betAmt, setBetAmt] = useState<number>(100);
  const [selection, setSelection] = useState<"dragon" | "tiger" | "tie">("dragon");
  const [playing, setPlaying] = useState(false);
  const [gameState, setGameState] = useState<{
    dragonCard: number | null;
    dragonSuit: string | null;
    tigerCard: number | null;
    tigerSuit: string | null;
    outcome: string | null;
    winAmount: number | null;
    message: string | null;
  }>({
    dragonCard: null,
    dragonSuit: null,
    tigerCard: null,
    tigerSuit: null,
    outcome: null,
    winAmount: null,
    message: null,
  });

  const getCardName = (val: number) => {
    if (val === 1) return "A";
    if (val === 11) return "J";
    if (val === 12) return "Q";
    if (val === 13) return "K";
    return String(val);
  };

  const playRound = async () => {
    if (!phoneNumber) {
      setNotification("Please register or login to place real stakes!");
      return;
    }
    if (userBalance < betAmt) {
      setNotification("Insufficient balance. Please deposit UPI credits first.");
      return;
    }
    if (playing) return;

    setPlaying(true);
    setGameState({
      dragonCard: null,
      dragonSuit: null,
      tigerCard: null,
      tigerSuit: null,
      outcome: null,
      winAmount: null,
      message: null,
    });

    try {
      const res = await (await fetch("/api/games/dragontiger/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, amount: betAmt, selection })
      })).json();

      if (res.success) {
        // Slow card flip reveal animation
        setTimeout(() => {
          setGameState({
            dragonCard: res.dragonCard,
            dragonSuit: res.dragonSuit,
            tigerCard: res.tigerCard,
            tigerSuit: res.tigerSuit,
            outcome: res.outcome,
            winAmount: res.winAmount,
            message: res.winAmount > 0 
              ? `🏆 SIUUU! Winning Card drawn! Received +₹${res.winAmount.toFixed(2)}`
              : `😔 Tiger or Dragon got the upper card. Better luck next draw!`
          });

          if (res.winAmount > 0) {
            setNotification(`🔥 Dragon Tiger won: ₹${res.winAmount.toFixed(2)}!`);
          }
          updateProfile(phoneNumber);
          setPlaying(false);
        }, 1200);
      } else {
        setNotification(res.error || "Connection error on card draw");
        setPlaying(false);
      }
    } catch (e) {
      console.error(e);
      setPlaying(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#110f24] to-[#0a0715] border-2 border-[#1e1a3b] rounded-3xl p-5 md:p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Light spots */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">
            🐉
          </div>
          <div className="text-left">
            <h3 className="font-extrabold text-base text-zinc-100 uppercase tracking-tight">Dragon Tiger PVC</h3>
            <p className="text-[10px] text-zinc-400">Bet on high-card. A is 1, K is 13. Tie pays massive 9x.</p>
          </div>
        </div>
        <span className="text-[9px] font-black text-rose-400 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded-full leading-none">
          ⚡ STABLE CARD FEED
        </span>
      </div>

      {/* Game Stage */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 relative">
        {/* VS Indicator */}
        <div className="absolute left-1/2 top-11 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-zinc-950 border-2 border-zinc-900 flex items-center justify-center font-black text-xs text-zinc-500">
          VS
        </div>

        {/* Dragon Column */}
        <div className="bg-gradient-to-b from-red-950/20 to-zinc-950/80 p-4 rounded-2xl border border-red-500/10 text-center space-y-3 relative">
          <span className="text-[9px] text-red-400 font-black block tracking-widest uppercase">DRAGON</span>
          
          {/* Card Slot */}
          <div className="w-20 h-28 mx-auto bg-[#18152c] rounded-xl border-2 border-dashed border-red-500/20 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {playing && !gameState.dragonCard ? (
              <div className="w-12 h-12 rounded-full border-2 border-red-500 border-t-transparent animate-spin"></div>
            ) : gameState.dragonCard ? (
              <div className="ani-fadeIn flex flex-col items-center justify-between h-full p-3 w-full text-red-500 bg-zinc-950 border-2 border-red-500/50 rounded-xl">
                <span className="self-start text-xs font-black">{gameState.dragonSuit}</span>
                <span className="text-3xl font-black">{getCardName(gameState.dragonCard)}</span>
                <span className="self-end text-xs font-black">{gameState.dragonSuit}</span>
              </div>
            ) : (
              <span className="text-2xl text-red-500/20 filter saturate-50">🐉</span>
            )}
          </div>
        </div>

        {/* Tiger Column */}
        <div className="bg-gradient-to-b from-blue-950/20 to-zinc-950/80 p-4 rounded-2xl border border-blue-500/10 text-center space-y-3 relative">
          <span className="text-[9px] text-blue-400 font-black block tracking-widest uppercase">TIGER</span>

          {/* Card Slot */}
          <div className="w-20 h-28 mx-auto bg-[#18152c] rounded-xl border-2 border-dashed border-blue-500/20 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {playing && !gameState.tigerCard ? (
              <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            ) : gameState.tigerCard ? (
              <div className="ani-fadeIn flex flex-col items-center justify-between h-full p-3 w-full text-blue-400 bg-zinc-950 border-2 border-blue-500/50 rounded-xl">
                <span className="self-start text-xs font-black">{gameState.tigerSuit}</span>
                <span className="text-3xl font-black">{getCardName(gameState.tigerCard)}</span>
                <span className="self-end text-xs font-black">{gameState.tigerSuit}</span>
              </div>
            ) : (
              <span className="text-2xl text-blue-400/20 filter saturate-50">🐯</span>
            )}
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      {gameState.message && (
        <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-2xl text-center text-xs animate-fadeIn space-y-1">
          <p className="text-zinc-200 font-black text-[12px] uppercase tracking-wide">{gameState.message}</p>
          {gameState.outcome && (
            <span className="inline-block text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 capitalize">
              Winning Seat: {gameState.outcome}
            </span>
          )}
        </div>
      )}

      {/* Betting Selection Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: "dragon", label: "Dragon 2x", bg: "from-red-950 to-red-900 border-red-500/30 text-red-300", active: "ring-2 ring-red-500 bg-red-600/20 text-white" },
            { id: "tie", label: "Tie 9x Payout", bg: "from-zinc-900 to-zinc-950 border-zinc-800 text-zinc-400", active: "ring-2 ring-amber-500 bg-amber-500/10 text-amber-400" },
            { id: "tiger", label: "Tiger 2x", bg: "from-blue-950 to-blue-900 border-blue-500/30 text-blue-300", active: "ring-2 ring-blue-500 bg-blue-600/20 text-white" }
          ].map((opt) => {
            const isSel = selection === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => !playing && setSelection(opt.id as any)}
                className={`py-2 px-1 text-center rounded-xl font-black border uppercase text-[10px] tracking-wider transition-all duration-200 cursor-pointer flex flex-col justify-center items-center h-16 ${
                  isSel ? opt.active : `bg-gradient-to-b ${opt.bg} hover:brightness-110 opacity-70`
                }`}
              >
                <span className="text-center">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Stake Size Buttons */}
        <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-900/80 space-y-2">
          <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest block text-left">Set Stake (₹)</span>
          <div className="flex flex-wrap gap-1.5 justify-start">
            {[10, 50, 100, 500, 1000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => !playing && setBetAmt(amt)}
                className={`flex-1 min-w-[55px] py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  betAmt === amt 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                    : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Play Trigger Button */}
        <button
          onClick={playRound}
          disabled={playing}
          className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 font-black text-xs py-4 rounded-2xl text-zinc-950 uppercase tracking-widest shadow-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
        >
          {playing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Dealing Royal Cards...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-zinc-950 animate-pulse" />
              <span>Deal Card Win (₹{betAmt})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
