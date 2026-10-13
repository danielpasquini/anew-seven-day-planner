"use client"

import { getApp, getApps, initializeApp } from "firebase/app"
import { browserSessionPersistence, getAuth, setPersistence, type Auth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const authConfigured = Object.values(config).every((value) => !!value && !value.includes("your-") && !value.includes("<"))
let persistence: Promise<void> | null = null

export function getFirebaseServices() {
  if (!authConfigured) throw new Error("AUTH_NOT_CONFIGURED")
  const app = getApps().length ? getApp() : initializeApp(config)
  return { auth: getAuth(app), db: getFirestore(app) }
}

export async function prepareAuth(): Promise<Auth> {
  const { auth } = getFirebaseServices()
  // Closing the browser ends the session; no app passwords or tokens in our data store.
  persistence ??= setPersistence(auth, browserSessionPersistence).catch((error) => { persistence = null; throw error })
  await persistence
  return auth
}

export async function getAuthToken(): Promise<string> {
  const auth = await prepareAuth()
  if (!auth.currentUser || !auth.currentUser.emailVerified) throw new Error("AUTH_REQUIRED")
  return auth.currentUser.getIdToken()
}
