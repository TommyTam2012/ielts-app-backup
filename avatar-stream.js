const audio = document.getElementById('audioPlayer');
const mouth = document.getElementById('mouthOverlay');
const textInput = document.getElementById('textToSpeak');
const responseBox = document.createElement('div');

// 📦 Style the GPT response box
responseBox.style.marginTop = "20px";
responseBox.style.fontSize = "18px";
responseBox.style.color = "#003366";
responseBox.style.maxWidth = "80%";
responseBox.style.marginLeft = "auto";
responseBox.style.marginRight = "auto";
document.body.appendChild(responseBox);

// 🎙️ Trigger GPT API for text response
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
    responseBox.textContent = data.answer || "⚠️ No answer returned.";
  } catch (err) {
    console.error("❌ GPT error:", err);
    responseBox.textContent = "❌ Failed to fetch response.";
  } finally {
    textInput.disabled = false;
  }
}

// 🦷 Animate mouth while audio is playing
audio.addEventListener('play', () => {
  mouth.style.opacity = 1;
  mouth.style.animation = 'talking 0.25s infinite alternate ease-in-out'; // ✅ smoother
});

audio.addEventListener('ended', () => {
  mouth.style.opacity = 0.2;
  mouth.style.animation = 'none';
});

audio.addEventListener('pause', () => {
  mouth.style.opacity = 0.2;
  mouth.style.animation = 'none';
});

// 🔁 Repeat button logic
function repeatPlayback() {
  audio.currentTime = 0;
  try {
    audio.play();
  } catch (err) {
    console.warn("Playback error:", err);
  }
}

// 🛑 Stop button logic
function stopPlayback() {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (err) {
    console.warn("Stop error:", err);
  }
}
