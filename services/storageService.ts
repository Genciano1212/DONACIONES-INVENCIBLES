import { AppData, Player } from '../types';
import { CONFIG } from '../constants';

const getWeekStart = (): number => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday.getTime();
};

const DEFAULT_DATA: AppData = {
  players: {},
  goalDaily: CONFIG.DEFAULT_GOAL,
  lastUpdate: Date.now(),
  weekStart: getWeekStart(),
};

export const loadData = (): AppData => {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const data = JSON.parse(raw) as AppData;
    // Ensure structure integrity
    return {
      ...DEFAULT_DATA,
      ...data,
      players: data.players || {}
    };
  } catch (e) {
    console.error("Failed to load data", e);
    return DEFAULT_DATA;
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

export const exportDataToJson = (data: AppData) => {
  const dataToExport = {
    ...data,
    exportDate: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pocket_ants_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
