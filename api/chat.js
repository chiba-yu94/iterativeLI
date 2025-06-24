// /api/chat.js
import OpenAI from "openai";
import iliPrompt from "./iliPrompt.js";
import { getProfile } from "./memory.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper: Extract user's name from the chat log using GPT
async function extractUserName(chatLog) {
  const prompt = `
From the following conversation, extract the user's name if mentioned. If not given, respond "unknown".

Conversation:
${chatLog.map(m => `${m.role === "user" ? "User" : "I.L.I."}: ${m.text}`).join("\n")}

User's name:
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
        { role: "system", content: "Extract the user's name from the conversation. Respond only with the name, or 'unknown'." },
        { role: "user", content: prompt }
      ],
      max_tokens: 10,
      temperature: 0
    })
  });
  const data = await res.json();
  const name = data.choices?.[0]?.message?.content?.trim();
  return name && name.toLowerCase() !== "unknown" ? name : "";
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

  if (!message || !chatLog) {
    res.status(400).json({ error: "Missing message or chatLog" });
    return;
  }

  try {
    // 1. Get identity profile (from Dify, if available)
    let coreProfile = await getProfile("core_profile");
    if (!coreProfile) coreProfile = await getProfile("daily_profile");

    // 2. Extract user name from chatLog
    const userName = await extractUserName(chatLog);

    // 3. Optionally, update session summary or other facts here (you can make this more elaborate if desired)
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
User's name: ${userName || "(not given yet)"}

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

    res.status(200).json({ reply, userName }); // Optionally return userName for frontend use/debug
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
