import React, { useState } from "react";
import { HelpCircle, Sparkles, User, LogIn, Coins, Play, AlertOctagon, Check, ShieldAlert } from "lucide-react";

interface MinesGameProps {
  userBalance: number;
  phoneNumber: string;
  updateProfile: (phone: string) => void;
  setNotification: (msg: string | null) => void;
}

interface TileState {
  index: number;
  status: "hidden" | "gem" | "mine";
}

export function MinesGame({ userBalance, phoneNumber, updateProfile, setNotification }: MinesGameProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "crashed">("idle");
  const [stake, setStake] = useState<number>(100);
  const [minesCount, setMinesCount] = useState<number>(3);
  
  // Grid board states
  const [board, setBoard] = useState<TileState[]>(Array.from({ length: 25 }, (_, i) => ({ index: i, status: "hidden" })));
  const [minesIndices, setMinesIndices] = useState<number[]>([]);
  const [activeBetId, setActiveBetId] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [currentMult, setCurrentMult] = useState<number>(1.00);

  // Progressive multiplier calculation based on standard Mine payouts formula
  const getNextMultiplier = (count: number) => {
    // Simple readable progression
    let base = 1.0;
    for (let i = 0; i <= count; i++) {
      base *= (25 - i) / (25 - i - minesCount);
    }
    // Scale slightly for realistic house edge index
    return parseFloat((base * 0.96).toFixed(2));
  };

  const startGame = async () => {
    if (!phoneNumber) {
      setNotification("Please authenticate/login to access InOut Mines.");
      return;
    }
    if (userBalance < stake) {
      setNotification("Insufficient credits. Please recharge your wallet!");
      return;
    }
    if (minesCount < 1 || minesCount > 24) {
      setNotification("Please select number of mines from 1 to 24.");
      return;
    }

    try {
      const res = await (await fetch("/api/games/mines/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, amount: stake })
      })).json();

      if (res.success) {
        setActiveBetId(res.betId);
        
        // Randomly scatter mines on grid internally
        const indices: number[] = [];
        while (indices.length < minesCount) {
          const rand = Math.floor(Math.random() * 25);
          if (!indices.includes(rand)) indices.push(rand);
        }

        setMinesIndices(indices);
        setBoard(Array.from({ length: 25 }, (_, i) => ({ index: i, status: "hidden" })));
        setRevealedCount(0);
        setCurrentMult(1.00);
        setGameState("playing");
        updateProfile(phoneNumber);
      } else {
        setNotification(res.error || "Mines start failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTileClick = async (tileIdx: number) => {
    if (gameState !== "playing" || board[tileIdx].status !== "hidden") return;

    if (minesIndices.includes(tileIdx)) {
      // Hit a mine! Boom!
      setGameState("crashed");
      
      // Reveal entire mine layout
      setBoard(prev => prev.map(t => {
        if (minesIndices.includes(t.index)) {
          return { ...t, status: "mine" };
        }
        return t;
      }));

      // Report boom crash to backend wallet synchronizer
      try {
        await fetch("/api/games/mines/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNumber, betId: activeBetId, hitBomb: true })
        });
        setNotification("💥 Hit a mine! Stake lost. Try another round.");
        updateProfile(phoneNumber);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Found a safe Gem coin!
      const nextCount = revealedCount + 1;
      setRevealedCount(nextCount);
      
      const newMult = getNextMultiplier(nextCount);
      setCurrentMult(newMult);

      setBoard(prev => prev.map(t => t.index === tileIdx ? { ...t, status: "gem" } : t));

      // If user clears all non-mines tiles, instant win!
      if (nextCount === 25 - minesCount) {
        claimWin(newMult);
      }
    }
  };

  const claimWin = async (payoutMult: number = currentMult) => {
    if (!activeBetId || gameState !== "playing") return;

    try {
      const res = await (await fetch("/api/games/mines/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, betId: activeBetId, multiplier: payoutMult, hitBomb: false })
      })).json();

      if (res.success) {
        setGameState("won");
        const reward = stake * payoutMult;
        setNotification(`👑 Cashed Out successfully! Credited ₹${reward.toFixed(2)} JW Credits.`);
        updateProfile(phoneNumber);
        
        // Reveal remaining gem boards
        setBoard(prev => prev.map(t => {
          if (minesIndices.includes(t.index)) return { ...t, status: "mine" };
          return t;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Absolute backdrop glow */}
      <div className="absolute top-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5 uppercase">
              <span>InOut Mines</span>
              <span className="text-[10px] bg-purple-600 text-white font-black px-1.5 py-0.5 rounded tracking-widest leading-none">STRATEGY</span>
            </h3>
            <p className="text-xs text-zinc-400">Reveal safe gold crowns to progressively increase payout rewards. Cashout anytime.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Playfield card grid */}
        <div className="md:col-span-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-850 flex items-center justify-center">
          <div className="grid grid-cols-5 gap-2 max-w-[280px] w-full aspect-square">
            {board.map((tile, idx) => {
              let bgClass = "bg-zinc-900 hover:bg-zinc-800 border-zinc-805";
              let content = "";

              if (tile.status === "gem") {
                bgClass = "bg-gradient-to-tr from-amber-400 to-yellow-500 border-amber-300 shadow-lg scale-95 shadow-amber-500/10";
                content = "👑";
              } else if (tile.status === "mine") {
                bgClass = "bg-gradient-to-tr from-red-600 to-rose-700 border-red-500 animate-shake";
                content = "💥";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  disabled={gameState !== "playing" || tile.status !== "hidden"}
                  className={`w-full aspect-square border-2 rounded-xl text-lg flex items-center justify-center font-bold tracking-tight transition-all duration-150 ${bgClass}`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Param select */}
        <div className="space-y-4">
          <div className="bg-zinc-950 rounded-2xl border border-zinc-850 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span className="font-bold">Mines count (1-24):</span>
              <span className="text-purple-400 font-extrabold">{minesCount} SKU</span>
            </div>
            <input 
              type="range"
              min="1"
              max="24"
              disabled={gameState === "playing"}
              value={minesCount}
              onChange={e => setMinesCount(parseInt(e.target.value) || 3)}
              className="w-full accent-purple-500 h-1.5 bg-zinc-900 rounded-lg cursor-pointer"
            />
            {gameState === "playing" && (
              <div className="pt-2 text-center text-xs font-mono">
                <span className="text-zinc-500 block uppercase tracking-wider">Next Multiplier Payout</span>
                <span className="text-2xl font-black text-amber-400">{getNextMultiplier(revealedCount).toFixed(2)}x</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide block">Select Stake Sizing:</span>
            <div className="grid grid-cols-3 gap-2">
              {[50, 200, 1000].map(v => (
                <button
                  key={v}
                  disabled={gameState === "playing"}
                  onClick={() => setStake(v)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                    stake === v 
                      ? 'bg-purple-600/10 border-purple-500 text-purple-400 font-bold' 
                      : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                  }`}
                >
                  ₹{v}
                </button>
              ))}
            </div>
          </div>

          {gameState !== "playing" ? (
            <button
              onClick={startGame}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs py-4 rounded-xl flex items-center justify-center space-x-2 tracking-widest uppercase shadow-lg shadow-purple-600/10 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>START EXPLORING MINES</span>
            </button>
          ) : (
            <button
              onClick={() => claimWin()}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-zinc-950 font-black text-xs py-4 rounded-xl flex flex-col items-center justify-center tracking-widest uppercase shadow-lg shadow-amber-500/10 animate-pulse cursor-pointer"
            >
              <span>CLAIM SECURE WIN</span>
              <span className="text-[9px] font-mono leading-none pt-1">₹{(stake * currentMult).toFixed(2)} WR Balance</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
