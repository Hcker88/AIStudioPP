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

export async function saveUserProfile(userId: string, profile: UserProfileSchema, retries = 3): Promise<void> {
  const auth = getAuth();
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    console.error('Profile save failed: auth mismatch for path', `users/${userId}/profile/current`);
    throw new Error('Profile save failed: authentication error');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const docRef = doc(db, 'users', userId, 'profile', 'current');
      
      const profileToSave = { ...profile };
      const snapshot = {
        income: profileToSave.income,
        expenses: profileToSave.expenses,
        loans: [...profileToSave.loans],
        assets: { ...profileToSave.assets }
      };
      
      profileToSave.history = [...(profileToSave.history || [])];
      profileToSave.history.push({ snapshot, timestamp: Date.now() });

      if (profileToSave.history.length > 15) {
        profileToSave.history = profileToSave.history.slice(profileToSave.history.length - 15);
      }
      
      profileToSave.lastUpdated = Date.now();
      await setDoc(docRef, profileToSave, { merge: true });
      return; // Success
    } catch (error: any) {
      if (error.message && error.message.includes("Missing or insufficient permissions")) {
         console.error('Profile save failed: auth mismatch for path', `users/${userId}/profile/current`);
         throw new Error('Profile save failed: authentication error');
      }
      
      console.error(`Error saving user profile (Attempt ${attempt}/${retries}):`, error);
      if (attempt === retries) {
        throw new Error("Failed to save profile after multiple attempts. Please check your connection.");
      }
      // wait 500ms before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
