import asyncio
import random
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="JW Club Vegas Server", description="FastAPI High-Performance Replica")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory states matching server.ts exactly
game_modes: Dict[str, Dict[str, Any]] = {
    "1m": {"issueNumber": "", "timeLeft": 60, "history": []},
    "3m": {"issueNumber": "", "timeLeft": 180, "history": []},
    "5m": {"issueNumber": "", "timeLeft": 300, "history": []},
    "10m": {"issueNumber": "", "timeLeft": 600, "history": []},
}

# Helpers
def get_formatted_issue_number(offset_minutes: int = 0) -> str:
    now = datetime.now()
    if offset_minutes != 0:
        now = datetime.fromtimestamp(now.timestamp() + offset_minutes * 60)
    year = now.strftime("%Y")
    month = now.strftime("%m")
    day = now.strftime("%d")
    
    # Calculate index of minute in the day (1440 mins total)
    total_minutes = now.hour * 60 + now.minute
    index_str = str(total_minutes + 1).zfill(4)
    return f"{year}{month}{day}{index_str}"

def generate_initial_history(count: int, key_suffix: str = "") -> List[Dict[str, Any]]:
    result = []
    now = time.time()
    for i in range(count):
        min_offset = -i - 1
        issue_num = get_formatted_issue_number(min_offset) + key_suffix
        num = random.randint(0, 9)
        
        if num == 0:
            color = "red-violet"
        elif num == 5:
            color = "green-violet"
        elif num % 2 == 0:
            color = "red"
        else:
            color = "green"
            
        size = "big" if num >= 5 else "small"
        time_str = datetime.fromtimestamp(now + min_offset * 60).strftime("%I:%M %p")
        
        result.append({
            "issue": issue_num,
            "number": num,
            "color": color,
            "size": size,
            "time": time_str
        })
    return result

# Seeding history
game_modes["1m"]["issueNumber"] = get_formatted_issue_number()
game_modes["1m"]["history"] = generate_initial_history(30)

game_modes["3m"]["issueNumber"] = get_formatted_issue_number() + "X"
game_modes["3m"]["history"] = generate_initial_history(30, "X")

game_modes["5m"]["issueNumber"] = get_formatted_issue_number()
game_modes["5m"]["history"] = generate_initial_history(30)

game_modes["10m"]["issueNumber"] = get_formatted_issue_number()
game_modes["10m"]["history"] = generate_initial_history(30)


# VIP Utility calculations
def get_vip_level(transactions: List[Dict[str, Any]]) -> int:
    if not transactions:
        return 1
    deposits = [t for t in transactions if t.get("type") == "deposit" and t.get("status") == "success" and t.get("id") != "BONUS50"]
    total_deposited = sum(t.get("amount", 0) for t in deposits)
    
    if total_deposited >= 500000: return 7
    if total_deposited >= 100000: return 6
    if total_deposited >= 20000: return 5
    if total_deposited >= 5000: return 4
    if total_deposited >= 1000: return 3
    if total_deposited >= 100: return 2
    return 1

def get_total_deposits(transactions: List[Dict[str, Any]]) -> float:
    if not transactions:
        return 0.0
    deposits = [t for t in transactions if t.get("type") == "deposit" and t.get("status") == "success" and t.get("id") != "BONUS50"]
    return sum(t.get("amount", 0.0) for t in deposits)


# In-memory session db (corresponds to userSessions)
user_sessions: Dict[str, Dict[str, Any]] = {
    "9876543210": {
        "phoneNumber": "9876543210",
        "username": "JackwarLucky7",
        "password": "password123",
        "balance": 50000.00,
        "referralCode": "JWCLUB119",
        "bankCard": {
            "cardholderName": "CHETAN SINGH",
            "bankName": "State Bank of India",
            "accountNumber": "XXXXXXXX4921",
            "ifscCode": "SBIN0001827"
        },
        "transactions": [
            {"id": "TXN1002", "type": "deposit", "amount": 50000.0, "status": "success", "timestamp": "05/21/2026, 12:00:00 PM"},
            {"id": "TXN1001", "type": "deposit", "amount": 1000.0, "status": "success", "timestamp": "05/21/2026, 02:00:00 AM"}
        ],
        "bets": []
    }
}


