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

let currentExamId = "";

function setExam(examId) {
  currentExamId = examId;
  const pdfUrl = `/exam/IELTS/${examId}.pdf`;
  window.open(pdfUrl, "_blank");
  console.log(`📘 Exam set to ${examId}`);
}

function submitQuestion() {
  const question = questionInput.value.trim();
  if (!question || !currentExamId) {
    alert("⚠️ 請選擇試卷並輸入問題");
    return;
  }

  responseBox.textContent = "正在分析中，請稍候...";
  translationBox.textContent = "";

  const totalPages = 13;
  const instruction = `
You are an IELTS Academic Reading instructor. The student is asking about test ${currentExamId.toUpperCase()}.
If the question is about Q1–Q40, or about a specific paragraph (e.g., Paragraph B or Section 2), please find the correct answer based on the reading images.
Only answer the exact question. Do not summarize unless asked.
`;

  const imageMessages = [
    { type: "text", text: instruction },
    { type: "text", text: question }
  ];

  for (let i = 1; i <= totalPages; i++) {
    const imageUrl = `/exam/IELTS/${currentExamId}_page${i}.png`;
    imageMessages.push({
      type: "image_url",
      image_url: { url: window.location.origin + imageUrl }
    });
  }

  fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: question, messages: imageMessages })
  })
    .then(res => res.json())
    .then(data => {
      const answer = data.response || "❌ 無法獲取英文回答。";
      const translated = data.translated || "❌ 無法翻譯為中文。";

      responseBox.textContent = answer;
      translationBox.textContent = `🇨🇳 中文翻譯：${translated}`;
      addToHistory(question, `${answer}<br><em>🇨🇳 中文翻譯：</em>${translated}`);
    })
    .catch(err => {
      responseBox.textContent = "❌ 發生錯誤，請稍後重試。";
      console.error("GPT error:", err);
    });

  questionInput.value = "";
}

function addToHistory(question, answer) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>問：</strong>${question}<br/><strong>答：</strong>${answer}`;
  historyList.prepend(li);
}

function detectLang(text) {
  return /[\u4e00-\u9fa5]/.test(text) ? "zh-CN" : "en-GB";
}

function getVoiceForLang(lang) {
  const voices = speechSynthesis.getVoices();
  if (lang === "zh-CN") {
    return voices.find(v => v.lang === "zh-CN") || voices.find(v => v.name.includes("Google 普通话 女声"));
  } else {
    return voices.find(v => v.lang === "en-GB") || voices.find(v => v.name.includes("Google UK English Female"));
  }
}

function speakMixed(text) {
  const segments = text.split(/(?<=[。.!?])/).map(s => s.trim()).filter(Boolean);
  let index = 0;

  function speakNext() {
    if (index >= segments.length) return;
    const segment = segments[index++];
    const lang = detectLang(segment);
    const utter = new SpeechSynthesisUtterance(segment);
    utter.lang = lang;
    utter.voice = getVoiceForLang(lang);
    utter.rate = 1;
    utter.onend = speakNext;
    speechSynthesis.speak(utter);
  }

  speechSynthesis.cancel();
  speakNext();
}

document.getElementById("ttsBtn")?.addEventListener("click", () => {
  const english = responseBox.textContent.trim();
  const chinese = translationBox.textContent.replace(/^🇨🇳 中文翻譯：/, "").trim();
  speakMixed(`${english} ${chinese}`);
});

document.getElementById("stopTTSBtn")?.addEventListener("click", () => {
  speechSynthesis.cancel();
  console.log("🛑 TTS playback stopped");
});

if (window.SpeechRecognition || window.webkitSpeechRecognition) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener("mousedown", () => {
    recognition.start();
    micBtn.textContent = "🎤 正在錄音... (松開送出)";
  });

  micBtn.addEventListener("mouseup", () => {
    recognition.stop();
    micBtn.textContent = "🎤 語音提問";
  });

  micBtn.addEventListener("touchstart", () => {
    recognition.start();
    micBtn.textContent = "🎤 正在錄音... (松開送出)";
  });

  micBtn.addEventListener("touchend", () => {
    recognition.stop();
    micBtn.textContent = "🎤 語音提問";
  });

  recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript;
    questionInput.value = spoken;
    submitQuestion();
  };

  recognition.onerror = (event) => {
    alert("🎤 無法識別語音，請重試。");
    console.error("SpeechRecognition error:", event.error);
  };
}

window.submitQuestion = submitQuestion;
window.setExam = setExam;
