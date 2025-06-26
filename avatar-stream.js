let mouthAnimation = null;
const overlay = document.getElementById("mouthOverlay");
const textInput = document.getElementById("textToSpeak");
const responseBox = document.createElement("div");

responseBox.style.marginTop = "20px";
responseBox.style.fontSize = "18px";
responseBox.style.color = "#003366";
responseBox.style.maxWidth = "80%";
responseBox.style.marginLeft = "auto";
responseBox.style.marginRight = "auto";
document.body.appendChild(responseBox);

// 🧠 Ask GPT (no voice)
async function speak() {
  const userQuestion = textInput.value.trim();
  if (!userQuestion) {
    alert("⚠️ Please enter a question.");
    return;
  }

  textInput.disabled = true;
  responseBox.textContent = "🧠 Thinking...";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}` // Replace this safely in prod
      },
      body: JSON.stringify({
        model: "gpt-4o",  // use GPT-4o (Onyx)
        messages: [
          { role: "system", content: "You are an IELTS reading tutor. Keep your answers short and instructional." },
          { role: "user", content: userQuestion }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "⚠️ No response from GPT.";

    responseBox.textContent = answer;

  } catch (err) {
    console.error("GPT error:", err);
    responseBox.textContent = "❌ Error: Could not reach GPT.";
  } finally {
    textInput.disabled = false;
  }
}

// Placeholder functions
function repeatPlayback() {
  alert("🔁 Voice playback disabled to save credits.");
}

function stopPlayback() {
  alert("🛑 Voice playback disabled to save credits.");
}
// avatar stream begins here
