// Live Agent Store Core
import { create } from 'zustand';

interface Activity {
  id: string;
  agent: string;
  message: string;
  timestamp: Date;
  incidentId?: string;
  type?: string;
}

interface AgentState {
  activities: Activity[];
  addActivity: (agent: string, message: string, incidentId?: string, type?: string) => void;
  clear: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  activities: [],
  addActivity: (agent, message, incidentId, type = 'agent') => set((state) => ({
    activities: [
      { id: Math.random().toString(36), agent, message, timestamp: new Date(), incidentId, type },
      ...state.activities
    ].slice(0, 100) // Expanded buffer for deep audit
  })),
  clear: () => set({ activities: [] }),
}));
