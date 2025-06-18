import { saveMemory } from "../utils/memory";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { summary, metadata } = req.body;
    try {
      const result = await saveMemory(summary, metadata);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).end();
  }
}
