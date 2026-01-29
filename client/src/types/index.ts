// Tipos compartidos para la aplicación

export interface Match {
  id: number;
  external_id: string;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  match_time: string;
  status: 'SCHEDULED' | 'FINISHED' | 'LIVE';
  home_score: number | null;
  away_score: number | null;
}

export interface Prediction {
  id: number;
  match_id: number;
  market: string;
  odds: number;
  probability: number;
  stake: number;
  confidence_level: string;
  prediction_type: string | null;
  home_odds: number | null;
  draw_odds: number | null;
  away_odds: number | null;
  source: string;
  scraped_at: string;
  match?: Match;
}

export interface Bet {
  id: number;
  prediction_id: number | null;
  match_id: number | null;
  amount: number;
  odds_taken: number;
  market: string;
  selection: string | null;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  profit_loss: number;
  bookmaker: string | null;
  notes: string | null;
  placed_at: string;
  settled_at: string | null;
  match?: Match;
  prediction?: Prediction;
}

export interface DashboardStats {
  general: {
    totalBets: number;
    wonBets: number;
    lostBets: number;
    pendingBets: number;
    totalStaked: number;
    totalProfitLoss: number;
    winRate: number;
    roi: number;
    averageOdd: number;
  };
  byStake: {
    stake: number;
    betCount: number;
    won: number;
    lost: number;
    totalStaked: number;
    profitLoss: number;
  }[];
  recentBets: Bet[];
  dailyStats: {
    date: string;
    betCount: number;
    staked: number;
    profitLoss: number;
  }[];
}

export interface League {
  league: string;
  prediction_count: number;
}

export interface FilterState {
  minStake: number;
  maxStake: number;
  league: string;
  market: string;
  dateFrom: string;
  dateTo: string;
}
