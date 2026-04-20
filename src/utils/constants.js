/* Rank definitions and helper constants */

export const RANKS = [
  { name: 'Bronze',       key: 'bronze',       min: 0,    max: 999,       color: '#cd7f32', icon: '🥉' },
  { name: 'Silver',       key: 'silver',       min: 1000, max: 1499,      color: '#c0c0c0', icon: '⬜' },
  { name: 'Gold',         key: 'gold',         min: 1500, max: 1999,      color: '#ffd700', icon: '🥇' },
  { name: 'Platinum',     key: 'platinum',     min: 2000, max: 2499,      color: '#00cec9', icon: '💎' },
  { name: 'Master',       key: 'master',       min: 2500, max: 2999,      color: '#a855f7', icon: '👑' },
  { name: 'GrandMaster',  key: 'grandmaster',  min: 3000, max: 3499,      color: '#ef4444', icon: '🔥' },
  { name: 'Challenger',   key: 'challenger',   min: 3500, max: Infinity,  color: '#f59e0b', icon: '⭐' },
];

export function getRank(mmr, customRanks) {
  const rankList = customRanks || RANKS;
  for (const rank of rankList) {
    if (mmr >= rank.min && mmr <= rank.max) {
      return { ...rank, key: rank.key || rank.name.toLowerCase().replace(/\s+/g, '') };
    }
  }
  return { ...rankList[0], key: rankList[0].key || rankList[0].name.toLowerCase() };
}

export const TEAM_COLORS = [
  '#00d4ff', '#ef4444', '#22c55e', '#f59e0b', '#a855f7',
  '#ec4899', '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6',
  '#e11d48', '#84cc16', '#6366f1', '#0ea5e9', '#d946ef',
];

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
}

export function formatGap(gap) {
  if (gap === 0) return 'LEADER';
  return `+${gap.toFixed(2)}s`;
}
