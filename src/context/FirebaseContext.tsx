import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({ user: null, loading: true });

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    // Auto sign-in anonymously for this demo if no user
    if (!auth.currentUser) {
      signInAnonymously(auth).catch(err => {
        if (err.code === 'auth/admin-restricted-operation') {
          console.error("Firebase Anonymous Auth is disabled. Please enable it in the Firebase Console (Authentication > Sign-in method).");
        } else {
          console.error("Anonymous Sign-in failed:", err);
        }
      });
    }

    return unsubscribe;
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);
