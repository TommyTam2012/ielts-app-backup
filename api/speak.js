import { WebSocket } from "ws";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = await req.json?.() || await new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => resolve(JSON.parse(body)));
      req.on("error", (err) => reject(err));
    });

    const voiceId = "E2iXioKRyjSqJA8tUYsv";
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const didRawKey = process.env.DID_API_KEY;

    if (!text || !elevenKey || !didRawKey) {
      return res.status(400).json({ error: "Missing input, ElevenLabs key, or D-ID key." });
    }

    console.log("📥 Text received:", text);

    // Step 1: Get TTS audio from ElevenLabs
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

    // Step 2: WebSocket to D-ID
    const encoded = Buffer.from(didRawKey).toString("base64");

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
