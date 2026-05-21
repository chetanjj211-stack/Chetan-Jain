import React, { useState, useEffect, useRef } from "react";
import { Coins, CircleDot, Play, HelpCircle, Trophy } from "lucide-react";

interface PlinkoGameProps {
  userBalance: number;
  phoneNumber: string;
  updateProfile: (phone: string) => void;
  setNotification: (msg: string | null) => void;
}

// Fixed Plinko parameters for consistent vector drawing
const ROWS = 8;
const PEGS: { x: number; y: number }[] = [];
for (let r = 0; r < ROWS; r++) {
  const rowY = 50 + r * 22;
  const numPegs = r + 3;
  // Center row pegs horizontally
  for (let i = 0; i < numPegs; i++) {
    const x = 160 - (numPegs - 1) * 11 + i * 22;
    PEGS.push({ x, y: rowY });
  }
}

// Bins multipliers corresponding to falling bins
const BINS_MULTIPLIERS = [10.0, 5.0, 1.5, 0.5, 0.2, 0.5, 1.5, 5.0, 10.0];
const BINS_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981", "#22c55e", "#eab308", "#f97316", "#ef4444"];

interface BallState {
  id: number;
  x: number;
  y: number;
  row: number;
  col: number;
  path: number[]; // 0 for left, 1 for right bounce
  isFinished: boolean;
}

