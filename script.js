
// Simple browser app: loads lessons.json and provides grade -> lesson -> practice + quiz.
// Uses Web Speech API (SpeechSynthesis & SpeechRecognition)
// Progress stored in localStorage

const LESSONS_URL = "./lessons.json";
const STORAGE_KEY = "spoken_trainer_progress_v1";
let curriculum = null;
let currentGrade = null;
let currentLesson = null;
let recognition = null;
let listening = false;

async function loadCurriculum(){
  const res = await fetch(LESSONS_URL);
  curriculum = await res.json();
  renderGrades();
  renderProgress();
}

function renderGrades(){
  const container = document.getElementById("grades");
  container.innerHTML = "";
  curriculum.grades.forEach(g => {
    const btn = document.createElement("button");
    btn.className = "grade-btn";
    btn.innerText = "Grade " + g.grade;
    btn.onclick = () => openGrade(g.grade);
    container.appendChild(btn);
  });
}

function openGrade(gradeNum){
  currentGrade = curriculum.grades.find(g=>g.grade===gradeNum);
  document.getElementById("grade-select").style.display = "none";
  document.getElementById("lessons").style.display = "block";
  document.getElementById("lessons-title").innerText = "Lessons — Grade " + gradeNum;
  const list = document.getElementById("lessons-list");
  list.innerHTML = "";
  currentGrade.lessons.forEach(ls=>{
    const card = document.createElement("div");
    card.className = "lesson-card";
    card.innerHTML = `<div class='lesson-title'>${ls.title}</div>
      <div class='lesson-meta'>${ls.sentences.length} lines • ${ls.quiz.length} Qs</div>
      <div class='lesson-actions'><button class='btn' onclick='openLesson("${ls.id}")'>Open</button></div>`;
    list.appendChild(card);
  });
}

function openLesson(id){
  currentLesson = currentGrade.lessons.find(l=>l.id===id);
  document.getElementById("lessons").style.display = "none";
  document.getElementById("player").style.display = "block";
  document.getElementById("lesson-title").innerText = currentLesson.title;
  loadPracticeUI();
  loadQuizUI();
}

document.getElementById("back-to-grades").onclick = ()=>{
  document.getElementById("lessons").style.display = "none";
  document.getElementById("grade-select").style.display = "block";
}

document.getElementById("back-to-lessons").onclick = ()=>{
  document.getElementById("player").style.display = "none";
  document.getElementById("lessons").style.display = "block";
  renderProgress();
}

function speak(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }catch(e){
    console.warn("TTS error", e);
  }
}

function loadPracticeUI(){
  const ptext = document.getElementById("practice-text");
  const pprompt = document.getElementById("practice-prompt");
  ptext.innerText = currentLesson.sentences[0].text;
  pprompt.innerText = currentLesson.sentences[0].prompt || "";
  // controls
  document.getElementById("listen-btn").onclick = ()=>speak(currentLesson.sentences[0].text);
  setupRecognition();
  document.getElementById("start-btn").onclick = startListening;
  document.getElementById("stop-btn").onclick = stopListening;
}

let practiceIndex = 0;
function setupRecognition(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){ document.getElementById("transcript").innerText = "Speech recognition not supported in this browser."; return; }
  recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e)=> {
    const t = e.results[0][0].transcript;
    document.getElementById("transcript").innerText = "You said: " + t + " (match: " + Math.round(similarity(t, currentLesson.sentences[practiceIndex].text)*100) + "%)";
    // if good, move next
    if(similarity(t, currentLesson.sentences[practiceIndex].text) >= 0.8){
      practiceIndex = Math.min(practiceIndex+1, currentLesson.sentences.length-1);
      updatePracticeUI();
      saveProgressLine();
    }
  };
  recognition.onend = ()=> { listening = false; }
}

function startListening(){
  if(!recognition) return alert("Speech recognition not supported");
  try{ recognition.start(); listening = true; }catch(e){ console.warn(e) }
}
function stopListening(){ try{ recognition.stop(); listening=false }catch(e){} }

function updatePracticeUI(){
  const ptext = document.getElementById("practice-text");
  const pprompt = document.getElementById("practice-prompt");
  ptext.innerText = currentLesson.sentences[practiceIndex].text;
  pprompt.innerText = currentLesson.sentences[practiceIndex].prompt || "";
}

function similarity(a,b){
  const wa = (a||"").toLowerCase().replace(/[^a-z\s]/g,"").split(/\s+/).filter(Boolean);
  const wb = (b||"").toLowerCase().replace(/[^a-z\s]/g,"").split(/\s+/).filter(Boolean);
  if(wa.length===0 || wb.length===0) return 0;
  let matches = 0;
  const setB = new Set(wb);
  wa.forEach(w=>{ if(setB.has(w)) matches++; });
  return matches / Math.max(wa.length, wb.length);
}

// Quiz
function loadQuizUI(){
  const qa = document.getElementById("quiz-area");
  qa.innerHTML = "<h3>Quiz</h3>";
  const qlist = currentLesson.quiz;
  qlist.forEach((q, i)=>{
    const div = document.createElement("div");
    div.className = 'card';
    div.innerHTML = `<div><b>Q${i+1}.</b> ${q.question}</div>`;
    q.options.forEach((opt, j)=>{
      const btn = document.createElement("button");
      btn.className = 'btn';
      btn.style.margin = '6px 6px 6px 0';
      btn.innerText = opt;
      btn.onclick = ()=> {
        if(j===q.answerIndex) { btn.style.background='#16a34a'; btn.innerText = '✓ ' + opt; } else { btn.style.background='#dc2626'; btn.innerText = '✕ ' + opt; }
      };
      div.appendChild(btn);
    });
    qa.appendChild(div);
  });
}

// Progress
function loadProgress(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }catch(e){ return {}; }
}
function saveProgress(obj){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}
function saveProgressLine(){
  const pr = loadProgress();
  pr[currentGrade.grade] = pr[currentGrade.grade] || {};
  pr[currentGrade.grade][currentLesson.id] = pr[currentGrade.grade][currentLesson.id] || { practiced: 0 };
  pr[currentGrade.grade][currentLesson.id].practiced = Math.min(currentLesson.sentences.length, (pr[currentGrade.grade][currentLesson.id].practiced||0)+1);
  saveProgress(pr);
  renderProgress();
}
function renderProgress(){
  document.getElementById("progress-json").innerText = JSON.stringify(loadProgress(), null, 2);
}

window.onload = ()=> loadCurriculum();
