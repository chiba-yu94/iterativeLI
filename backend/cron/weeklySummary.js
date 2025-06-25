// weeklySummary.js (Node.js, to be scheduled once per week)
import fetch from "node-fetch";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function runWeeklySummary() {
  // 1. Fetch last 7 daily profiles
  const res = await fetch("https://YOUR_DOMAIN/api/memory?type=daily_profile&limit=7");
  const data = await res.json();
  const dailyProfiles = (data.profiles || []).map(p => p.text).join("\n\n");

  // 2. Summarize with GPT
  const prompt = `
Summarize these 7 daily user profiles into a long-term core profile.
Highlight persistent traits, emotional trends, likes/dislikes, important events.

${dailyProfiles}
  `;
  const summaryRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Summarize for I.L.I. long-term identity." },
        { role: "user", content: prompt }
      ],
      max_tokens: 256,
      temperature: 0.3
    })
  });
  const coreProfile = (await summaryRes.json()).choices?.[0]?.message?.content?.trim() || "";

  // 3. Save as new core_profile in Dify
  await fetch("https://YOUR_DOMAIN/api/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: coreProfile,
      metadata: { type: "core_profile", date: new Date().toISOString().slice(0,10) }
    })
  });
}
