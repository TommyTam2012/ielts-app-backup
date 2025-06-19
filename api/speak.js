export default async function handler(req, res) {
  let text = "";
  if (req.method === "POST") {
    let body = "";
    await new Promise((resolve, reject) => {
      req.on("data", chunk => (body += chunk));
      req.on("end", () => resolve());
      req.on("error", err => reject(err));
    });
    const data = JSON.parse(body);
    text = data.text;
  }

  const voiceId = "E2iXioKRyjSqJA8tUYsv";
  const apiKey = process.env.ELEVENLABS_API_KEY;

  console.log("📥 Text received:", text);
  console.log("🔐 API Key present?", !!apiKey);
  console.log("🗣️ Voice ID used:", voiceId);

  if (!text || !apiKey) {
    return res.status(400).json({ error: "Missing text or ElevenLabs API key." });
  }

  try {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.85
        }
      })
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("🛑 ElevenLabs API Error:", errText);
      return res.status(500).json({ error: "TTS API Error", detail: errText });
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("💥 TTS Server Error:", err);
    return res.status(500).json({ error: "TTS Server Error", detail: err.message });
  }
}
