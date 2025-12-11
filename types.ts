export interface Player {
  name: string;
  previous: number;
  current: number;
  weeklyTotal: number;
  accumulatedExcess: number; // The "Bank"
  total: number; // Lifetime tracked donation
  lastSeen: number;
  absent: boolean;
  isNew: boolean;
}

export interface AppData {
  players: Record<string, Player>;
  goalDaily: number;
  lastUpdate: number;
  weekStart: number;
}

export interface CalculatedStats {
  semanal: number;
  avgDaily: number;
  avgDailyPerc: number;
  metaPerc: number;
  totalPerc: number;
  weeklyGoal: number;
  deficitDraw: number;
  finalPotentialExcess: number;
}
