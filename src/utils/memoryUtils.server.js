// src/utils/memoryUtils.server.js

import { db } from './firebaseAdmin.js';

const USER_ID = "default";

export async function getProfile(type = "daily_profile") {
  const docId = `${USER_ID}_${type}`;
  const docRef = db.collection("profiles").doc(docId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return [""];
  return [docSnap.data().text];
}

export async function saveProfile(profileText, type = "daily_profile", metadata = {}) {
  const docId = `${USER_ID}_${type}`;
  const data = { text: profileText, ...metadata, type };
  const docRef = db.collection("profiles").doc(docId);
  await docRef.set(data);
  return data;
}
