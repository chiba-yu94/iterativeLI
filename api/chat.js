// /api/chat.js
import OpenAI from "openai";
import iliPrompt from "./iliPrompt.js";
import { getProfile } from "./memory.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Multi-fact extractor (GPT)
async function extractUserFacts(chatLog) {
  const prompt = `
From the following conversation, extract these fields (leave blank if not mentioned):

User's name:
Likes:
Dislikes:
Typical Mood/Emotion:
Current Mood/Emotion:
Aspirations/Concerns:
Favorite Topics:
Important Reflections:

Conversation:
${chatLog.map(m => `${m.role === "user" ? "User" : "I.L.I."}: ${m.text}`).join("\n")}
  `;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Extract user facts and important info as specified. Respond in the given format, leaving fields blank if not mentioned." },
        { role: "user", content: prompt }
      ],
      max_tokens: 180,
      temperature: 0
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = "";
  for await (const chunk of req) { body += chunk; }
  const { message, chatLog, dailyProfile, coreProfile, sessionSummary } = JSON.parse(body);

  if (typeof message !== "string" || !Array.isArray(chatLog)) {
    res.status(400).json({ error: "Missing or invalid message or chatLog" });
    return;
  }

  try {
    // Use provided daily/core profile, or fallback to fetching latest from Dify
    let todayProfile = dailyProfile;
    if (!todayProfile) {
      todayProfile = await getProfile("daily_profile");
    }
    let weeklyProfile = coreProfile;
    if (!weeklyProfile) {
      weeklyProfile = await getProfile("core_profile");
    }

    // Extract up-to-date user facts from chat log
    const userFacts = await extractUserFacts(chatLog);

    // Build the last N turns of conversation for recency
    const N = 8;
    const recentLog = chatLog
      .slice(-N)
      .map(m => `${m.role === "user" ? "User" : "I.L.I."}: ${m.text}`)
      .join("\n");

    // Assemble the full system prompt
    const systemPrompt = `
${iliPrompt}

[Long-Term Memory]
${weeklyProfile || "(no long-term memory yet)"}

[Daily Memory]
${todayProfile || "(no daily memory yet)"}

[User Facts]
${userFacts}

[Session Summary]
${sessionSummary || "(no summary yet)"}

[Recent Conversation]
${recentLog}
    `;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });
    const reply = completion.choices[0].message.content;

    res.status(200).json({ reply, userFacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
