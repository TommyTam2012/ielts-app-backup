export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!prompt || !apiKey) {
    return res.status(400).json({ error: "Missing prompt or API key" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an IELTS reading tutor. Keep answers short and helpful." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    res.status(200).json({
      answer: data.choices?.[0]?.message?.content?.trim() || "No response received."
    });

  } catch (err) {
    console.error("❌ GPT API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
