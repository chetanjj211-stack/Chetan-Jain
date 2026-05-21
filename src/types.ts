export interface UserProfile {
  username: string;
  phoneNumber: string;
  balance: number;
  referralCode: string;
  isLoggedIn: boolean;
  vipLevel?: number;
  totalDeposits?: number;
}

export type GameDuration = '1m' | '3m' | '5m' | '10m';

export interface GameHistoryItem {
  issue: string;
  number: number;
  color: 'red' | 'green' | 'violet' | 'red-violet' | 'green-violet';
  size: 'big' | 'small';
  time: string;
}

export interface Bet {
  id: string;
  issue: string;
  duration: GameDuration;
  selection: string; // 'green', 'red', 'violet', 'big', 'small', or '0'-'9'
  amount: number;
  multiplier: number;
  winAmount?: number;
  status: 'pending' | 'won' | 'lost';
  timestamp: string;
}

export interface BankCard {
  cardholderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  channel?: string;
}