export function PlinkoGame({ userBalance, phoneNumber, updateProfile, setNotification }: PlinkoGameProps) {
  const [dropping, setDropping] = useState(false);
  const [stake, setStake] = useState<number>(100);
  const [balls, setBalls] = useState<BallState[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const ballCounter = useRef(0);

  const dropBall = async () => {
    if (!phoneNumber) {
      setNotification("Please register/login to play Plinko with demo credits!");
      return;
    }
    if (userBalance < stake) {
      setNotification("Insufficient balance. Re-deposit or recharge!");
      return;
    }

    // Decide ball bounce route
    // There are 8 rows, so there are 8 bounces. Let's decide how many bounce right.
    const path: number[] = [];
    let rightBouncesCount = 0;
    for (let r = 0; r < ROWS; r++) {
      const dir = Math.random() > 0.5 ? 1 : 0;
      path.push(dir);
      if (dir === 1) rightBouncesCount++;
    }

    // Bin index is equal to the total number of right bounces!
    // Minimum bin index is 0, maximum is 8 (size 9)
    const finalBinIdx = rightBouncesCount;
    const targetMultiplier = BINS_MULTIPLIERS[finalBinIdx];

    // Deduct stake and lock state via backend API
    try {
      const res = await (await fetch("/api/games/plinko/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, amount: stake, targetMultiplier })
      })).json();

      if (res.success) {
        // Register active ball animation
        setDropping(true);
        const newBall: BallState = {
          id: ++ballCounter.current,
          x: 160,
          y: 35,
          row: -1,
          col: 1, // center
          path,
          isFinished: false
        };

        setBalls(prev => [...prev, newBall]);
        updateProfile(phoneNumber);
      } else {
        setNotification(res.error || "System plinko error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run ball physical falling interval ticks
  useEffect(() => {
    if (balls.length === 0) return;

    const timer = setInterval(() => {
      setBalls(prevBalls => {
        let allFinished = true;
        const updated = prevBalls.map(b => {
          if (b.isFinished) return b;
          allFinished = false;

          const nextRow = b.row + 1;
          if (nextRow >= ROWS) {
            // Ball hits the bin floor!
            // Calculate which bin it landed in by calculating right bounces
            const rightBounces = b.path.reduce((acc, val) => acc + val, 0);
            const targetMult = BINS_MULTIPLIERS[rightBounces];
            const winning = stake * targetMult;
            
            setLastWin(winning);
            setNotification(`🔴 Plinko bounce win: Selected multiplier ${targetMult}x! Received ₹${winning.toFixed(2)} JW credits.`);
            updateProfile(phoneNumber);

            return {
              ...b,
              y: 236,
              isFinished: true
            };
          }

          // Choose coordinates mapping downwards
          const bounceDir = b.path[nextRow]; // 0 or 1
          const nextPegCount = nextRow + 3;
          
          // Next center layout calculation
          const offsetCol = b.col + (bounceDir === 1 ? 1 : 0);
          const nextX = 160 - (nextPegCount - 1) * 11 + (offsetCol * 22);
          const nextY = 50 + nextRow * 22;

          return {
            ...b,
            row: nextRow,
            col: offsetCol,
            x: nextX,
            y: nextY
          };
        });

        if (allFinished) {
          setDropping(false);
          // Purge finished balls after a delay to keep the interface clear
          setTimeout(() => {
            setBalls([]);
          }, 3000);
        }
        return updated;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [balls.length]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background glow overlay */}
      <div className="absolute top-0 left-0 w-36 h-36 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-green-600/15 border border-green-500/30 flex items-center justify-center">
            <CircleDot className="w-5 h-5 text-green-400 animate-bounce" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5 uppercase">
              <span>BGaming Plinko</span>
              <span className="text-[10px] bg-green-600 text-white font-black px-1.5 py-0.5 rounded tracking-widest leading-none">REAL PHYS</span>
            </h3>
            <p className="text-xs text-zinc-400">Balls bounce off pegs dynamically. Extreme buckets pay high-tier mega stakes.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Play board SVG drawing */}
        <div className="md:col-span-2 bg-gradient-to-b from-zinc-950 to-zinc-900 rounded-2xl p-4 border border-zinc-800 flex justify-center">
          <div className="relative w-full max-w-sm">
            <svg 
              viewBox="0 0 320 260" 
              className="w-full h-auto" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Pegs rendering */}
              {PEGS.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r="3" 
                  fill="#ffffff" 
                  opacity="0.85" 
                  stroke="#171717"
                  strokeWidth="1"
                />
              ))}

              {/* Bins compartments on bottom */}
              {BINS_MULTIPLIERS.map((mult, idx) => {
                const binWidth = 22;
                const startX = 160 - (BINS_MULTIPLIERS.length / 2) * binWidth + idx * binWidth;
                return (
                  <g key={idx}>
                    <rect 
                      x={startX} 
                      y="235" 
                      width="20" 
                      height="18" 
                      rx="3" 
                      fill={BINS_COLORS[idx]} 
                      className="transition-all duration-300 hover:brightness-125"
                    />
                    <text 
                      x={startX + 10} 
                      y="247" 
                      fill="#1e1b4b" 
                      fontSize="7" 
                      fontWeight="black" 
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {mult}x
                    </text>
                  </g>
                );
              })}

              {/* Floating balls rendering with seamless transitions */}
              {balls.map((b) => (
                <circle 
                  key={b.id} 
                  cx={b.x} 
                  cy={b.y} 
                  r="6" 
                  fill="#EAB308" 
                  className="transition-all duration-155 ease-bounce drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Stake operations and descriptions */}
        <div className="space-y-4">
          <div className="bg-zinc-950 rounded-2xl border border-zinc-850 p-4 space-y-3">
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest block">Choose multiplier rows</span>
            
            <div className="grid grid-cols-3 gap-2 text-[10px] text-zinc-400">
              <div className="bg-zinc-900 border border-zinc-850 p-2 rounded-lg text-center font-mono">
                <span className="block text-zinc-500">Left Corner</span>
                <span className="text-red-500 font-black">10.0x</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-850 p-2 rounded-lg text-center font-mono">
                <span className="block text-zinc-500">Center Base</span>
                <span className="text-zinc-400 font-bold">0.2x</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-850 p-2 rounded-lg text-center font-mono">
                <span className="block text-zinc-500">Right Corner</span>
                <span className="text-red-500 font-black">10.0x</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide block">Drop Risk Sizing:</span>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 500].map(v => (
                <button
                  key={v}
                  disabled={dropping}
                  onClick={() => setStake(v)}
                  className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${
                    stake === v 
                      ? 'bg-green-600/10 border-green-500 text-green-400 font-bold' 
                      : 'bg-zinc-950 border-zinc-850 text-zinc-400'
                  }`}
                >
                  ₹{v}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={dropBall}
            disabled={dropping}
            className={`w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all ${
              dropping ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'
            }`}
          >
            <Play className="w-4 h-4 text-white" />
            <span className="uppercase tracking-widest">DROP PLINKO BALL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
