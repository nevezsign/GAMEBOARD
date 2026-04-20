import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/constants';
import { calculateMMRChanges } from '../utils/mmr';

const useStore = create(
  persist(
    (set, get) => ({
      // ==================== SETTINGS ====================
      settings: {
        ranks: [
          { name: 'Bronze',      key: 'bronze',      min: 0,    max: 999,  color: '#cd7f32' },
          { name: 'Silver',      key: 'silver',      min: 1000, max: 1499, color: '#c0c0c0' },
          { name: 'Gold',        key: 'gold',         min: 1500, max: 1999, color: '#ffd700' },
          { name: 'Platinum',    key: 'platinum',     min: 2000, max: 2499, color: '#00cec9' },
          { name: 'Master',      key: 'master',       min: 2500, max: 2999, color: '#a855f7' },
          { name: 'GrandMaster', key: 'grandmaster',  min: 3000, max: 3499, color: '#ef4444' },
          { name: 'Challenger',  key: 'challenger',   min: 3500, max: 99999, color: '#f59e0b' },
        ],
        defaultMmr: 1000,
        kFactor: 32,
        raceBaseSpeed: 0.35,
      },

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      // ==================== PILOTS ====================
      pilots: [],

      addPilot: (pilot) => set((state) => ({
        pilots: [...state.pilots, {
          id: generateId(),
          name: pilot.name,
          teamId: pilot.teamId || null,
          speed: pilot.speed || 50,
          consistency: pilot.consistency || 50,
          aggressiveness: pilot.aggressiveness || 50,
          mmr: get().settings?.defaultMmr ?? 1000,
          points: 0,
          wins: 0,
          races: 0,
          history: [],
          createdAt: Date.now(),
        }],
      })),

      updatePilot: (id, data) => set((state) => ({
        pilots: state.pilots.map(p => p.id === id ? { ...p, ...data } : p),
      })),

      deletePilot: (id) => set((state) => ({
        pilots: state.pilots.filter(p => p.id !== id),
      })),

      getPilot: (id) => get().pilots.find(p => p.id === id),

      // ==================== TEAMS ====================
      teams: [],

      addTeam: (team) => set((state) => ({
        teams: [...state.teams, {
          id: generateId(),
          name: team.name,
          color: team.color || '#00d4ff',
          createdAt: Date.now(),
        }],
      })),

      updateTeam: (id, data) => set((state) => ({
        teams: state.teams.map(t => t.id === id ? { ...t, ...data } : t),
      })),

      deleteTeam: (id) => set((state) => ({
        teams: state.teams.filter(t => t.id !== id),
        pilots: state.pilots.map(p => p.teamId === id ? { ...p, teamId: null } : p),
      })),

      getTeam: (id) => get().teams.find(t => t.id === id),

      getTeamPilots: (teamId) => get().pilots.filter(p => p.teamId === teamId),

      getTeamStats: (teamId) => {
        const pilots = get().pilots.filter(p => p.teamId === teamId);
        return {
          totalPoints: pilots.reduce((s, p) => s + p.points, 0),
          totalWins: pilots.reduce((s, p) => s + p.wins, 0),
          totalRaces: pilots.reduce((s, p) => s + p.races, 0),
          avgMmr: pilots.length ? Math.round(pilots.reduce((s, p) => s + p.mmr, 0) / pilots.length) : 0,
          pilotCount: pilots.length,
        };
      },

      // ==================== MAPS ====================
      maps: [],

      addMap: (map) => set((state) => ({
        maps: [...state.maps, {
          id: generateId(),
          name: map.name || 'New Track',
          points: map.points || [],
          checkpoints: map.checkpoints || [],
          sectors: map.sectors || [],
          finishIndex: map.finishIndex || 0,
          laps: map.laps || 3,
          difficulty: map.difficulty || 'Medium',
          width: map.width || 800,
          height: map.height || 600,
          createdAt: Date.now(),
        }],
      })),

      updateMap: (id, data) => set((state) => ({
        maps: state.maps.map(m => m.id === id ? { ...m, ...data } : m),
      })),

      deleteMap: (id) => set((state) => ({
        maps: state.maps.filter(m => m.id !== id),
      })),

      // ==================== RACES ====================
      races: [],

      activeRace: null,
      raceResults: null,

      setActiveRace: (config) => set({ activeRace: config, raceResults: null }),
      setRaceResults: (results) => set({ raceResults: results }),

      saveRace: (raceData) => {
        const { results, mapId, laps, participants } = raceData;
        const raceId = generateId();
        const now = Date.now();

        // Calculate MMR changes
        const mmrInputs = results.map(r => ({
          pilotId: r.pilotId,
          mmr: get().pilots.find(p => p.id === r.pilotId)?.mmr || 1000,
          position: r.position,
        }));

        const kFactor = get().settings?.kFactor ?? 32;
        const mmrChanges = calculateMMRChanges(mmrInputs, kFactor);

        // Build race record
        const raceRecord = {
          id: raceId,
          mapId,
          laps,
          date: now,
          results: results.map(r => {
            const mc = mmrChanges.find(m => m.pilotId === r.pilotId);
            return {
              ...r,
              mmrBefore: mc.oldMmr,
              mmrAfter: mc.newMmr,
              mmrChange: mc.mmrChange,
            };
          }),
        };

        set((state) => {
          // Update pilots
          const updatedPilots = state.pilots.map(p => {
            const result = results.find(r => r.pilotId === p.id);
            const mc = mmrChanges.find(m => m.pilotId === p.id);
            if (!result || !mc) return p;

            const posPoints = Math.max(0, (results.length - result.position + 1) * 5);

            return {
              ...p,
              mmr: mc.newMmr,
              points: p.points + posPoints,
              wins: p.wins + (result.position === 1 ? 1 : 0),
              races: p.races + 1,
              history: [...p.history, {
                raceId,
                date: now,
                position: result.position,
                mmrChange: mc.mmrChange,
                totalTime: result.totalTime,
                bestLap: result.bestLap,
              }],
            };
          });

          return {
            pilots: updatedPilots,
            races: [raceRecord, ...state.races],
            raceResults: {
              raceId,
              results: raceRecord.results,
              mmrChanges,
            },
          };
        });

        return raceId;
      },

      // ==================== SELECTORS ====================
      getPilotsSortedByMMR: () => [...get().pilots].sort((a, b) => b.mmr - a.mmr),

      getConstructorRankings: () => {
        const { teams, pilots } = get();
        return teams.map(t => {
          const tp = pilots.filter(p => p.teamId === t.id);
          return {
            ...t,
            totalPoints: tp.reduce((s, p) => s + p.points, 0),
            totalWins: tp.reduce((s, p) => s + p.wins, 0),
            avgMmr: tp.length ? Math.round(tp.reduce((s, p) => s + p.mmr, 0) / tp.length) : 0,
            pilotCount: tp.length,
          };
        }).sort((a, b) => b.totalPoints - a.totalPoints);
      },

      getRecentRaces: (limit = 10) => get().races.slice(0, limit),

      resetAllData: () => {
        set({
          pilots: [],
          teams: [],
          maps: [],
          races: [],
          activeRace: null,
          raceResults: null,
          settings: {
            ranks: [
              { name: 'Bronze',      key: 'bronze',      min: 0,    max: 999,  color: '#cd7f32' },
              { name: 'Silver',      key: 'silver',      min: 1000, max: 1499, color: '#c0c0c0' },
              { name: 'Gold',        key: 'gold',         min: 1500, max: 1999, color: '#ffd700' },
              { name: 'Platinum',    key: 'platinum',     min: 2000, max: 2499, color: '#00cec9' },
              { name: 'Master',      key: 'master',       min: 2500, max: 2999, color: '#a855f7' },
              { name: 'GrandMaster', key: 'grandmaster',  min: 3000, max: 3499, color: '#ef4444' },
              { name: 'Challenger',  key: 'challenger',   min: 3500, max: 99999, color: '#f59e0b' },
            ],
            defaultMmr: 1000,
            kFactor: 32,
            raceBaseSpeed: 0.35,
          }
        });
      },
    }),
    {
      name: 'apex-rivals-storage',
    }
  )
);

export default useStore;
