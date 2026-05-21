import React, { useState, useEffect } from "react";
import { 
  Trophy, Coins, Clock, Play, History, CheckCircle, AlertCircle, 
  Tv, Sparkles, ChevronRight, RefreshCw, Star, Info, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SportsBettingGameProps {
  user: any;
  updateUserProfile: (phone: string) => Promise<void>;
  setNotification: (text: string | null) => void;
}

interface SportsBet {
  id: string;
  matchId: string;
  matchName: string;
  sport?: "cricket" | "football";
  betType: string;
  selection: string;
  odds: number;
  amount: number;
  status: "pending" | "won" | "lost";
  winAmount?: number;
}

interface MatchFixture {
  id: string;
  sport: "cricket" | "football";
  league: string;
  teamA: string;
  teamB: string;
  scoreA: number | string;
  scoreB: number | string;
  status: "LIVE" | "UPCOMING" | "COMPLETED";
  commentary: string;
  oddsA: number;
  oddsDraw?: number;
  oddsB: number;
  timeRemaining: string; // e.g. "18.4 Overs" or "74th Min"
}

export function SportsBettingGame({ user, updateUserProfile, setNotification }: SportsBettingGameProps) {
  const [selectedSport, setSelectedSport] = useState<"all" | "cricket" | "football">("all");
  const [activeMatch, setActiveMatch] = useState<MatchFixture | null>(null);
  const [betSelection, setBetSelection] = useState<{ type: string; name: string; odds: number } | null>(null);
  const [betAmount, setBetAmount] = useState<number>(200);
  const [betSlips, setBetSlips] = useState<SportsBet[]>([]);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active dynamic filters for tickets list
  const [ticketStatusFilter, setTicketStatusFilter] = useState<"all" | "pending" | "won" | "lost">("all");
  const [ticketSportFilter, setTicketSportFilter] = useState<"all" | "cricket" | "football">("all");

  // Dynamic filtering of active/completed sport tickets
  const filteredBetSlips = betSlips.filter((slip) => {
    const matchesStatus = ticketStatusFilter === "all" || slip.status === ticketStatusFilter;
    const matchesSport = ticketSportFilter === "all" || slip.sport === ticketSportFilter;
    return matchesStatus && matchesSport;
  });

  // Live Fixture list
  const [fixtures, setFixtures] = useState<MatchFixture[]>([
    {
      id: "m1",
      sport: "cricket",
      league: "IPL T20 - PlayOffs",
      teamA: "Mumbai Indians (MI)",
      teamB: "Chennai Super Kings (CSK)",
      scoreA: "174/4",
      scoreB: "168/6",
      status: "LIVE",
      commentary: "Jasprit Bumrah lines up for the final over! CSK need 12 runs to win off 6 balls.",
      oddsA: 1.85,
      oddsB: 2.10,
      timeRemaining: "19.0 Overs"
    },
    {
      id: "m2",
      sport: "cricket",
      league: "ICC T20 Championship",
      teamA: "India (IND)",
      teamB: "Pakistan (PAK)",
      scoreA: "135/2",
      scoreB: "0/0",
      status: "LIVE",
      commentary: "Kohli sweeps beautifully past mid-wicket for a boundary! India is solid.",
      oddsA: 1.45,
      oddsB: 2.80,
      timeRemaining: "14.2 Overs"
    },
    {
      id: "m3",
      sport: "football",
      league: "UEFA Champions League",
      teamA: "Real Madrid",
      teamB: "Manchester City",
      scoreA: 2,
      scoreB: 2,
      status: "LIVE",
      commentary: "Erling Haaland shoots from outside the box, but Thibaut Courtois catches it safely!",
      oddsA: 2.45,
      oddsDraw: 3.10,
      oddsB: 2.25,
      timeRemaining: "82nd Min"
    },
    {
      id: "m4",
      sport: "cricket",
      league: "IPL T20 - League",
      teamA: "Royal Challengers Bengaluru",
      teamB: "Kolkata Knight Riders",
      scoreA: "0/0",
      scoreB: "0/0",
      status: "UPCOMING",
      commentary: "Match scheduled to begin in 10 minutes. Toss upcoming.",
      oddsA: 1.95,
      oddsB: 1.95,
      timeRemaining: "Starts in 10m"
    }
  ]);

  // Handle live score/commentary ticker stimulation
  useEffect(() => {
    const interval = setInterval(() => {
      setFixtures((prev) =>
        prev.map((match) => {
          if (match.status !== "LIVE") return match;

          // Perform random sports simulations
          if (match.sport === "cricket") {
            const temp = match.scoreA.toString().split("/");
            let runs = parseInt(temp[0]);
            let wickets = parseInt(temp[1]) || 0;
            
            // Randomly add coordinates
            const dice = Math.random();
            let commentary = match.commentary;
            if (dice < 0.2) {
              runs += 4;
              commentary = `CRACK! Stupendous boundary hit by ${match.teamA.split(" ")[0]}! The crowd goes wild.`;
            } else if (dice < 0.3) {
              runs += 6;
              commentary = `INTO THE STANDS! Massive 6-runs loaded over long-on! Brilliant timing.`;
            } else if (dice < 0.4) {
              wickets = Math.min(9, wickets + 1);
              commentary = `OUT! Clean bowled! Excellent yorker breaks the bails down. Pressure on!`;
            } else {
              runs += 1;
              commentary = `Quick single placed down to deep third-man to keep rotation active.`;
            }

            // Increase overs count
            const currOvers = parseFloat(match.timeRemaining);
            let nextOvers = parseFloat((currOvers + 0.1).toFixed(1));
            if (parseFloat((nextOvers % 1).toFixed(1)) >= 0.6) {
              nextOvers = Math.floor(nextOvers) + 1.0;
            }

            // End game check
            let status = match.status;
            if (nextOvers >= 20.0) {
              status = "COMPLETED";
              commentary = `Match completed successfully! What an action-packed performance.`;
            }

            // Shift odds slightly based on match state
            const oddsA = Math.max(1.10, +(match.oddsA + (Math.random() * 0.15 - 0.07)).toFixed(2));
            const oddsB = Math.max(1.10, +(match.oddsB + (Math.random() * 0.15 - 0.07)).toFixed(2));

            return {
              ...match,
              scoreA: `${runs}/${wickets}`,
              commentary,
              timeRemaining: `${nextOvers.toFixed(1)} Overs`,
              status,
              oddsA,
              oddsB
            };
          } else {
            // Football
            const dice = Math.random();
            let scoreA = match.scoreA as number;
            let scoreB = match.scoreB as number;
            let commentary = match.commentary;

            if (dice < 0.05) {
              scoreA += 1;
              commentary = `GOAL! Splendid diving header scores a monumental goal for ${match.teamA}!`;
            } else if (dice < 0.10) {
              scoreB += 1;
              commentary = `EQUALLER GOAL! Sensational teamwork leads to a beautiful low-drive bottom corner finish!`;
            }

            const currMin = parseInt(match.timeRemaining);
            let nextMinStr = `${currMin + 1}th Min`;
            let status = match.status;
            if (currMin >= 90) {
              status = "COMPLETED";
              commentary = `Referee blows the final whistle! Match has finished.`;
            }

            const oddsA = Math.max(1.05, +(match.oddsA + (Math.random() * 0.2 - 0.1)).toFixed(2));
            const oddsB = Math.max(1.05, +(match.oddsB + (Math.random() * 0.2 - 0.1)).toFixed(2));

            return {
              ...match,
              scoreA,
              scoreB,
              commentary,
              timeRemaining: nextMinStr,
              status,
              oddsA,
              oddsB
            };
          }
        })
      );
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Update activeMatch selection when fixtures change
  useEffect(() => {
    if (activeMatch) {
      const updated = fixtures.find((f) => f.id === activeMatch.id);
      if (updated) {
        setActiveMatch(updated);
      }
    } else if (fixtures.length > 0) {
      setActiveMatch(fixtures[0]);
    }
  }, [fixtures]);

  // Submit Sports Book Betting Bet Slip
  const submitSportsBet = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!user.isLoggedIn) {
      setFormMessage({ type: "error", text: "Please authenticate to place sports book bets." });
      return;
    }

    if (!betSelection || !activeMatch) {
      setFormMessage({ type: "error", text: "Please select an active match odds before putting stakes." });
      return;
    }

    if (user.balance < betAmount) {
      setFormMessage({ type: "error", text: "Insufficient balance credits! Quick deposit instantly." });
      return;
    }

    try {
      // Place bet through database endpoints
      const res = await fetch("/api/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user.phoneNumber,
          selection: `SportsBook:${activeMatch.teamA}vs${activeMatch.teamB}:${betSelection.name}`,
          amount: betAmount,
          multiplier: betSelection.odds,
          issue: `SP-${activeMatch.id}-${Date.now().toString().slice(-4)}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        const newBet: SportsBet = {
          id: data.bet.id,
          matchId: activeMatch.id,
          matchName: `${activeMatch.teamA} VS ${activeMatch.teamB}`,
          sport: activeMatch.sport,
          betType: betSelection.type,
          selection: betSelection.name,
          odds: betSelection.odds,
          amount: betAmount,
          status: "pending"
        };

        setBetSlips((prev) => [newBet, ...prev]);
        setFormMessage({ type: "success", text: `Your sports stake of ₹${betAmount} on ${betSelection.name} has been processed successfully!` });
        updateUserProfile(user.phoneNumber);

        // Schedule mock resolution after 12 seconds to provide amazing interactive loops
        setTimeout(async () => {
          setBetSlips((prevBets) => {
            return prevBets.map((b) => {
              if (b.id !== newBet.id || b.status !== "pending") return b;
              
              // 55% chance of winning for interactive dopamine boost
              const didWin = Math.random() < 0.55;
              if (didWin) {
                const payout = b.amount * b.odds;
                setNotification(`🎉 Match Stake WON! You secured ₹${payout.toFixed(2)} on match outcome!`);
                
                // Credit the user
                fetch("/api/transaction", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    phone: user.phoneNumber,
                    type: "deposit",
                    amount: payout,
                    channel: `Sports Bet win: ${b.selection}`
                  })
                }).then(() => updateUserProfile(user.phoneNumber));

                return { ...b, status: "won", winAmount: payout };
              } else {
                return { ...b, status: "lost" };
              }
            });
          });
        }, 15000);

      } else {
        const errData = await res.json();
        setFormMessage({ type: "error", text: errData.error || "Failed to process stake slip." });
      }
    } catch (err) {
      setFormMessage({ type: "error", text: "Network connection congestion. Retry." });
    }
  };

  const filteredFixtures = fixtures.filter((f) => {
    if (selectedSport === "all") return true;
    return f.sport === selectedSport;
  });

  return (
    <div className="bg-[#100e1a] rounded-3xl border border-amber-500/15 p-5 md:p-6 space-y-6 shadow-2xl overflow-hidden relative">
      
      {/* Dynamic Background decoratives */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Head line */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <span className="inline-flex items-center space-x-1 bg-green-500/10 text-emerald-400 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest">
            🟢 Virtual sports broker exchange
          </span>
          <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2 mt-1">
            🏏 Jalwa Sportsbook Live Betting
          </h2>
          <p className="text-xs text-zinc-400">Put backing chips on live cricket IPL runs & football odds. Instant resolutions!</p>
        </div>

        {/* Quick Sports Selector */}
        <div className="flex space-x-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-900 w-full sm:w-auto">
          {[
            { id: "all", label: "All sports" },
            { id: "cricket", label: "Cricket" },
            { id: "football", label: "Football" }
          ].map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id as any)}
              className={`flex-1 sm:flex-none text-[11px] font-extrabold px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                selectedSport === sport.id 
                  ? "bg-amber-500 text-zinc-950 font-black" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {sport.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left column: Live commentary and interactive odds (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Active selected Match Live Board */}
          {activeMatch ? (
            <div className="bg-[#0b0914] border border-zinc-900 rounded-2xl p-4 md:p-5 relative overflow-hidden space-y-4">
              <div className="flex justify-between items-center bg-zinc-950/80 py-1.5 px-3 rounded-xl border border-zinc-900 text-[10px]">
                <span className="text-amber-400 font-extrabold uppercase tracking-widest">{activeMatch.league}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  {activeMatch.status} • {activeMatch.timeRemaining}
                </span>
              </div>

              {/* Match Head-to-Head display */}
              <div className="grid grid-cols-3 items-center text-center py-2">
                <div className="space-y-1">
                  <span className="text-sm font-black text-white block truncate">{activeMatch.teamA}</span>
                  <span className="text-xs font-mono font-black text-zinc-400">
                    {activeMatch.sport === "cricket" ? activeMatch.scoreA : activeMatch.scoreA}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <span className="text-xs text-zinc-650 font-black font-mono">VS</span>
                  <span className="text-[10px] bg-zinc-950/90 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-900 mt-1 block">Live Score</span>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-black text-white block truncate">{activeMatch.teamB}</span>
                  <span className="text-xs font-mono font-black text-zinc-400">
                    {activeMatch.sport === "cricket" ? activeMatch.scoreB : activeMatch.scoreB}
                  </span>
                </div>
              </div>

              {/* commentary and virtual simulation ticker */}
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 text-left relative min-h-[56px] flex items-center space-x-2.5">
                <Tv className="w-5 h-5 text-amber-500 animate-pulse flex-shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[9px] text-zinc-500 font-extrabold uppercase block tracking-wider leading-none">Commentary Broadcast</span>
                  <p className="text-[11px] text-zinc-300 font-medium leading-relaxed font-sans">{activeMatch.commentary}</p>
                </div>
              </div>

              {/* Place Stake odds selector buttons */}
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 font-black block uppercase tracking-wider">Select standard MATCH ODDS (Click to populate slip)</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setBetSelection({ type: "Match Winner", name: `${activeMatch.teamA} (Back)`, odds: activeMatch.oddsA })}
                    className={`py-3 px-3.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                      betSelection?.name === `${activeMatch.teamA} (Back)`
                        ? "bg-amber-500/10 border-amber-500"
                        : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Back {activeMatch.teamA.split(" ")[0]}</span>
                    <span className="text-base font-black text-zinc-100 font-mono mt-1">{activeMatch.oddsA}</span>
                  </button>

                  {activeMatch.oddsDraw && (
                    <button
                      onClick={() => setBetSelection({ type: "Match Winner", name: "Draw (Back)", odds: activeMatch.oddsDraw || 3.0 })}
                      className={`py-3 px-3.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                        betSelection?.name === "Draw (Back)"
                          ? "bg-amber-500/10 border-amber-500"
                          : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Back Draw</span>
                      <span className="text-base font-black text-zinc-100 font-mono mt-1">{activeMatch.oddsDraw}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setBetSelection({ type: "Match Winner", name: `${activeMatch.teamB} (Back)`, odds: activeMatch.oddsB })}
                    className={`py-3 px-3.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                      betSelection?.name === `${activeMatch.teamB} (Back)`
                        ? "bg-amber-500/10 border-amber-500"
                        : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Back {activeMatch.teamB.split(" ")[0]}</span>
                    <span className="text-base font-black text-zinc-100 font-mono mt-1">{activeMatch.oddsB}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#0b0914] p-8 text-center text-zinc-500 rounded-2xl border border-zinc-905">
              Loading sports book feed...
            </div>
          )}

          {/* List of other available fixtures */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Other popular game feeds</span>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {filteredFixtures.map((fix) => {
                const isActive = activeMatch?.id === fix.id;
                return (
                  <div
                    key={fix.id}
                    onClick={() => {
                      setActiveMatch(fix);
                      setBetSelection(null);
                      setFormMessage(null);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      isActive 
                        ? "bg-gradient-to-r from-zinc-950 to-[#121021] border-amber-500/30" 
                        : "bg-zinc-950/60 border-zinc-900/60 hover:border-zinc-800"
                    }`}
                  >
                    <div className="space-y-1 w-2/3">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 font-extrabold uppercase border border-zinc-800 text-zinc-500">{fix.sport}</span>
                        <span className="text-[9.5px] text-zinc-400 font-semibold truncate block max-w-[140px]">{fix.league}</span>
                      </div>
                      <span className="text-xs font-black text-zinc-200 block truncate">{fix.teamA} vs {fix.teamB}</span>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] font-mono font-black text-amber-400">{fix.oddsA} / {fix.oddsB}</span>
                      <span className="text-[9px] uppercase tracking-wider text-emerald-400 animate-pulse mt-0.5 font-bold">{fix.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right column: Bet Slip and placed bets history (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="bg-[#0b0914] p-4 md:p-5 rounded-2xl border border-zinc-900 space-y-4">
            <h3 className="text-xs font-black uppercase text-zinc-300 tracking-widest flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <TrendingUp className="w-4 h-4 text-amber-500" /> Stake Slip processing
            </h3>

            {/* active layout details to preview */}
            {betSelection ? (
              <form onSubmit={submitSportsBet} className="space-y-4">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-900 text-left space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 font-extrabold uppercase leading-none">{betSelection.type}</span>
                    <span className="text-xs font-mono font-black text-amber-400">{betSelection.odds}x Payout Odds</span>
                  </div>
                  <h4 className="text-xs font-black text-zinc-100">{betSelection.name}</h4>
                  <span className="text-[10px] text-zinc-500 font-medium block">Match: {activeMatch?.teamA.split(" ")[0]} vs {activeMatch?.teamB.split(" ")[0]}</span>
                </div>

                {/* Amount input controller */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-zinc-400 font-black block uppercase tracking-wider">Stake Amount (₹)</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[100, 500, 1000, 5000].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setBetAmount(v)}
                        className={`py-1.5 px-1 font-mono text-[10px] font-extrabold border rounded cursor-pointer transition-all ${
                          betAmount === v 
                            ? "bg-amber-500/10 border-amber-500 text-amber-300"
                            : "bg-zinc-950 border-zinc-900 text-zinc-500"
                        }`}
                      >
                        ₹{v}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="10"
                    required
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseInt(e.target.value) || 10)}
                    className="w-full bg-zinc-950 border border-zinc-900 py-2 px-3 rounded-xl text-xs font-bold font-mono text-white mt-1.5 text-center focus:border-amber-500 focus:outline-none"
                    placeholder="Enter custom bet stake"
                  />
                </div>

                <div className="bg-[#121021] py-2 px-3 rounded-lg border border-zinc-900 text-xs flex justify-between items-center">
                  <span className="text-zinc-500">Possible Win Payout</span>
                  <span className="text-emerald-400 font-black font-mono">₹{(betAmount * betSelection.odds).toFixed(2)}</span>
                </div>

                {formMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    formMessage.type === "success" 
                      ? "bg-emerald-950/30 border border-emerald-950 text-emerald-300 font-semibold" 
                      : "bg-red-950/30 border border-red-950 text-red-300"
                  }`}>
                    {formMessage.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{formMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-widest cursor-pointer text-center leading-none"
                >
                  PLACE SPORTS OUTCOME SLIP
                </button>
              </form>
            ) : (
              <div className="text-center py-8 text-xs text-zinc-550 border-2 border-dashed border-zinc-900/60 rounded-xl">
                📥 Select match outcome odds on the left to activate ticket slip.
              </div>
            )}
          </div>

          {/* Place bets list */}
          {betSlips.length > 0 && (
            <div className="bg-[#0b0914] p-4 rounded-2xl border border-zinc-900 text-left space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-2 flex justify-between items-center">
                  <span>My Active Sports Tickets ({filteredBetSlips.length})</span>
                  <span className="text-[9px] text-zinc-500 font-normal uppercase">
                    Total: {betSlips.length}
                  </span>
                </h3>

                {/* dynamic status and sport filter controls */}
                <div className="grid grid-cols-1 gap-2 bg-zinc-950/65 p-2.5 rounded-xl border border-zinc-900/80 mb-3 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 font-extrabold uppercase w-12 shrink-0">Status:</span>
                    <div className="flex flex-wrap gap-1">
                      {(["all", "pending", "won", "lost"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setTicketStatusFilter(st)}
                          className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase border transition-all cursor-pointer ${
                            ticketStatusFilter === st
                              ? "bg-amber-500 text-zinc-950 border-amber-500"
                              : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-zinc-900/60">
                    <span className="text-zinc-500 font-extrabold uppercase w-12 shrink-0">Sport:</span>
                    <div className="flex flex-wrap gap-1">
                      {(["all", "cricket", "football"] as const).map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => setTicketSportFilter(sp)}
                          className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase border transition-all cursor-pointer ${
                            ticketSportFilter === sp
                              ? "bg-amber-500 text-zinc-950 border-amber-500"
                              : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredBetSlips.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-zinc-550 italic bg-zinc-950/40 rounded-xl border border-dashed border-zinc-900/60 font-medium">
                    No tickets found matching current status/sport filter selection.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-[10px]">
                    {filteredBetSlips.map((slip) => (
                      <div key={slip.id} className="p-2 bg-zinc-950 rounded border border-zinc-900 flex justify-between items-center">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-500 px-1 rounded font-bold leading-none py-0.2">
                              {slip.sport || "cricket"}
                            </span>
                            <span className="text-zinc-200 block truncate font-bold max-w-[130px]">{slip.matchName}</span>
                          </div>
                          <span className="text-zinc-500 block">Stake: ₹{slip.amount} @ <strong>{slip.odds}x</strong> ({slip.selection})</span>
                        </div>

                        <div>
                          {slip.status === "pending" ? (
                            <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/10 rounded text-[9px] font-black animate-pulse">Running</span>
                          ) : slip.status === "won" ? (
                            <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black">Won +₹{slip.winAmount?.toFixed(2)}</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[9px] font-bold">Unlucky</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
