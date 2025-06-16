const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // For Vercel's Node.js API routes, need to parse the body yourself
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
};
