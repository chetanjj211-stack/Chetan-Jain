import React, { useState, useEffect, useRef } from "react";
import { Coins, Sparkles, RefreshCw, EyeOff, Shield, Target } from "lucide-react";

interface FishingHunterGameProps {
  userBalance: number;
  phoneNumber: string;
  updateProfile: (phone: string) => void;
  setNotification: (msg: string | null) => void;
}

interface SeaFish {
  id: string;
  name: string;
  emoji: string;
  multiplier: number;
  x: number;
  y: number;
  speed: number;
  width: number;
  direction: 1 | -1;
  color: string;
}

export function FishingHunterGame({ userBalance, phoneNumber, updateProfile, setNotification }: FishingHunterGameProps) {
  const [bulletCost, setBulletCost] = useState<number>(10);
  const [shooting, setShooting] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  
  // Sea Fishes swimming coordinates
  const [fishes, setFishes] = useState<SeaFish[]>([]);
  const [splashes, setSplashes] = useState<Array<{ id: string; x: number; y: number; text: string }>>([]);

  const arenaRef = useRef<HTMLDivElement>(null);

  // Initialize Sea Creatures with distinct speed, and multiplier configurations
  useEffect(() => {
    const defaultCreatures = [
      { id: "1", name: "Clownfish", emoji: "🐠", multiplier: 1.5, x: 10, y: 30, speed: 2, width: 45, direction: 1 as 1 | -1, color: "text-orange-400" },
      { id: "2", name: "Jellyfish", emoji: "🪼", multiplier: 3, x: 90, y: 70, speed: 1.5, width: 45, direction: -1 as 1 | -1, color: "text-purple-400" },
      { id: "3", name: "Pufferfish", emoji: "🐡", multiplier: 6, x: 40, y: 50, speed: 2.2, width: 45, direction: 1 as 1 | -1, color: "text-yellow-400" },
      { id: "4", name: "Hammer Shark", emoji: "🦈", multiplier: 15, x: 110, y: 20, speed: 1.2, width: 60, direction: -1 as 1 | -1, color: "text-zinc-400 font-bold" },
      { id: "5", name: "Golden Turtle", emoji: "🐢", multiplier: 40, x: -10, y: 80, speed: 0.9, width: 50, direction: 1 as 1 | -1, color: "text-amber-500 animate-pulse" },
      { id: "6", name: "Sea Dragon", emoji: "🐉", multiplier: 120, x: 50, y: 40, speed: 0.7, width: 70, direction: -1 as 1 | -1, color: "text-emerald-400 font-extrabold animate-bounce" }
    ];
    setFishes(defaultCreatures);
  }, []);

  // Frame Loop animating the swim patterns
  useEffect(() => {
    const interval = setInterval(() => {
      setFishes((prev) =>
        prev.map((fish) => {
          let nextX = fish.x + fish.speed * fish.direction;
          let nextDirection = fish.direction;

          // Wrap or bounce around layout limits
          if (nextX > 110) {
            nextX = -15; // loop back
          } else if (nextX < -20) {
            nextX = 105;
          }

          return {
            ...fish,
            x: nextX,
          };
        })
      );
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // Cleanup brief floating splashes after payout rewards trigger
  useEffect(() => {
    if (splashes.length > 0) {
      const timeout = setTimeout(() => {
        setSplashes((prev) => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [splashes]);

  const fireAtFish = async (targetFish: SeaFish, clientX: number, clientY: number) => {
    if (!phoneNumber) {
      setNotification("Create or login to an account to start fishing!");
      return;
    }
    if (userBalance < bulletCost) {
      setNotification("Needs recharge! Please deposit ₹100 or higher.");
      return;
    }
    if (shooting) return;

    setShooting(true);

    try {
      // Connect to secure server-authoritative fishing endpoint
      const response = await fetch("/api/games/fishing/shoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: bulletCost,
          fishMultiplier: targetFish.multiplier,
          fishName: targetFish.name,
        }),
      });

      const res = await response.json();

      if (res.success) {
        if (res.isCaptured) {
          const winNet = bulletCost * targetFish.multiplier;
          setPointsEarned(winNet);
          
          setSplashes((prev) => [
            ...prev,
            { 
              id: Math.random().toString(), 
              x: clientX, 
              y: clientY, 
              text: `🚨 CAPTURED! +₹${winNet.toFixed(1)} (${targetFish.multiplier}x)` 
            }
          ]);

          setNotification(`🐠 Captured ${targetFish.name}! Won ₹${winNet.toFixed(2)}`);
        } else {
          setSplashes((prev) => [
            ...prev,
            { 
              id: Math.random().toString(), 
              x: clientX, 
              y: clientY, 
              text: `💨 Missed!` 
            }
          ]);
        }
        updateProfile(phoneNumber);
      } else {
        setNotification(res.error || "System error during shot");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setShooting(false);
    }
  };

  const handleSplashBackground = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shooting) return;
    if (userBalance < bulletCost) {
      setNotification("Needs recharge! Please deposit ₹100 or higher.");
      return;
    }

    // Get clicks inside the ocean viewport arena
    const bounds = arenaRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const xPercent = ((e.clientX - bounds.left) / bounds.width) * 100;
    const yPercent = ((e.clientY - bounds.top) / bounds.height) * 100;

    // Check if clicked closely on any swimming fish
    let hitSomething = false;
    for (let fish of fishes) {
      const distance = Math.sqrt(Math.pow(fish.x - xPercent, 2) + Math.pow(fish.y - yPercent, 2));
      if (distance < 10) { // Hit bubble threshold
        fireAtFish(fish, xPercent, yPercent);
        hitSomething = true;
        break;
      }
    }

    if (!hitSomething) {
      // Fire general bullet into water
      fireDudNet(xPercent, yPercent);
    }
  };

  const fireDudNet = async (x: number, y: number) => {
    if (!phoneNumber) return;
    if (userBalance < bulletCost) return;

    // Direct deduction mock call for general laser nets containing no targets
    setSplashes((prev) => [
      ...prev,
      { id: Math.random().toString(), x, y, text: "💥" }
    ]);

    try {
      // Direct call to deduct regular bullet
      await fetch("/api/games/fishing/shoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: bulletCost,
          fishMultiplier: 0.1, // extremely low chance dummy multiplier
          fishName: "Water Ripple",
        }),
      });
      updateProfile(phoneNumber);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-[#05060f] border-2 border-[#16172e] rounded-3xl p-5 md:p-6 space-y-5 shadow-22xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-2 text-left">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🐠</span>
          <div>
            <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-tight">Jili Ocean King Fishhunter</h3>
            <p className="text-[10px] text-zinc-400">Click on any swimming fish to fire laser nets. Larger targets yield crazy payouts!</p>
          </div>
        </div>
      </div>

      {/* Interactive Ocean Stage Area */}
      <div 
        ref={arenaRef}
        onClick={handleSplashBackground}
        className="w-full h-[220px] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#0c2040] via-[#030c1e] to-[#01040a] border border-zinc-900 rounded-2xl relative overflow-hidden cursor-crosshair shadow-inner"
      >
        <div className="absolute inset-0 bg-[#00ffcc]/5 pointer-events-none mix-blend-overlay"></div>

        {/* Coral Ambient Ornaments */}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-emerald-950/20 to-transparent flex items-center justify-between px-6 pointer-events-none text-xl select-none opacity-40">
          <span>🪸</span>
          <span>🌿</span>
          <span>🪸</span>
          <span>🪴</span>
        </div>

        {/* Swimming Fish Nodes */}
        {fishes.map((f) => {
          const isFlipped = f.direction === -1;
          return (
            <button
              key={f.id}
              type="button"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                transform: `translate(-50%, -50%) ${isFlipped ? 'scaleX(-1)' : ''}`,
                transition: 'top 0.3s ease'
              }}
              className="absolute p-3 rounded-full hover:bg-white/5 active:scale-110 flex flex-col items-center select-none cursor-crosshair leading-none pointer-events-auto"
            >
              <span className="text-3xl filter drop-shadow-[0_2px_5px_rgba(0,10,40,0.7)]">{f.emoji}</span>
              <span className={`text-[8px] font-black uppercase text-center mt-1 bg-zinc-950/80 px-1 py-0.2 rounded border border-zinc-900 leading-none ${f.color}`}>
                {f.multiplier}x
              </span>
            </button>
          );
        })}

        {/* Splash animations & points overlays */}
        {splashes.map((s) => (
          <div
            key={s.id}
            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%, -50%)" }}
            className="absolute pointer-events-none text-white text-[9px] font-black uppercase font-mono tracking-wider bg-zinc-950 border border-amber-500/35 px-2 py-0.5 rounded shadow-xl animate-bounce leading-none"
          >
            {s.text}
          </div>
        ))}
      </div>

      {/* Stake config bar */}
      <div className="space-y-4">
        {/* Stake choice button tags */}
        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-900 space-y-2">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-zinc-500 font-extrabold uppercase">Bullet Net Power</span>
            <span className="text-amber-400 font-mono font-bold font-mono">Current cost: ₹{bulletCost}/Laser</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[10, 50, 100, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBulletCost(amt)}
                className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                  bulletCost === amt 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md' 
                    : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Tip log info */}
        <div className="text-center text-[9px] text-zinc-500 font-medium">
          💡 Click directly on swimming fish to fire nets. Direct hits trigger capture simulations.
        </div>
      </div>

    </div>
  );
}
