// /api/chat.js
import OpenAI from "openai";
import iliPrompt from "./iliPrompt.js";
import { getProfile } from "./memory.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Extract multiple user facts from the chat log using GPT
async function extractUserFacts(chatLog) {
  const prompt = `
From the following conversation, extract any of these fields (leave blank if not mentioned):

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
  for await (const chunk of req) {
    body += chunk;
  }
  const { message, chatLog, sessionSummary } = JSON.parse(body);

  if (typeof message !== "string" || !Array.isArray(chatLog)) {
    res.status(400).json({ error: "Missing or invalid message or chatLog" });
    return;
  }

  try {
    // 1. Get identity profile (from Dify, if available)
    let coreProfile = await getProfile("core_profile");
    if (!coreProfile) coreProfile = await getProfile("daily_profile");

    // 2. Extract user facts (multi-field)
    const userFacts = await extractUserFacts(chatLog);

    // 3. Optionally, update session summary or other facts here (can expand if needed)
    const summary = sessionSummary || ""; // Or use other summary logic

    // 4. Build the last N turns of conversation for recency
    const N = 8;
    const recentLog = chatLog
      .slice(-N)
      .map(m => `${m.role === "user" ? "User" : "I.L.I."}: ${m.text}`)
      .join("\n");

    // 5. Assemble the system prompt
    const systemPrompt = `
${iliPrompt}

[User Profile]
${coreProfile || "(no long-term profile yet)"}

[User Facts]
${userFacts}

[Session Summary]
${summary || "(no summary yet)"}

[Recent Conversation]
${recentLog}
    `;

    // 6. Send to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });
    const reply = completion.choices[0].message.content;

    res.status(200).json({ reply, userFacts }); // Optionally return userFacts for frontend use/debug
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
