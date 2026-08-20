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
  applyTranslations();
}

function openInBaobab(url, title) {
  showPage('viewer');
  $('#viewerFrame').src = url;
  $('#viewerTitle').textContent = title;
}

const localDB = {
  "senegal": {title: "Sénégal", desc: "Le Sénégal est un pays d'Afrique de l'Ouest. Capitale: Dakar. Langues: Français, Wolof."},
  "messi": {title: "Lionel Messi", desc: "Footballeur argentin, 8 fois Ballon d'Or. Joue à l'Inter Miami."},
  "baobab": {title: "Baobab", desc: "Arbre emblématique d'Afrique. Peut vivre 1000 ans. Appelé l'arbre de vie."},
  "google": {title: "Google", desc: "Moteur de recherche américain créé en 1998 par Larry Page et Sergey Brin."},
  "literature": {title: "Littérature", desc: "Ensemble des œuvres écrites ou orales auxquelles on reconnaît une valeur esthétique."}
};

const translations = {
  'fr-FR': { searchPlaceholder: "Recher sur Baobab...", settings: "Paramètres", general: "Général", langSearch: "Langue de recherche:", security: "Sécurité", protectionMode: "Mode de protection:", saveActivity: "Enregistrer l'activité", clearHistory: "Effacer l'historique récent", back: "Retour", recent: "Historique récent", speakNow: "Parlez maintenant...", resultsFor: "Résultats pour", all: "Tous", images: "Images", videos: "Vidéos", news: "Actualités", maps: "Maps" },
  'en-US': { searchPlaceholder: "Search on Baobab...", settings: "Settings", general: "General", langSearch: "Search language:", security: "Security", protectionMode: "Protection mode:", saveActivity: "Save activity", clearHistory: "Clear recent history", back: "Back", recent: "Recent", speakNow: "Speak now...", resultsFor: "Results for", all: "All", images: "Images", videos: "Videos", news: "News", maps: "Maps" }
};

