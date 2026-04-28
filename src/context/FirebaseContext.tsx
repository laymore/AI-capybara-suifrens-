import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  isAuthEnabled: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({ user: null, loading: true, isAuthEnabled: true });

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthEnabled, setIsAuthEnabled] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    // Auto sign-in anonymously for this demo if no user
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(err => {
        setLoading(false); // Stop loading even if auth fails to allow guest mode
        if (err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
          console.warn("Firebase Anonymous Auth is disabled. Continuing in Guest mode (Limited history features).");
          setIsAuthEnabled(false);
        } else {
          console.error("Anonymous Sign-in failed:", err);
        }
      });
    }

    return unsubscribe;
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading, isAuthEnabled }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);
