// src/utils/memoryUtils.js

import { db } from './firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { DEFAULT_PROFILES, summarizeAsProfile, summarizeFuse } from './memoryShared.js';

const USER_ID = "default"; // Replace with real Auth UID for multi-user

// --- FIRESTORE CRUD (client SDK) ---

export async function saveProfile(profileText, type = "daily_profile", metadata = {}) {
  const docId = `${USER_ID}_${type}`;
  const data = { text: profileText, ...metadata, type };
  await setDoc(doc(db, "profiles", docId), data);
  return data;
}

export async function saveDailyProfileWithLog(profileText, chatLogArr = []) {
  return saveProfile(profileText, "daily_profile", { recent_log: JSON.stringify(chatLogArr) });
}

export async function getDailyProfileWithLog() {
  const docId = `${USER_ID}_daily_profile`;
  const docSnap = await getDoc(doc(db, "profiles", docId));
  if (!docSnap.exists()) return { text: DEFAULT_PROFILES.daily_profile, recent_log: [] };
  const data = docSnap.data();
  let logArr = [];
  try { logArr = JSON.parse(data.recent_log || "[]"); } catch { logArr = []; }
  return { text: data.text || DEFAULT_PROFILES.daily_profile, recent_log: logArr };
}

export async function getProfile(type = "daily_profile") {
  const docId = `${USER_ID}_${type}`;
  const docSnap = await getDoc(doc(db, "profiles", docId));
  if (!docSnap.exists()) return [DEFAULT_PROFILES[type] || ""];
  return [docSnap.data().text];
}

// --- SUMMARIZATION (via OpenAI, uses apiKey passed from caller) ---

export { DEFAULT_PROFILES, summarizeAsProfile, summarizeFuse };