function applyTranslations() {
  const t = translations[currentLang] || translations['fr-FR'];
  document.documentElement.lang = currentLang.split('-')[0];
  if($('#searchInput')) $('#searchInput').placeholder = t.searchPlaceholder;
  if($('#searchInput2')) $('#searchInput2').placeholder = t.searchPlaceholder;
  document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if(t[key]) el.textContent = t[key]; });
}

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
  const t = translations[currentLang] || translations['fr-FR'];
  currentQuery = query;
  $('#resultsList').innerHTML = "";

  // 1. MAPS
  if(currentFilter === 'maps') {
    $('#resultsList').innerHTML = `
      <div class="maps-container">
        <iframe
          src="https://www.google.com/maps?q=${encodeURIComponent(query)}&z=13&output=embed"
          allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    `;
    return;
  }

  // 2. IMAGES - Wikimedia Commons
  if(currentFilter === 'images') {
    $('#resultsList').innerHTML = `<p style="padding:12px 24px;color:#aaa">${t.resultsFor} <b>${query}</b></p><div id="imagesGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:0 24px 24px 24px"></div>`;
    const grid = $('#imagesGrid');
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=24&prop=imageinfo&iiprop=url|thumbmime&iiurlwidth=300&format=json&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      let html = "";
      if(data.query && data.query.pages){
        Object.values(data.query.pages).forEach(page => {
          if(page.imageinfo && page.imageinfo[0]){
            const img = page.imageinfo[0];
            html += `<div style="cursor:pointer" onclick="window.open('${img.url}', '_blank')">
              <img src="${img.thumburl}" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:8px;border:1px solid var(--border)">
              <div style="font-size:12px;color:var(--muted);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${page.title.replace('File:', '')}</div>
            </div>`;
          }
        });
      }
      grid.innerHTML = html || `<p style="padding:20px;color:var(--muted)">Aucune image trouvée pour "${query}"</p>`;
    } catch(e){ grid.innerHTML = `<p style="padding:20px;color:#D93025">Erreur de chargement des images</p>`; }
    return;
  }

  // 3. VIDEOS - YouTube
  if(currentFilter === 'videos') {
    $('#resultsList').innerHTML = `<p style="padding:12px 24px;color:#aaa">${t.resultsFor} <b>${query}</b></p><div id="videosGrid" style="padding:0 24px 24px 24px"></div>`;
    const grid = $('#videosGrid');
    try {
      let html = "";
      for(let i=1; i<=12; i++){
        html += `<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(query)}', '_blank')">
          <img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg" style="width:160px;height:90px;border-radius:8px;object-fit:cover">
          <div>
            <div style="font-size:16px;color:var(--link);font-weight:500;margin-bottom:4px">Vidéo sur "${query}" ${i}</div>
            <div style="color:var(--muted);font-size:13px">YouTube • Voir les résultats</div>
          </div>
        </div>`;
      }
      grid.innerHTML = html;
    } catch(e){ grid.innerHTML = `<p style="padding:20px;color:#D93025">Erreur de chargement des vidéos</p>`; }
    return;
  }

  // 4. ACTUALITES - Google News RSS
  if(currentFilter === 'news') {
    $('#resultsList').innerHTML = `<p style="padding:12px 24px;color:#aaa">${t.resultsFor} <b>${query}</b></p><div id="newsGrid"></div>`;
    const grid = $('#newsGrid');
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
      const data = await res.json();
      let html = "";
      if(data.items && data.items.length > 0){
        data.items.slice(0,15).forEach(item => {
          html += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('${item.link}', '_blank')">
            <div style="font-size:18px;color:var(--link);font-weight:500;line-height:1.4">${item.title}</div>
            <div style="color:var(--muted);font-size:12px;margin:6px 0">${new Date(item.pubDate).toLocaleDateString('fr-FR')} - ${item.author || 'Google News'}</div>
            <div style="color:var(--text);font-size:14px;line-height:1.5">${item.description.replace(/<[^>]*>/g, '').substring(0,220)}...</div>
          </div>`;
        });
      } else {
        html = `<p style="padding:20px;color:var(--muted)">Aucune actualité trouvée pour "${query}"</p>`;
      }
      grid.innerHTML = html;
    } catch(e){ grid.innerHTML = `<p style="padding:20px;color:#D93025">Erreur de chargement des actualités</p>`; }
    return;
  }

  // 5. TOUS - Comportement normal
  let html = "";
  let allResults = [];
  let q = query.toLowerCase();
  let aiContent = "";

  if(localDB[q]){
    const item = localDB[q];
    aiContent += `<div class="ai-card"><div class="ai-header">✨ Aperçu Baobab IA</div><div>${item.desc}</div></div>`;
    allResults.push({title: item.title, url: "#", content: item.desc, source: "Base Baobab"});
  }

  try {
    const wiki = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    if(wiki.ok &&!localDB[q]){
      const w = await wiki.json();
      aiContent += `<div class="ai-card"><div class="ai-header">✨ Aperçu Baobab IA</div><div>${w.extract}</div></div>`;
    }
  }catch(e){}

  html += `<p style="padding:12px 24px;color:#aaa">${t.resultsFor} <b>${query}</b></p>`;
  if(aiContent!== "") { html = aiContent + html; }

  if(allResults.length === 0){
    for(let i=1; i<=10; i++){
      allResults.push({
        title: `Résultat ${i} : ${query}`,
        url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        content: `Cliquez pour lire l'article "${query}" sur Baobab.`,
        source: "Wikipedia"
      });
    }
  }

  allResults.forEach(item => {
    html += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="openInBaobab('${item.url}', '${item.title.replace(/'/g, "\\'")}')">
      <div style="font-size:20px;color:var(--link);font-weight:500">${item.title}</div>
      <div style="color:#4ade80;font-size:14px;margin:2px 0">${item.url}</div>
      <div style="color:var(--text);font-size:14px;line-height:1.58">${item.content}</div>
      <div style="color:var(--muted);font-size:12px;margin-top:4px">Source: ${item.source}</div>
    </div>`;
  });

  html += `<p style="padding:12px 24px;color:#aaa;font-size:13px">${allResults.length} résultats trouvés sur Baobab</p>`;
  $('#resultsList').innerHTML = html;
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
  if (!SpeechRecognition) return alert("Micro non supporté. Utilise Chrome.");
  const t = translations[currentLang] || translations['fr-FR'];
  recognition = new SpeechRecognition();
  recognition.lang = currentLang;
  recognition.onstart = () => { $('#searchInput').placeholder = t.speakNow; };
  recognition.onresult = (event) => { $('#searchInput').value = event.results[0][0].transcript; search(); };
  recognition.onend = () => { $('#searchInput').placeholder = t.searchPlaceholder; };
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

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  if($('#langSelect')){
    $('#langSelect').value = currentLang;
    applyTranslations();
    $('#langSelect').addEventListener('change', (e) => {
      currentLang = e.target.value;
      localStorage.setItem('baobabLang', currentLang);
      applyTranslations();
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
  if($('#securityMode')) $('#securityMode').value = currentSecurity;

  document.addEventListener('click', (e) => {
    if($('#suggestions') &&!e.target.closest('.search-bar')) $('#suggestions').classList.add('hidden');
    if($('#imageMenu') &&!e.target.closest('#imageMenu') &&!e.target.closest('.icon-btn[title="Recherche par image"]')) $('#imageMenu').classList.add('hidden');
  });

  goHome();
})
