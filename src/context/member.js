import { createContext, useContext } from 'react';

export const MemberContext = createContext(null);

// { backendEnabled, authReady, user, profile, progress, syncing, syncError,
//   saveProfile, saveProgress, clearPlan, signOut }
export const useMember = () => useContext(MemberContext);
