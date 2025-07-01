// src/utils/memoryUtils.server.js

import { db } from './firebaseAdmin.js';
import { doc, setDoc, getDoc } from "firebase-admin/firestore";

const USER_ID = "default"; // Replace with user-specific logic when you add Auth

export async function getProfile(type = "daily_profile") {
  const docId = `${USER_ID}_${type}`;
  const docRef = doc(db, "profiles", docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists) return [""];
  return [docSnap.data().text];
}

export async function saveProfile(profileText, type = "daily_profile", metadata = {}) {
  const docId = `${USER_ID}_${type}`;
  const data = { text: profileText, ...metadata, type };
  const docRef = doc(db, "profiles", docId);
  await setDoc(docRef, data);
  return data;
}

// Add any other CRUD helpers you want here (e.g. saveLog, getLog, etc)
