import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfileSchema } from './types';
import { getAuth } from 'firebase/auth';

const defaultProfile: UserProfileSchema = {
  income: 0,
  expenses: 0,
  loans: [],
  assets: {
    stocks: [],
    gold: 0
  },
  subscriptions: 0,
  goals: [],
  riskProfile: "MODERATE",
  history: [],
  lastUpdated: Date.now()
};

export async function fetchUserProfile(userId: string): Promise<UserProfileSchema> {
  try {
    const docRef = doc(db, 'users', userId, 'profile', 'current');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfileSchema;
      // Ensure complex nested structures are initialized to avoid undefined errors
      return {
        ...defaultProfile,
        ...data,
        assets: {
          stocks: data.assets?.stocks || [],
          gold: data.assets?.gold || 0,
        },
        loans: data.loans || [],
        goals: data.goals || [],
        history: data.history || []
      };
    }
  } catch (err: any) {
    console.error("Error fetching user profile:", err.message);
  }
  return { ...defaultProfile };
}

export async function saveUserProfile(userId: string, profile: UserProfileSchema): Promise<void> {
  try {
    const auth = getAuth();
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      throw new Error(JSON.stringify({
        error: "Missing or insufficient permissions.",
        operationType: "write",
        path: `users/${userId}/profile/current`,
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email
        }
      }));
    }

    const docRef = doc(db, 'users', userId, 'profile', 'current');
    // We snapshot the change.
    // Limit history memory payload to 5 elements to save on space
    const profileToSave = { ...profile };
    // Create stripped snapshot
    const snapshot = {
      income: profileToSave.income,
      expenses: profileToSave.expenses,
      loans: [...profileToSave.loans],
      assets: { ...profileToSave.assets }
    };
    
    profileToSave.history = [...(profileToSave.history || [])];
    profileToSave.history.push({ snapshot, timestamp: Date.now() });

    if (profileToSave.history.length > 20) {
      profileToSave.history = profileToSave.history.slice(profileToSave.history.length - 20);
    }
    
    profileToSave.lastUpdated = Date.now();
    await setDoc(docRef, profileToSave, { merge: true });
  } catch (error: any) {
    if (error.message && error.message.includes("Missing or insufficient permissions")) {
      const errInfo = {
         error: error.message,
         operationType: 'write',
         path: `users/${userId}/profile/current`,
         authInfo: { userId: getAuth().currentUser?.uid }
      };
      console.error('Firestore Error: ', JSON.stringify(errInfo));
      throw new Error(JSON.stringify(errInfo));
    }
    console.error("Error saving user profile:", error);
  }
}
