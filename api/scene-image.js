import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Scene art requires OPENAI_API_KEY." });
  try {
    const description = String(req.body?.description || "").trim();
    if (!description) return res.status(400).json({ error: "Missing scene description." });
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      prompt: `Cinematic fantasy tabletop roleplaying scene, painterly realism, atmospheric lighting, no captions, no text, no UI, no logos. ${description}`,
      size: "1536x1024"
    });
    const item = result.data?.[0];
    if (item?.b64_json) return res.status(200).json({ image: `data:image/png;base64,${item.b64_json}` });
    if (item?.url) return res.status(200).json({ image: item.url });
    return res.status(500).json({ error: "No image returned." });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
