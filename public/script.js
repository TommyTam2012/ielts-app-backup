console.log("🟢 script.js loaded successfully");

const responseBox = document.getElementById("responseBox");
const questionInput = document.getElementById("questionInput");
const historyList = document.getElementById("historyList");
const micBtn = document.getElementById("micBtn");

const translationBox = document.createElement("div");
translationBox.id = "chineseTranslation";
translationBox.style.marginTop = "10px";
translationBox.style.fontSize = "0.95em";
translationBox.style.color = "#333";
responseBox.insertAdjacentElement("afterend", translationBox);

// ✅ Patched setExam function: Opens IELTS PDF from /exam/IELTS/
function setExam(examId) {
  console.log("📘 setExam called with:", examId);
  const pdfUrl = `${window.location.origin}/exam/IELTS/${examId}.pdf`;
  window.open(pdfUrl, "_blank");
}

function submitQuestion() {
  const question = "Hello Crew! We have failed miserably, and we are down trottened, hurt, defeated, and loosing spirit. But if u trust capt. GPT and capt. Tommy, we will be the last one to jump ship. Till the end crew!";

  responseBox.textContent = "🎙️ Sending to ElevenLabs + D-ID...";
  translationBox.textContent = "";

  speakWithMyVoice(question);
}

function addToHistory(question, answer) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>問：</strong>${question}<br/><strong>答：</strong>${answer}`;
  historyList.prepend(li);
}

async function speakWithMyVoice(text) {
  try {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    if (data.didStreamUrl) {
      switchToDIDStream(data.didStreamUrl);
    }

    if (data.audioBase64) {
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
      audio.play();
    }
  } catch (err) {
    console.error("🎤 Voice error:", err);
  }
}

function switchToDIDStream(streamUrl) {
  const iframe = document.getElementById("didVideo");
  const staticAvatar = document.getElementById("avatarImage");
  iframe.src = streamUrl;
  iframe.style.display = "block";
  staticAvatar.style.display = "none";
  console.log("🎥 D-ID stream activated:", streamUrl);
}

document.addEventListener("DOMContentLoaded", () => {
  window.submitQuestion = submitQuestion;
  window.setExam = setExam;
});
