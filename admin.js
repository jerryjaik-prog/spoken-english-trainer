
// Admin panel: client-side only. Simple password check, import/export JSON, edit in textarea.
const LESSONS_URL = "./lessons.json";
const ADMIN_PASS = "teach123"; // change after upload if desired

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const adminUi = document.getElementById("admin-ui");
const passInput = document.getElementById("admin-pass");
const importBtn = document.getElementById("import-btn");
const fileInput = document.getElementById("file-input");
const exportBtn = document.getElementById("export-btn");
const lessonsText = document.getElementById("lessons-text");
const saveLocalBtn = document.getElementById("save-local");

let data = null;

async function loadLessons(){
  const r = await fetch(LESSONS_URL);
  data = await r.json();
  lessonsText.value = JSON.stringify(data, null, 2);
}

loginBtn.onclick = ()=>{
  const v = passInput.value || "";
  if(v === ADMIN_PASS){
    adminUi.style.display = "block";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    alert("Incorrect password");
  }
}
logoutBtn.onclick = ()=>{
  adminUi.style.display = "none";
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
}

importBtn.onclick = ()=> fileInput.click();
fileInput.onchange = (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = (ev)=> {
    try{
      const parsed = JSON.parse(ev.target.result);
      data = parsed;
      lessonsText.value = JSON.stringify(data, null, 2);
      alert("Imported into editor. Click Save to store locally.");
    }catch(err){ alert("Invalid JSON file"); }
  };
  r.readAsText(f);
}

exportBtn.onclick = ()=>{
  try{
    const blob = new Blob([lessonsText.value], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lessons.json"; a.click();
  }catch(err){ alert("Could not export"); }
}

saveLocalBtn.onclick = ()=>{
  try{
    const parsed = JSON.parse(lessonsText.value);
    localStorage.setItem("lessons_json_local", JSON.stringify(parsed));
    alert("Saved to localStorage key 'lessons_json_local'. To make this live for users, update public/lessons.json in the repository.");
  }catch(err){
    alert("Invalid JSON in editor");
  }
}

window.onload = ()=> loadLessons();