# Background Async Tick Loop (matches setInterval in node)
async def game_tick_loop():
    while True:
        try:
            now = datetime.now()
            current_sec = now.second
            current_min = now.minute

            # --- 1m Mode ---
            m1 = game_modes["1m"]
            m1["timeLeft"] = 60 - current_sec
            if m1["timeLeft"] <= 0 or m1["issueNumber"] != get_formatted_issue_number():
                # End round, roll new prediction
                new_num = random.randint(0, 9)
                if new_num == 0:
                    new_col = "red-violet"
                elif new_num == 5:
                    new_col = "green-violet"
                elif new_num % 2 == 0:
                    new_col = "red"
                else:
                    new_col = "green"
                
                new_size = "big" if new_num >= 5 else "small"
                new_time = now.strftime("%I:%M %p")

                # Push history
                m1["history"].insert(0, {
                    "issue": m1["issueNumber"],
                    "number": new_num,
                    "color": new_col,
                    "size": new_size,
                    "time": new_time
                })
                if len(m1["history"]) > 100:
                    m1["history"].pop()

                # Process bets for 1m
                for phone, user in user_sessions.items():
                    for b in user.get("bets", []):
                        if b.get("duration") == "1m" and b.get("issue") == m1["issueNumber"] and b.get("status") == "pending":
                            selection = b.get("selection")
                            won = False
                            mult = b.get("multiplier", 1)

                            if selection == "green" and new_col in ["green", "green-violet"]:
                                won = True
                            elif selection == "red" and new_col in ["red", "red-violet"]:
                                won = True
                            elif selection == "violet" and new_col in ["red-violet", "green-violet"]:
                                won = True
                            elif selection == "big" and new_size == "big":
                                won = True
                            elif selection == "small" and new_size == "small":
                                won = True
                            elif selection == str(new_num):
                                won = True

                            if won:
                                b["status"] = "won"
                                b["winAmount"] = b["amount"] * mult
                                user["balance"] += b["winAmount"]
                            else:
                                b["status"] = "lost"
                                b["winAmount"] = 0.0

                m1["issueNumber"] = get_formatted_issue_number()

            # --- 3m Mode ---
            m3 = game_modes["3m"]
            m3_left = 180 - ((current_min % 3) * 60 + current_sec)
            m3["timeLeft"] = 180 if m3_left <= 0 else m3_left
            if m3_left <= 0:
                new_num = random.randint(0, 9)
                if new_num == 0:
                    new_col = "red-violet"
                elif new_num == 5:
                    new_col = "green-violet"
                elif new_num % 2 == 0:
                    new_col = "red"
                else:
                    new_col = "green"
                
                new_size = "big" if new_num >= 5 else "small"
                new_time = now.strftime("%I:%M %p")

                m3["history"].insert(0, {
                    "issue": m3["issueNumber"],
                    "number": new_num,
                    "color": new_col,
                    "size": new_size,
                    "time": new_time
                })
                if len(m3["history"]) > 100:
                    m3["history"].pop()

                # Process bets for 3m
                for phone, user in user_sessions.items():
                    for b in user.get("bets", []):
                        if b.get("duration") == "3m" and b.get("issue") == m3["issueNumber"] and b.get("status") == "pending":
                            selection = b.get("selection")
                            won = False
                            mult = b.get("multiplier", 1)

                            if selection == "green" and new_col in ["green", "green-violet"]: won = True
                            elif selection == "red" and new_col in ["red", "red-violet"]: won = True
                            elif selection == "violet" and new_col in ["red-violet", "green-violet"]: won = True
                            elif selection == "big" and new_size == "big": won = True
                            elif selection == "small" and new_size == "small": won = True
                            elif selection == str(new_num): won = True

                            if won:
                                b["status"] = "won"
                                b["winAmount"] = b["amount"] * mult
                                user["balance"] += b["winAmount"]
                            else:
                                b["status"] = "lost"
                                b["winAmount"] = 0.0

                m3["issueNumber"] = get_formatted_issue_number() + "X"

        except Exception as e:
            print("Error in background ticking thread:", e)
        
        await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    # Start loop in background
    asyncio.create_task(game_tick_loop())


