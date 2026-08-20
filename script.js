const $ = s => document.querySelector(s);
let currentLang = localStorage.getItem('baobabLang') || 'fr-FR';
let currentSecurity = localStorage.getItem('baobabSecurity') || 'standard';
let currentTheme = localStorage.getItem('baobabTheme') || 'light';
let safeSearch = localStorage.getItem('baobabSafe') || 'on';
let suggestionsOn = localStorage.getItem('baobabSuggestions') || 'on';
let currentQuery = "";
let currentFilter = "all";

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(`#${id}`).classList.add('active');
  window.scrollTo(0,0);
}

function openInBaobab(url, title) {
  showPage('viewer');
  $('#viewerFrame').src = url;
  $('#viewerTitle').textContent = title;
}

const localDB = {
  "senegal": {title: "Sénégal", desc: "Le Sénégal est un pays d'Afrique de l'Ouest. Capitale: Dakar."},
  "messi": {title: "Lionel Messi", desc: "Footballeur argentin, 8 fois Ballon d'Or."},
  "baobab": {title: "Baobab", desc: "Arbre emblématique d'Afrique. Peut vivre 1000 ans."}
};

function applyTheme() {
  if(currentTheme === 'system') {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', sysDark? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }
}

function goHome() {
  showPage('home');
  loadHistory();
  if($('#langSelect')) $('#langSelect').value = currentLang;
  if($('#securityMode')) $('#securityMode').value = currentSecurity;
  if($('#themeSelect')) $('#themeSelect').value = currentTheme;
  if($('#safeSearch')) $('#safeSearch').value = safeSearch;
  if($('#suggestionsToggle')) $('#suggestionsToggle').value = suggestionsOn;
  checkAuth();
}

function showSuggestions() {
  if(suggestionsOn === 'off') return;
  $('#suggestions').classList.remove('hidden');
  loadHistory();
}

function selectSuggest(text) {
  $('#searchInput').value = text;
  $('#suggestions').classList.add('hidden');
  search();
}

function toggleImageMenu(e) {
  e.stopPropagation();
  $('#imageMenu').classList.toggle('hidden');
}

function startImageSearch(type) {
  $('#imageMenu').classList.add('hidden');
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  if(type === 'camera') input.capture = 'environment';
  input.onchange = e => {
    let file = e.target.files[0];
    if (!file) return;
    $('#searchInput').value = file.name.replace(/\.[^/.]+$/, "");
    search();
  };
  input.click();
}

function setFilter(e, filter) {
  e.preventDefault();
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  currentFilter = filter;
  if(!currentQuery) return;
  searchBaobab(currentQuery);
}

async function searchBaobab(query) {
  currentQuery = query;
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Résultats pour <b>${query}</b> - Filtre: ${currentFilter}</p>`;
  let html = "";

  if(currentFilter === 'maps'){
    html = `<div class="maps-container"><iframe src="https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed"></iframe></div>`;
    $('#resultsList').innerHTML = html; return;
  }
  if(currentFilter === 'images'){
    html = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:16px 24px">`;
    for(let i=1; i<=12; i++){
      html += `<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden"><img src="https://source.unsplash.com/400x300/?${encodeURIComponent(query)}&sig=${i}" style="width:100%;height:150px;object-fit:cover"><p style="padding:8px;font-size:14px">${query} image ${i}</p></div>`;
    }
    html += `</div>`;
    $('#resultsList').innerHTML = html; return;
  }
  if(currentFilter === 'videos'){
    html = `<div style="padding:16px 24px">`;
    for(let i=1; i<=5; i++){
      html += `<div style="padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="openInBaobab('https://www.youtube.com/results?search_query=${encodeURIComponent(query)}', 'Vidéos ${query}')">
        <div style="font-size:18px;color:var(--link);font-weight:500">Vidéo ${i} : ${query}</div>
        <div style="color:#4ade80;font-size:14px">youtube.com</div>
      </div>`;
    }
    html += `</div>`;
    $('#resultsList').innerHTML = html; return;
  }
  if(currentFilter === 'news'){
    html = `<div style="padding:16px 24px">`;
    for(let i=1; i<=5; i++){
      html += `<div style="padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="openInBaobab('https://news.google.com/search?q=${encodeURIComponent(query)}', 'Actualités ${query}')">
        <div style="font-size:18px;color:var(--link);font-weight:500">Actu ${i} : ${query}</div>
        <div style="color:var(--muted);font-size:14px">Il y a ${i}h - Baobab News</div>
      </div>`;
    }
    html += `</div>`;
    $('#resultsList').innerHTML = html; return;
  }

  if(localDB[query.toLowerCase()]){
    const item = localDB[query.toLowerCase()];
    html += `<div style="padding:14px 24px;border-bottom:1px solid var(--border)"><div style="font-size:20px;color:var(--link);font-weight:500">${item.title}</div><div>${item.desc}</div></div>`;
  }
  for(let i=1; i<=10; i++){
    html += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="openInBaobab('https://fr.wikipedia.org/wiki/${encodeURIComponent(query)}', '${query}')">
      <div style="font-size:20px;color:var(--link);font-weight:500">Résultat ${i} : ${query}</div>
      <div style="color:#4ade80;font-size:14px">https://wikipedia.org</div>
    </div>`;
  }
  $('#resultsList').innerHTML += html;
}

async function search() {
  let q = $('#results').classList.contains('active')? $('#searchInput2').value : $('#searchInput').value;
  q = q.trim();
  if(!q) return;
  if($('#searchInput')) $('#searchInput').value = q;
  if($('#searchInput2')) $('#searchInput2').value = q;
  saveHistory(q);
  showPage('results');
  currentFilter = "all";
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn').classList.add('active');
  searchBaobab(q);
}

let recognition;
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("Micro non supporté.");
  recognition = new SpeechRecognition();
  recognition.lang = currentLang;
  recognition.onresult = (event) => { $('#searchInput').value = event.results[0][0].transcript; search(); };
  recognition.start();
}

function setSecurityMode(val) {
  currentSecurity = val;
  localStorage.setItem('baobabSecurity', val);
  if($('#strongBanner')) $('#strongBanner').classList.toggle('hidden', val!== 'strong');
}

function saveHistory(q) {
  if($('#saveActivity') &&!$('#saveActivity').checked) return;
  let h = JSON.parse(localStorage.getItem('hist') || '[]');
  localStorage.setItem('hist', JSON.stringify([q,...h.filter(x => x!== q)].slice(0,5)));
  loadHistory();
}

function loadHistory() {
  let h = JSON.parse(localStorage.getItem('hist') || '[]');
  if($('#historyList')) $('#historyList').innerHTML = h.map(i => `<div class="item" onclick="selectSuggest('${i.replace(/'/g, "\\'")}')">${i}</div>`).join('');
}

