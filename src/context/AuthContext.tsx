import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  syncUserProfile,
  handleFirestoreError,
  OperationType 
} from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<UserProfile | null>;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile | null>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role || 'user',
          createdAt: data.createdAt
        } as UserProfile;
      }
      return null;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        // Sync user profile when authenticated
        let profile = await fetchProfile(fUser.uid);
        if (!profile) {
          // Fallback sync (if newly registered via Google or wasn't in db)
          const synced = await syncUserProfile(fUser);
          if (synced) {
            profile = {
              id: synced.id,
              email: synced.email,
              name: synced.name,
              role: synced.role || 'user',
              createdAt: synced.createdAt
            } as UserProfile;
          }
        }
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const synced = await syncUserProfile(result.user);
      if (synced) {
        const profile = {
          id: synced.id,
          email: synced.email,
          name: synced.name,
          role: synced.role || 'user',
          createdAt: synced.createdAt
        } as UserProfile;
        setUser(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Core Sign in with Google error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await fetchProfile(result.user.uid);
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      const synced = await syncUserProfile(result.user, name);
      if (synced) {
        const profile = {
          id: synced.id,
          email: synced.email,
          name: synced.name,
          role: synced.role || 'user',
          createdAt: synced.createdAt
        } as UserProfile;
        setUser(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Email registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (firebaseUser) {
      const profile = await fetchProfile(firebaseUser.uid);
      setUser(profile);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.email === 'joiasnaturaiss@gmail.com';

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      isAdmin,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      refreshUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
