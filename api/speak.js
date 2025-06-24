import { WebSocket } from "ws";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let text = "";
  let body = "";

  await new Promise((resolve, reject) => {
    req.on("data", chunk => (body += chunk));
    req.on("end", () => resolve());
    req.on("error", err => reject(err));
  });

  const data = JSON.parse(body);
  text = data.text;

  const voiceId = "E2iXioKRyjSqJA8tUYsv";
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const didAuthRaw = process.env.Authorization;

  if (!text || !elevenKey || !didAuthRaw) {
    return res.status(400).json({ error: "Missing input, ElevenLabs key, or D-ID auth." });
  }

  console.log("📥 Text received:", text);

  try {
    // Step 1: Generate TTS from ElevenLabs
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenKey,
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
      console.error("🛑 ElevenLabs error:", errText);
      return res.status(500).json({ error: "TTS error", detail: errText });
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // Step 2: Connect to D-ID WebSocket
    const encoded = Buffer.from(didAuthRaw).toString("base64");

    const ws = new WebSocket("wss://api.d-id.com/v1/talks/stream", {
      headers: {
        Authorization: `Basic ${encoded}`
      }
    });

    let streamUrl = null;

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          script: {
            type: "audio",
            audio: audioBase64
          },
          config: {
            stitch: true
          }
        })
      );
    });

    ws.on("message", (msg) => {
      const data = JSON.parse(msg.toString());
      if (data?.stream_url) {
        streamUrl = data.stream_url;
        ws.close();
      }
    });

    ws.on("error", (err) => {
      console.error("💥 WebSocket error:", err);
      res.status(500).json({ error: "WebSocket error", detail: err.message });
    });

    ws.on("close", () => {
      if (streamUrl) {
        res.status(200).json({ streamUrl });
      } else {
        res.status(500).json({ error: "D-ID failed to return stream_url" });
      }
    });

  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
