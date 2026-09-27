import { createContext, useContext } from 'react';

export const MemberContext = createContext(null);

// { backendEnabled, authReady, user, isAdmin, profile, progress, syncing, syncError, online, pendingSync,
//   saveProfile, saveProgress, clearPlan, signOut }
export const useMember = () => useContext(MemberContext);
