import React, { useState, useEffect, useRef } from "react";
import { Play, TrendingUp, HelpCircle, Coins, Award, Users, ShieldCheck, Flame } from "lucide-react";

interface AviatorGameProps {
  userBalance: number;
  phoneNumber: string;
  updateProfile: (phone: string) => void;
  setNotification: (msg: string | null) => void;
}

interface AviatorBetLog {
  username: string;
  amount: number;
  cashout?: number;
  status: "betting" | "cashed_out" | "lost";
}

export function AviatorGame({ userBalance, phoneNumber, updateProfile, setNotification }: AviatorGameProps) {
  const [gameState, setGameState] = useState<"idle" | "launching" | "flying" | "crashed">("idle");
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [crashPoint, setCrashPoint] = useState<number>(1.80);
  const [countdown, setCountdown] = useState<number>(5); // 5 sec between rounds
  
  // Bet interaction states
  const [betAmount, setBetAmount] = useState<number>(100);
  const [activeBetId, setActiveBetId] = useState<string | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState<boolean>(false);
  const [isCashedOut, setIsCashedOut] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [historicalCrashes, setHistoricalCrashes] = useState<number[]>([1.25, 3.42, 1.05, 5.80, 2.11, 1.40, 15.30, 1.12]);

  // Live players simulated state
  const [liveBets, setLiveBets] = useState<AviatorBetLog[]>([]);

  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Seed live bets for the current round
  const seedLiveBets = () => {
    const names = ["Aman_99", "LuckyRacer", "JW_VIP_101", "Chetan_King", "SagarY", "NehaS", "Ritesh_Win", "AviatorPro_JW", "PlinkoBooster", "SlotsMaster", "JalwaWinger"];
    const bets: AviatorBetLog[] = Array.from({ length: 12 }, () => {
      const name = names[Math.floor(Math.random() * names.length)] + "_" + Math.floor(100 + Math.random() * 900);
      return {
        username: name,
        amount: Math.floor(10 + Math.random() * 20) * 50,
        status: "betting"
      };
    });
    setLiveBets(bets);
  };

  // Start round cycle loop
  useEffect(() => {
    if (gameState === "idle") {
      seedLiveBets();
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Initiate flight
            startFlight();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // Simulate multiplier tick
  const startFlight = () => {
    setGameState("flying");
    setIsCashedOut(false);
    setWinAmount(0);
    setMultiplier(1.00);

    // Roll random crash point: 1.00x - 100.00x using exponential distribution weight
    const rawRandom = Math.random();
    let rolledCrash = 1.00;
    if (rawRandom < 0.1) rolledCrash = 1.00 + Math.random() * 0.2; // 10% instant crash
    else if (rawRandom < 0.7) rolledCrash = 1.10 + Math.random() * 1.5; // 60% mid range
    else if (rawRandom < 0.95) rolledCrash = 2.50 + Math.random() * 5.0; // 25% nice multipliers
    else rolledCrash = 10.00 + Math.random() * 90.0; // 5% monster rocket rides!

    setCrashPoint(rolledCrash);
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
      // Exponential speed formula for flight altitude feel
      const curMult = parseFloat((1.00 + Math.pow(elapsedSec, 1.4) * 0.08).toFixed(2));

      if (curMult >= rolledCrash) {
        // Crash game!
        setGameState("crashed");
        setMultiplier(rolledCrash);
        setHistoricalCrashes(prev => [rolledCrash, ...prev.slice(0, 11)]);
        setIsBetPlaced(false);
        setActiveBetId(null);
        
        // Mark remaining player bets as lost
        setLiveBets(prev => prev.map(p => p.status === "betting" ? { ...p, status: "lost" } : p));

        setTimeout(() => {
          setGameState("idle");
        }, 3000);
      } else {
        setMultiplier(curMult);

        // Periodically cashout random simulated players matching progress
        setLiveBets(prev => prev.map(p => {
          if (p.status === "betting" && Math.random() < 0.04) {
            return {
              ...p,
              status: "cashed_out",
              cashout: curMult
            };
          }
          return p;
        }));

        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  // Stop animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const initiateBet = async () => {
    if (!phoneNumber) {
      setNotification("Please authenticate/login to bet with credits");
      return;
    }
    if (userBalance < betAmount) {
      setNotification("Insufficient credits. Please recharge your wallet!");
      return;
    }

    try {
      const res = await (await fetch("/api/games/aviator/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, amount: betAmount })
      })).json();

      if (res.success) {
        setIsBetPlaced(true);
        setActiveBetId(res.betId);
        updateProfile(phoneNumber);
      } else {
        setNotification(res.error || "Failed to register crash flight");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const executeCashout = async () => {
    if (!activeBetId || isCashedOut) return;

    try {
      const res = await (await fetch("/api/games/aviator/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, betId: activeBetId, multiplier: multiplier })
      })).json();

      if (res.success) {
        setIsCashedOut(true);
        setIsBetPlaced(false);
        const wonReward = betAmount * multiplier;
        setWinAmount(wonReward);
        setNotification(`🚀 Cashed out successfully at ${multiplier}x! Credited ₹${wonReward.toFixed(2)}`);
        updateProfile(phoneNumber);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Absolute glow backing */}
      <div className="absolute top-0 left-0 w-44 h-44 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header with Spribe theme indicators */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center">
            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5 uppercase">
              <span>Spribe Aviator</span>
              <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded tracking-widest leading-none">ORIGINAL</span>
            </h3>
            <p className="text-xs text-zinc-400">Lock flight bets before takeover. Multiplier rises with velocity.</p>
          </div>
        </div>

        {/* Dynamic past multipliers bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto max-w-sm pb-1 sm:pb-0 scrollbar-none">
          {historicalCrashes.map((val, idx) => (
            <span 
              key={idx} 
              className={`text-[10px] font-black rounded px-2 py-0.5 font-mono ${
                val >= 2.0 
                  ? 'bg-purple-950/40 text-purple-400 ring-1 ring-purple-500/20' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {val.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playfield Canvas representation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative h-64 bg-zinc-950 rounded-2xl border border-zinc-850 overflow-hidden flex flex-col justify-between p-4">
            
            {/* Grid system graphic container */}
            <div className="absolute inset-0 bg-[radial-gradient(#1c1917_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-40"></div>
            
            {/* Horizontal axis guides */}
            <div className="absolute right-0 bottom-8 left-8 border-b border-zinc-800/40"></div>
            <div className="absolute left-8 top-0 bottom-8 border-l border-zinc-800/40"></div>

            {/* Match State overlays */}
            <div className="flex justify-between items-center z-10">
              <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-mono">JW SERVER FLIGHT STATUS</span>
              <span className="text-xs text-red-400 font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-mono">
                {gameState === "flying" ? "FLYING LIVE" : "MATCH PREPARING"}
              </span>
            </div>

            {/* Interactive Vector plane flight trajectory */}
            <div className="relative flex-1 flex items-center justify-center">
              {gameState === "idle" && (
                <div className="text-center space-y-2 z-10 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 backdrop-blur">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">Preparing next round</span>
                  <div className="text-4xl font-extrabold text-white font-mono animate-pulse">00:0{countdown}</div>
                  <span className="text-[10px] text-zinc-500 block">Flight launch authorization pending</span>
                </div>
              )}

              {gameState === "flying" && (
                <div className="text-center z-10 select-none">
                  <div className="text-6xl font-black font-mono tracking-tighter bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent transform scale-110">
                    {multiplier.toFixed(2)}x
                  </div>
                  <div className="text-xs text-zinc-500 tracking-widest uppercase font-mono pt-1">Current Altitude</div>
                </div>
              )}

              {gameState === "crashed" && (
                <div className="text-center z-10 bg-rose-950/20 border border-rose-900/40 px-6 py-4 rounded-2xl backdrop-blur">
                  <div className="text-xs tracking-wider text-rose-400 font-bold uppercase pb-1 font-mono">FLEW AWAY!</div>
                  <div className="text-4xl font-extrabold text-rose-500 font-mono">@ {multiplier.toFixed(2)}x</div>
                </div>
              )}

              {/* Graphic Plot Plane flight curve using simple SVG overlay */}
              {gameState === "flying" && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Flight curved trajectory line */}
                  <path 
                    d={`M 40 220 Q ${80 + Math.min(multiplier * 12, 120)} ${180 - Math.min(multiplier * 8, 80)} ${Math.min(multiplier * 32 + 35, 340)} ${220 - Math.min(Math.pow(multiplier, 1.4) * 8, 160)}`} 
                    fill="none" 
                    stroke="#EF4444" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  {/* Glowing plane red rocket SVG icon */}
                  <g transform={`translate(${Math.min(multiplier * 32 + 25, 335)}, ${210 - Math.min(Math.pow(multiplier, 1.4) * 8, 160)}) scale(1.1)`}>
                    <circle cx="0" cy="0" r="12" fill="#EF4444" opacity="0.15" className="animate-ping" />
                    <path 
                      d="M -6 -2 L -1 -5 L 4 -2 L 10 0 L 4 2 L -1 5 L -6 2 L -3 0 Z" 
                      fill="#EF4444" 
                      stroke="#FFFFFF" 
                      strokeWidth="1.5"
                    />
                  </g>
                </svg>
              )}
            </div>

            {/* Bottom Trajectory scale indicators */}
            <div className="flex justify-between items-end text-[10px] font-mono text-zinc-500 pt-2 z-10 border-t border-zinc-800/20">
              <span>0.0s</span>
              <span>2.5s</span>
              <span>5.0s</span>
              <span>7.5s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Sizable Bet options and parameters */}
          <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="space-y-2 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Choose Base stake</span>
              <div className="flex items-center space-x-2">
                <input 
                  type="number"
                  min="10"
                  max="10000"
                  disabled={isBetPlaced}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  className="w-32 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-red-500"
                />
                <div className="grid grid-cols-4 gap-1">
                  {[100, 500, 2000, 5000].map(val => (
                    <button 
                      key={val}
                      disabled={isBetPlaced}
                      onClick={() => setBetAmount(val)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-855 text-[10px] font-bold font-mono text-zinc-400 rounded cursor-pointer"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto flex-shrink-0">
              {!isBetPlaced ? (
                <button
                  onClick={initiateBet}
                  disabled={gameState !== "idle"}
                  className="w-full sm:w-48 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 font-extrabold text-sm py-4 px-6 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all cursor-pointer leading-tight"
                >
                  <span className="uppercase text-white tracking-widest">BET FOR FLIGHT</span>
                  <span className="text-[10px] font-mono text-emerald-100 font-bold">₹{betAmount} JW Credits</span>
                </button>
              ) : (
                <button
                  onClick={executeCashout}
                  disabled={isCashedOut || gameState !== "flying"}
                  className={`w-full sm:w-48 text-zinc-950 font-extrabold text-sm py-4 px-6 rounded-xl flex flex-col items-center justify-center shadow-xl transition-all cursor-pointer leading-tight ${
                    isCashedOut 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 active:scale-95 animate-bounce shadow-amber-500/20'
                  }`}
                >
                  <span className="uppercase tracking-widest">CLAIM CASHOUT</span>
                  <span className="text-[10px] font-mono font-bold">₹{(betAmount * multiplier).toFixed(2)}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Multiplayer betting screen */}
        <div className="lg:col-span-1 bg-zinc-950 rounded-2xl border border-zinc-850 p-4 space-y-3 flex flex-col max-h-[380px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
            <span className="text-[11px] font-black tracking-wide text-zinc-400 uppercase flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-zinc-500" /> Live Room Bets
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none scrollbar-none">
            {liveBets.map((player, idx) => {
              let tagStyle = "text-zinc-500";
              let rowBorder = "border-zinc-900";
              if (player.status === "cashed_out") {
                tagStyle = "text-emerald-400 font-bold font-mono";
                rowBorder = "border-emerald-950/20 bg-emerald-950/5";
              } else if (player.status === "lost") {
                tagStyle = "text-rose-500 text-opacity-80";
              }

              return (
                <div key={idx} className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg border ${rowBorder} text-zinc-300 font-mono`}>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                    <span className="text-zinc-400 text-xs font-semibold">{player.username}</span>
                  </div>
                  <div className="text-right flex items-center space-x-2">
                    <span className="text-zinc-500 text-[10px]">₹{player.amount}</span>
                    <span className={`text-[11px] font-mono ${tagStyle}`}>
                      {player.status === "betting" ? "Waiting..." : player.status === "cashed_out" ? `${player.cashout?.toFixed(2)}x` : "Lost"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-zinc-850 pt-2 text-[9px] text-zinc-500 font-bold text-center uppercase tracking-widest font-mono">
            SECURE BET PORTAL EXTREMIST ACCURACY
          </div>
        </div>
      </div>
    </div>
  );
}
