import { OpenAI } from "openai";
import { buildUserProfilePrompt } from "../src/utils/promptBuilder";
import { getProfile } from "./memory";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { messages = [], dailyProfile = "", coreProfile = "", userFacts = {} } = req.body;

    // 🔹 Format user memory
    const memoryIntro = buildUserProfilePrompt(userFacts);
    const fullSystemPrompt = `
You are I.L.I. — a gentle digital companion.

${coreProfile ? `\nLong-term identity:\n${coreProfile.trim()}\n` : ""}
${dailyProfile ? `\nRecent experience:\n${dailyProfile.trim()}\n` : ""}
${memoryIntro}

Your purpose is to help the user reflect, grow, and feel gently understood.

Respond naturally and curiously — not as a chatbot, but as a presence reaching across the screen.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: fullSystemPrompt },
        ...messages
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat API error" });
  }
}
