import OpenAI from "openai";
import iliPrompt from "./iliPrompt.js"; // Adjust path as needed

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
  const { message } = JSON.parse(body);

  if (!message) {
    res.status(400).json({ error: "No message provided" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: iliPrompt },   // ← uses your big prompt!
        { role: "user", content: message },
      ],
    });
    const reply = completion.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