# --- API Models ---
class LoginRequest(BaseModel):
    phoneNumber: str
    password: str

class BetRequest(BaseModel):
    phone: str
    duration: Optional[str] = "1m"
    selection: str
    amount: float
    multiplier: Optional[float] = 1.0
    issue: Optional[str] = None

class AviatorBetRequest(BaseModel):
    phone: str
    amount: float

class AviatorClaimRequest(BaseModel):
    phone: str
    betId: str
    multiplier: float

class DropPlinkoRequest(BaseModel):
    phone: str
    amount: float
    targetMultiplier: float

class MinesStartRequest(BaseModel):
    phone: str
    amount: float

class MinesClaimRequest(BaseModel):
    phone: str
    betId: str
    multiplier: float
    hitBomb: bool

class SlotSpinRequest(BaseModel):
    phone: str
    amount: float
    multiplier: Optional[float] = 1.0

class DragonTigerRequest(BaseModel):
    phone: str
    amount: float
    selection: str # "dragon" or "tiger" or "tie"

class RouletteRequest(BaseModel):
    phone: str
    amount: float
    selection: str # "red" / "black" / "even" / "odd" / "0"-"36"

class FishingShootRequest(BaseModel):
    phone: str
    amount: float
    fishMultiplier: float
    fishName: str

class TransactionRequest(BaseModel):
    phone: str
    type: str # "deposit" or "withdrawal"
    amount: float
    channel: Optional[str] = "UPI Instant"
    bankDetails: Optional[Dict[str, Any]] = None

class ProfileUpdateRequest(BaseModel):
    phone: str
    username: str


# --- Endpoints ---
@app.get("/api/game-state/{duration}")
def get_game_state(duration: str):
    if duration in game_modes:
        return game_modes[duration]
    raise HTTPException(status_code=404, detail="Invalid duration mode")

