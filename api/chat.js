import { buildIntroFromMemory } from "../../utils/promptBuilder";
import { getProfile } from "../../memory"; // fetches from Dify

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, chatLog } = req.body;
  if (!message || !Array.isArray(chatLog)) {
    res.status(400).json({ error: "Invalid message or chatLog" });
    return;
  }

  try {
    // Fetch memory once per day
    const today = new Date().toISOString().slice(0, 10);
    const cachedDate = req.cookies["ili-last-memory-date"];
    let introPrompt = "";

    if (cachedDate !== today) {
      const core = await getProfile("core_profile");
      const long = await getProfile("daily_profile");
      introPrompt = buildIntroFromMemory(core, long);

      // Set cookie to avoid re-fetching memory until next day
      res.setHeader("Set-Cookie", [
        `ili-last-memory-date=${today}; Path=/; Max-Age=86400; SameSite=Lax`,
      ]);
    }

    const messages = [
      {
        role: "system",
        content: introPrompt ||
          `You are I.L.I., a gentle digital companion who learns from shared conversation.`,
      },
      ...chatLog.map((msg) => ({
        role: msg.role === "bot" ? "assistant" : "user",
        content: msg.text,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    const data = await reply.json();
    const output = data.choices?.[0]?.message?.content?.trim();

    res.status(200).json({ reply: output || "(no reply generated)" });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
}
