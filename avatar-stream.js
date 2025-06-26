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

// 🧠 Call secure GPT API
async function speak() {
  const userQuestion = textInput.value.trim();
  if (!userQuestion) {
    alert("⚠️ Please enter a question.");
    return;
  }

  textInput.disabled = true;
  responseBox.textContent = "🧠 Thinking...";

  try {
    const res = await fetch("/api/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userQuestion })
    });

    const data = await res.json();
    if (data.answer) {
      responseBox.textContent = data.answer;
    } else {
      responseBox.textContent = "⚠️ No answer returned.";
    }

  } catch (err) {
    console.error("❌ GPT error:", err);
    responseBox.textContent = "❌ Failed to fetch response.";
  } finally {
    textInput.disabled = false;
  }
}

// Placeholder buttons
function repeatPlayback() {
  alert("🔁 Voice replay is disabled to conserve tokens.");
}

function stopPlayback() {
  alert("🛑 Voice playback is disabled in GPT-only mode.");
}
