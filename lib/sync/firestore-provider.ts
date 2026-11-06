import { doc, getDoc, setDoc } from "firebase/firestore"
import { authConfigured, getFirebaseServices } from "@/lib/auth/firebase-client"
import type { RemoteCloudProvider, SyncStatePayload } from "@/lib/sync/sync-engine"

export class FirestoreCloudProvider implements RemoteCloudProvider {
  async fetchUserData(userId: string): Promise<SyncStatePayload | null> {
    if (!authConfigured) return null
    try {
      const { db } = getFirebaseServices()
      const ref = doc(db, "users", userId, "workspace", "state")
      const snapshot = await getDoc(ref)
      if (!snapshot.exists()) return null
      return snapshot.data() as SyncStatePayload
    } catch (e) {
      console.warn("Could not fetch user workspace from Firestore:", e)
      return null
    }
  }

  async saveUserData(userId: string, payload: SyncStatePayload): Promise<void> {
    if (!authConfigured) return
    const { db } = getFirebaseServices()
    const ref = doc(db, "users", userId, "workspace", "state")
    await setDoc(ref, payload, { merge: true })
  }
}