function clearHistory() {
  localStorage.removeItem('hist');
  loadHistory();
  alert('Historique effacé');
}

// ===== BLOC COMPTE COMPLET =====
let currentUser = JSON.parse(localStorage.getItem('baobab_current_user') || 'null');
let phoneValidated = false;

function checkAuth() {
  const loginForm = $('#loginForm');
  const accountInfo = $('#accountInfo');
  if(!loginForm) return;
  if(currentUser) {
    loginForm.style.display = 'none';
    accountInfo.style.display = 'block';
    $('#userEmail').innerText = currentUser.email;
    $('#userPhone').innerText = currentUser.phone || "";
  } else {
    loginForm.style.display = 'block';
    accountInfo.style.display = 'none';
  }
}

function validatePhone() {
  const phone = $('#phoneInput').value.trim();
  if(!phone) { showAccountMsg("Entre ton numéro de téléphone", "error"); return; }
  const phoneRegex = /^\+?[0-9\s\-()]{8,15}$/;
  if(!phoneRegex.test(phone)) { showAccountMsg("Format invalide. Ex: +221771234567", "error"); return; }
  phoneValidated = true;
  showAccountMsg("Numéro validé ✓ Tu peux créer ton compte", "success");
}

function createAccount() {
  const email = $('#emailInput').value.trim();
  const password = $('#passwordInput').value;
  const phone = $('#phoneInput').value.trim();
  if(!email ||!password ||!phone) { showAccountMsg("Remplis email, téléphone et mot de passe", "error"); return; }
  if(!phoneValidated) { showAccountMsg("Clique sur Valider d'abord", "error"); return; }
  if(password.length < 4) { showAccountMsg("Mot de passe trop court", "error"); return; }
  if(localStorage.getItem('baobab_user_' + email)) { showAccountMsg("Ce compte existe déjà", "error"); return; }
  const userData = {email: email, password: password, phone: phone, verified: false};
  localStorage.setItem('baobab_user_' + email, JSON.stringify(userData));
  phoneValidated = false;
  showAccountMsg("Compte créé! Connecte-toi", "success");
  $('#emailInput').value = ""; $('#passwordInput').value = ""; $('#phoneInput').value = "";
}

function login() {
  const email = $('#emailInput').value.trim();
  const password = $('#passwordInput').value;
  const savedUser = localStorage.getItem('baobab_user_' + email);
  if(!savedUser) { showAccountMsg("Compte introuvable", "error"); return; }
  const userData = JSON.parse(savedUser);
  if(userData.password === password) {
    currentUser = {email: email, phone: userData.phone};
    localStorage.setItem('baobab_current_user', JSON.stringify(currentUser));
    showAccountMsg("Connexion réussie", "success");
    checkAuth();
  } else {
    showAccountMsg("Email ou mot de passe incorrect", "error");
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('baobab_current_user');
  showAccountMsg("Déconnecté", "success");
  checkAuth();
}

function showAccountMsg(text, type) {
  const msg = $('#loginMessage');
  if(!msg) return;
  msg.innerText = text;
  msg.className = 'message ' + type;
  setTimeout(() => { msg.innerText = ""; }, 4000);
}
// ===== FIN BLOC COMPTE =====

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  if($('#langSelect')){
    $('#langSelect').value = currentLang;
    $('#langSelect').addEventListener('change', (e) => {
      currentLang = e.target.value;
      localStorage.setItem('baobabLang', currentLang);
    });
  }
  if($('#themeSelect')){
    $('#themeSelect').value = currentTheme;
    $('#themeSelect').addEventListener('change', (e) => {
      currentTheme = e.target.value;
      localStorage.setItem('baobabTheme', currentTheme);
      applyTheme();
    });
  }
  if($('#safeSearch')){
    $('#safeSearch').value = safeSearch;
    $('#safeSearch').addEventListener('change', (e) => {
      safeSearch = e.target.value;
      localStorage.setItem('baobabSafe', safeSearch);
    });
  }
  if($('#suggestionsToggle')){
    $('#suggestionsToggle').value = suggestionsOn;
    $('#suggestionsToggle').addEventListener('change', (e) => {
      suggestionsOn = e.target.value;
      localStorage.setItem('baobabSuggestions', suggestionsOn);
    });
  }
  document.addEventListener('click', (e) => {
    if($('#suggestions') &&!e.target.closest('.search-bar')) $('#suggestions').classList.add('hidden');
    if($('#imageMenu') &&!e.target.closest('#imageMenu') &&!e.target.closest('.icon-btn[title="Recherche par image"]')) $('#imageMenu').classList.add('hidden');
  });
  goHome();
});
