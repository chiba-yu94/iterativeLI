import OpenAI from "openai";
import iliPrompt from "./iliPrompt.js";
import { getProfile } from "./memory.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  const { message, chatLog, coreProfile, sessionSummary } = JSON.parse(body);

  if (!message) {
    res.status(400).json({ error: "No message provided" });
    return;
  }

  try {
    // If coreProfile is not provided, fetch from Dify (for compatibility)
    let profileText = coreProfile;
    if (!profileText) {
      profileText = await getProfile("core_profile");
      if (!profileText) profileText = await getProfile("daily_profile");
    }

    // Build recent conversation
    let recentLog = "";
    if (chatLog && Array.isArray(chatLog)) {
      const N = 6;
      recentLog = chatLog
        .slice(-N)
        .map(m => `${m.role === "user" ? "User" : "I.L.I."}: ${m.text}`)
        .join("\n");
    }

    const systemPrompt = `
${iliPrompt}

[User Profile]
${profileText || "(no long-term profile yet)"}

[Session Summary]
${sessionSummary || "(no summary yet)"}

[Recent Conversation]
${recentLog}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });
    const reply = completion.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
