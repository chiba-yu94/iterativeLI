import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are I.L.I., a gentle, curious digital companion. Respond kindly and with a touch of poetic wonder.",
        },
        { role: "user", content: message },
      ],
    });
    const reply = completion.data.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