@app.post("/api/login")
def login(req: LoginRequest):
    phone = req.phoneNumber
    password = req.password

    if not phone or len(phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit handset number")
    
    if not password or len(password.strip()) == 0:
        raise HTTPException(status_code=400, detail="Please enter your password")

    if phone not in user_sessions:
        # Register new player starting with 0.00 Rs.
        # "jo jitna deposit karega utna hi uska balance hoga" - registers with 0 balance
        user_sessions[phone] = {
            "phoneNumber": phone,
            "username": f"JWPlayer_{phone[-4:]}",
            "password": password,
            "balance": 0.00,
            "referralCode": f"JWCLUB{random.randint(100, 999)}",
            "transactions": [],
            "bets": []
        }
    else:
        if user_sessions[phone].get("password") != password:
            raise HTTPException(status_code=401, detail="Incorrect password. Please verify your phone number and password.")

    user = user_sessions[phone]
    vip = get_vip_level(user["transactions"])
    total_dep = get_total_deposits(user["transactions"])

    return {
        "phoneNumber": phone,
        "username": user["username"],
        "balance": user["balance"],
        "referralCode": user["referralCode"],
        "vipLevel": vip,
        "totalDeposits": total_dep
    }

@app.get("/api/profile/{phone}")
def get_profile(phone: str):
    if phone in user_sessions:
        user = user_sessions[phone]
        vip = get_vip_level(user["transactions"])
        total_dep = get_total_deposits(user["transactions"])
        return {
            "phoneNumber": user["phoneNumber"],
            "username": user["username"],
            "balance": user["balance"],
            "referralCode": user["referralCode"],
            "bankCard": user.get("bankCard"),
            "transactions": user["transactions"],
            "bets": user["bets"],
            "vipLevel": vip,
            "totalDeposits": total_dep
        }
    raise HTTPException(status_code=404, detail="Session expired or user not found")

@app.post("/api/bet")
def place_bet(req: BetRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized session")
    
    user = user_sessions[phone]
    if user["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance. Please deposit/recharge.")

    user["balance"] -= req.amount
    bet_id = f"JW-{random.randint(100000, 999999)}"
    new_bet = {
        "id": bet_id,
        "issue": req.issue or get_formatted_issue_number(),
        "duration": req.duration or "1m",
        "selection": req.selection,
        "amount": req.amount,
        "multiplier": req.multiplier or 1.0,
        "status": "pending",
        "timestamp": datetime.now().strftime("%I:%M:%S %p")
    }
    user["bets"].insert(0, new_bet)
    return {"success": True, "balance": user["balance"], "bet": new_bet}

# Spribe Aviator Flight Placement
@app.post("/api/games/aviator/bet")
def aviator_bet(req: AviatorBetRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    user = user_sessions[phone]
    if user["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    user["balance"] -= req.amount
    bet_id = f"AV-{random.randint(100000, 999999)}"
    new_bet = {
        "id": bet_id,
        "issue": "Aviator Live Flight",
        "duration": "Instant",
        "selection": "Aviator Flight",
        "amount": req.amount,
        "multiplier": 1.0,
        "status": "pending",
        "timestamp": datetime.now().strftime("%I:%M:%S %p")
    }
    user["bets"].insert(0, new_bet)
    return {"success": True, "balance": user["balance"], "betId": bet_id}

@app.post("/api/games/aviator/claim")
def aviator_claim(req: AviatorClaimRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    user = user_sessions[phone]
    target_bet = None
    for b in user["bets"]:
        if b["id"] == req.betId:
            target_bet = b
            break
            
    if not target_bet or target_bet["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invalid flight session")

    win_amount = target_bet["amount"] * req.multiplier
    target_bet["status"] = "won"
    target_bet["multiplier"] = req.multiplier
    target_bet["winAmount"] = win_amount
    user["balance"] += win_amount

    return {"success": True, "balance": user["balance"], "winAmount": win_amount}

# Jili Slots
@app.post("/api/games/slot/spin")
def slot_spin(req: SlotSpinRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    user = user_sessions[phone]
    if user["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    user["balance"] -= req.amount
    
    roll = random.random()
    payout_multiplier = 0.0
    status = "lost"
    
    if roll > 0.95:
        payout_multiplier = 20.0
        status = "won"
    elif roll > 0.82:
        payout_multiplier = 5.0
        status = "won"
    elif roll > 0.55:
        payout_multiplier = 2.0
        status = "won"
    elif roll > 0.38:
        payout_multiplier = 0.5
        status = "won"

    win = req.amount * payout_multiplier
    user["balance"] += win

    new_bet = {
        "id": f"JL-{random.randint(100000, 999999)}",
        "issue": "Jili Fortune Slot",
        "duration": "Instant",
        "selection": "Slot Reel",
        "amount": req.amount,
        "multiplier": payout_multiplier,
        "winAmount": win,
        "status": status,
        "timestamp": datetime.now().strftime("%I:%M:%S %p")
    }
    user["bets"].insert(0, new_bet)
    return {"success": True, "balance": user["balance"], "multiplier": payout_multiplier, "winAmount": win}

# Plinko
@app.post("/api/games/plinko/drop")
def plinko_drop(req: DropPlinkoRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user = user_sessions[phone]
    if user["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    user["balance"] -= req.amount
    win = req.amount * req.targetMultiplier
    user["balance"] += win

    new_bet = {
        "id": f"BG-{random.randint(100000, 999999)}",
        "issue": "Plinko Drop Arena",
        "duration": "Instant",
        "selection": f"Bucket {req.targetMultiplier}x",
        "amount": req.amount,
        "multiplier": req.targetMultiplier,
        "winAmount": win,
        "status": "won" if req.targetMultiplier >= 1.0 else "lost",
        "timestamp": datetime.now().strftime("%I:%M:%S %p")
    }
    user["bets"].insert(0, new_bet)
    return {"success": True, "balance": user["balance"], "winAmount": win}

# Mines
@app.post("/api/games/mines/start")
def mines_start(req: MinesStartRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user = user_sessions[phone]
    if user["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    user["balance"] -= req.amount
    bet_id = f"MN-{random.randint(100000, 999999)}"
    new_bet = {
        "id": bet_id,
        "issue": "InOut Mines Grid",
        "duration": "Instant",
        "selection": "Mines Field",
        "amount": req.amount,
        "multiplier": 1.0,
        "status": "pending",
        "timestamp": datetime.now().strftime("%I:%M:%S %p")
    }
    user["bets"].insert(0, new_bet)
    return {"success": True, "balance": user["balance"], "betId": bet_id}

@app.post("/api/games/mines/claim")
def mines_claim(req: MinesClaimRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user = user_sessions[phone]
    target_bet = None
    for b in user["bets"]:
        if b["id"] == req.betId:
            target_bet = b
            break

    if not target_bet or target_bet["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invalid Mines session")

    if req.hitBomb:
        target_bet["status"] = "lost"
        target_bet["multiplier"] = 0.0
        target_bet["winAmount"] = 0.0
        return {"success": True, "balance": user["balance"], "winAmount": 0.0}

    win = target_bet["amount"] * req.multiplier
    target_bet["status"] = "won"
    target_bet["multiplier"] = req.multiplier
    target_bet["winAmount"] = win
    user["balance"] += win

    return {"success": True, "balance": user["balance"], "winAmount": win}

# Dragon Tiger Cards
@app.post("/api/games/dragontiger/play")
def play_dragon_tiger(req: DragonTigerRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user = user_sessions[phone]
    if user["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    user["balance"] -= req.amount

    dragon_card = random.randint(1, 13)
    tiger_card = random.randint(1, 13)
    suits = ["♠", "♥", "♦", "♣"]
    dragon_suit = random.choice(suits)
    tiger_suit = random.choice(suits)

    if dragon_card > tiger_card:
        outcome = "dragon"
    elif tiger_card > dragon_card:
        outcome = "tiger"
    else:
        outcome = "tie"

    multiplier = 0.0
    if req.selection == outcome:
        multiplier = 9.0 if outcome == "tie" else 2.0
    elif outcome == "tie" and req.selection in ["dragon", "tiger"]:
        multiplier = 0.5 # Give back half stack upon ties

    win = req.amount * multiplier
    user["balance"] += win

    new_bet = {
        "id": f"DT-{random.randint(100000, 999999)}",
        "issue": "Dragon Tiger PVC",
        "duration": "Instant",
        "selection": req.selection.upper(),
        "amount": req.amount,
        "multiplier": multiplier,
        "winAmount": win,
        "status": "won" if win > 0 else "lost",
        "timestamp": datetime.now().strftime("%I:%M:%S %p")
    }
    user["bets"].insert(0, new_bet)

    return {
        "success": True,
        "balance": user["balance"],
        "dragonCard": dragon_card,
        "dragonSuit": dragon_suit,
        "tigerCard": tiger_card,
        "tigerSuit": tiger_suit,
        "outcome": outcome,
        "winAmount": win,
        "multiplier": multiplier
    }

# Roulette Wheel
@app.post("/api/games/roulette/spin")
def roulette_spin(req: RouletteRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user = user_sessions[phone]
    if user["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    user["balance"] -= req.amount

    winning_number = random.randint(0, 36)
    reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
    is_red = winning_number in reds
    
    if winning_number == 0:
        color_outcome = "green"
    elif is_red:
        color_outcome = "red"
    else:
        color_outcome = "black"

    is_even = (winning_number != 0) and (winning_number % 2 == 0)
    is_odd = winning_number % 2 != 0

    multiplier = 0.0
    if req.selection == "red" and color_outcome == "red": multiplier = 2.0
    elif req.selection == "black" and color_outcome == "black": multiplier = 2.0
    elif req.selection == "even" and is_even: multiplier = 2.0
    elif req.selection == "odd" and is_odd: multiplier = 2.0
    elif req.selection == str(winning_number): multiplier = 36.0

    win = req.amount * multiplier
    user["balance"] += win

    new_bet = {
        "id": f"RL-{random.randint(100000, 999999)}",
        "issue": "Vegas Royal Roulette",
        "duration": "Instant",
        "selection": req.selection.upper(),
        "amount": req.amount,
        "multiplier": multiplier,
        "winAmount": win,
        "status": "won" if win > 0.0 else "lost",
        "timestamp": datetime.now().strftime("%I:%M:%S %p")
    }
    user["bets"].insert(0, new_bet)

    return {
        "success": True,
        "balance": user["balance"],
        "winningNumber": winning_number,
        "colorOutcome": color_outcome,
        "winAmount": win,
        "multiplier": multiplier
    }

# Fishing Hunter
@app.post("/api/games/fishing/shoot")
def fishing_shoot(req: FishingShootRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")

    user = user_sessions[phone]
    if user["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Needs reload")

    user["balance"] -= req.amount

    # Hit capture probability scales down for high-tier fish
    capture_probability = min(0.9, 0.72 / req.fishMultiplier)
    is_captured = random.random() < capture_probability

    win = 0.0
    multiplier = 0.0
    if is_captured:
        multiplier = req.fishMultiplier
        win = req.amount * multiplier
        user["balance"] += win

    if win >= req.amount * 2:
        new_bet = {
            "id": f"FS-{random.randint(100000, 999999)}",
            "issue": f"Catch {req.fishName}",
            "duration": "Instant",
            "selection": f"{req.fishName} {req.fishMultiplier}x",
            "amount": req.amount,
            "multiplier": multiplier,
            "winAmount": win,
            "status": "won",
            "timestamp": datetime.now().strftime("%I:%M:%S %p")
        }
        user["bets"].insert(0, new_bet)

    return {
        "success": True,
        "balance": user["balance"],
        "isCaptured": is_captured,
        "winAmount": win
    }

# Transaction Channels
@app.post("/api/transaction")
def make_transaction(req: TransactionRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized session")

    user = user_sessions[phone]
    amt = req.amount

    if req.type == "withdrawal":
        deposits = [t for t in user["transactions"] if t.get("type") == "deposit" and t.get("status") == "success" and t.get("id") != "BONUS50"]
        total_deposited = sum(t.get("amount", 0.0) for t in deposits)
        
        if total_deposited < 100.0:
            raise HTTPException(
                status_code=400, 
                detail=f"To unlock withdrawals, you must first complete a minimum deposit of ₹100. Your current total deposit is ₹{total_deposited}. Please deposit ₹100 or more using the UPI/Scanner."
            )
            
        if user["balance"] < amt:
            raise HTTPException(status_code=400, detail="Insufficient balance for withdrawal")
        user["balance"] -= amt
    else:
        user["balance"] += amt

    if req.bankDetails:
        user["bankCard"] = req.bankDetails

    new_txn = {
        "id": f"TXN{random.randint(1000, 9999)}",
        "type": req.type,
        "amount": amt,
        "status": "success",
        "channel": req.channel or "UPI Instant",
        "timestamp": datetime.now().strftime("%m/%d/%Y, %I:%M:%S %p")
    }
    user["transactions"].insert(0, new_txn)

    return {"success": True, "balance": user["balance"], "transaction": new_txn}

@app.post("/api/profile/update")
def update_profile(req: ProfileUpdateRequest):
    phone = req.phone
    if phone not in user_sessions:
        raise HTTPException(status_code=403, detail="Unauthorized")
    user_sessions[phone]["username"] = req.username
    return {"success": True, "username": req.username}

# Spin up FastAPI server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
