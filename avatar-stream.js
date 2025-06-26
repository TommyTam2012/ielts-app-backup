let currentAudio = null;
let mouthAnimation = null;

const overlay = document.getElementById("mouthOverlay");
const textInput = document.getElementById("textToSpeak");

// 🎙️ Speak using ElevenLabs
async function speak() {
  const text = textInput.value.trim();
  if (!text) {
    alert("⚠️ Please enter text to speak.");
    return;
  }

  try {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    if (!data.audioBase64) {
      alert("⚠️ Failed to get audio.");
      return;
    }

    const audioSrc = data.audioBase64.startsWith("data:")
      ? data.audioBase64
      : `data:audio/mpeg;base64,${data.audioBase64}`;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(audioSrc);
    currentAudio.onplay = () => animateMouth(currentAudio);
    currentAudio.onended = () => stopMouth();
    currentAudio.play();

  } catch (err) {
    console.error("🎤 Error during speak:", err);
    alert("❌ Error speaking. Check console.");
  }
}

// 🔁 Repeat voice playback
function repeatPlayback() {
  if (currentAudio) {
    currentAudio.currentTime = 0;
    currentAudio.play();
    animateMouth(currentAudio);
  }
}

// 🛑 Stop voice playback
function stopPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  stopMouth();
}

// 👄 Animate mouth using audio waveform
function animateMouth(audioElement) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaElementSource(audioElement);
  const analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function updateMouth() {
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const scale = Math.min(avg / 128, 1);
    overlay.style.transform = `translateX(-50%) scaleY(${0.3 + scale * 0.7})`;
    mouthAnimation = requestAnimationFrame(updateMouth);
  }

  updateMouth();
}

// 🔇 Stop mouth animation
function stopMouth() {
  cancelAnimationFrame(mouthAnimation);
  overlay.style.transform = "translateX(-50%) scaleY(1)";
}
