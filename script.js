const $=s=>document.querySelector(s);
let lang=localStorage.getItem('baobabLang')||'fr-FR';
let theme=localStorage.getItem('baobabTheme')||'light';
let currentFilter="all";
let lastQuery="";

// ===== 1. BAOBAB IA INTELLIGENT ET PROFESSIONNEL =====
function baobabIA(q){
  if(!q) return "";
  const query = q.toLowerCase().trim();

  // Base de connaissances
  const kb = {
    "louga": "Louga est une région du nord du Sénégal. Sa capitale régionale est Louga. L'économie repose principalement sur l'agriculture et l'élevage. La population est estimée à environ 300 000 habitants.",
    "dakar": "Dakar est la capitale du Sénégal et sa plus grande ville. C'est un centre économique et portuaire majeur en Afrique de l'Ouest avec plus d'1 million d'habitants.",
    "sénégal": "Le Sénégal est un pays d'Afrique de l'Ouest. Capitale: Dakar. Monnaie: Franc CFA. Langues officielles: Français et Wolof. Président actuel: Bassirou Diomaye Faye.",
    "messi": "Lionel Messi est un footballeur professionnel argentin. 8 fois Ballon d'Or. Il joue actuellement à l'Inter Miami. Considéré comme l'un des meilleurs joueurs de l'histoire.",
    "ronaldo": "Cristiano Ronaldo est un footballeur professionnel portugais. 5 fois Ballon d'Or. Il joue actuellement à Al-Nassr en Arabie Saoudite.",
    "bonjour": "Bonjour. Comment puis-je vous aider aujourd'hui?",
    "salut": "Salut. Posez-moi votre question et je vous répondrai."
  };

  // Vérifier si on a la réponse dans la base
  for(let key in kb){
    if(query.includes(key)) return kb[key];
  }

  // Réponse par défaut intelligente
  if(query.includes("qui est")) return `Voici ce que je sais sur ${q.replace("qui est","").trim()}. Pour plus de détails, consultez les résultats du web ci-dessous.`;
  if(query.includes("c'est quoi")) return `${q.replace("c'est quoi","").trim()} : Consultez les définitions et explications dans les résultats ci-dessous.`;
  if(query.includes("comment")) return `Pour ${q}, voici des guides et tutoriels dans les résultats ci-dessous.`;
  if(query.includes("météo")) return `Pour connaître la météo, utilisez l'onglet Maps et entrez le nom de votre ville.`;

  return `Concernant "${q}", voici les informations les plus pertinentes trouvées sur le web.`;
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  $(`#${id}`)?.classList.add('active');
  window.scrollTo(0,0);
}

function applyTheme(){
  document.documentElement.setAttribute('data-theme', theme);
}

function goHome(){
  showPage('home');
  loadHistory();
}

async function search(){
  let query = $('#results').classList.contains('active')? $('#searchInput2').value : $('#searchInput').value;
  query = query.trim();
  if(!query) return;
  $('#searchInput').value = query;
  $('#searchInput2').value = query;
  lastQuery = query;
  saveHistory(query);
  showPage('results');
  setActiveFilter("all");
  await doSearch(query);
}

function setActiveFilter(f){
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.filter-btn').forEach(b=>{
    if(b.textContent.toLowerCase().includes(f) || (f==="all" && b.textContent.toLowerCase().includes("tous"))){
      b.classList.add('active');
    }
  });
  if(lastQuery) doSearch(lastQuery);
}

async function doSearch(query){
  $('#resultsList').innerHTML = `<p style="padding:16px 24px">Recherche de <b>${query}</b>...</p>`;

  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px">
    <div style="font-weight:700;color:var(--accent);margin-bottom:8px">Baobab IA</div>
    <div style="line-height:1.6">${baobabIA(query)}</div>
  </div>`;

  if(currentFilter === "all") await searchWeb(query, iaHtml);
  if(currentFilter === "images") searchImages(query, iaHtml);
  if(currentFilter === "videos") searchVideos(query, iaHtml);
  if(currentFilter === "news") searchNews(query, iaHtml);
  if(currentFilter === "maps") searchMaps(query, iaHtml);
}

// ===== 2. RECHERCHE WEB VIA SEARXNG PUBLIC - ÇA DÉBLOQUE =====
async function searchWeb(query, iaHtml){
  const searxInstances = [
    `https://search.fossberlin.de/search?q=${encodeURIComponent(query)}&format=json`,
    `https://searx.be/search?q=${encodeURIComponent(query)}&format=json`,
    `https://searx.tiekoetter.com/search?q=${encodeURIComponent(query)}&format=json`
  ];

  for(let url of searxInstances){
    try{
      let res = await fetch(url);
      if(!res.ok) continue;
      let data = await res.json();

      let resultsHtml = "";
      if(data.results && data.results.length > 0){
        data.results.slice(0,10).forEach(r=>{
          resultsHtml += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('${r.url}','_blank')">
            <div style="font-size:18px;color:var(--link);font-weight:500;margin-bottom:4px">${r.title}</div>
            <div style="color:#22c55e;font-size:13px;margin-bottom:4px;word-break:break-all">${r.url}</div>
            <div style="color:var(--text);font-size:14px">${r.content || ""}</div>
          </div>`;
        });
      }

      if(resultsHtml!== ""){
        $('#resultsList').innerHTML = `<p style="padding:12px 24px">Résultats pour <b>${query}</b></p>` + iaHtml + resultsHtml;
        return;
      }
    }catch(e){ console.log("Searx failed:", url); continue; }
  }

  // Fallback final
  $('#resultsList').innerHTML = iaHtml + `<div style="padding:20px;text-align:center">
    <p style="margin-bottom:12px">Aucun résultat direct. Voir sur:</p>
    <a href="https://duckgo.com/?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:16px;display:block;margin-bottom:8px">DuckGo</a>
    <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:16px;display:block">Google</a>
  </div>`;
}

// ===== 3. IMAGES =====
function searchImages(query, iaHtml){
  let grid = "";
  for(let i=1; i<=12; i++){
    grid += `<div style="cursor:pointer" onclick="window.open('https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}','_blank')">
      <img src="https://source.unsplash.com/400x300/?${encodeURIComponent(query)}&sig=${i}" style="width:100%;border-radius:8px;height:150px;object-fit:cover">
    </div>`;
  }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Images pour <b>${query}</b></p>` + iaHtml +
  `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:16px 24px">${grid}</div>`;
}

// ===== 4. VIDEOS =====
function searchVideos(query, iaHtml){
  let list = "";
  for(let i=1; i<=8; i++){
    list += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(query)}','_blank')">
      <div style="font-size:18px;color:var(--link)">Video: ${query} #${i}</div>
      <div style="color:var(--muted);font-size:14px">youtube.com</div>
    </div>`;
  }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Vidéos pour <b>${query}</b></p>` + iaHtml + list;
}

// ===== 5. NEWS =====
function searchNews(query, iaHtml){
  let list = "";
  for(let i=1; i<=8; i++){
    list += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://news.google.com/search?q=${encodeURIComponent(query)}&hl=fr','_blank')">
      <div style="font-size:18px;color:var(--link)">Actu: ${query} #${i}</div>
      <div style="color:var(--muted);font-size:14px">Il y a ${i}h - Google News</div>
    </div>`;
  }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Actualités pour <b>${query}</b></p>` + iaHtml + list;
}

// ===== 6. MAPS =====
function searchMaps(query, iaHtml){
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Maps pour <b>${query}</b></p>` + iaHtml +
  `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed" style="width:calc(100% - 48px);height:70vh;border:none;margin:0 24px;border-radius:8px"></iframe>`;
}

// ===== 7. HISTORIQUE + AUTRES =====
function saveHistory(q){
  let h=JSON.parse(localStorage.getItem('hist')||'[]');
  localStorage.setItem('hist',JSON.stringify([q,...h.filter(x=>x!==q)].slice(0,8)));
}

function loadHistory(){
  let h=JSON.parse(localStorage.getItem('hist')||'[]');
  if($('#historyList')) $('#historyList').innerHTML=h.map(x=>`<div class="item" onclick="$('#searchInput').value='${x.replace(/'/g,"\\'")}';search()">${x}</div>`).join('');
}

function startVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return alert("Micro non supporté");
  let r=new SR; r.lang=lang;
  r.onresult=e=>{$('#searchInput').value=e.results[0][0].transcript; search()};
  r.start();
}

addEventListener('DOMContentLoaded',()=>{
  applyTheme();
  goHome();
  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      let txt = e.target.textContent.toLowerCase();
      if(txt.includes('tous')) setActiveFilter('all');
      if(txt.includes('image')) setActiveFilter('images');
      if(txt.includes('vidéo')) setActiveFilter('videos');
      if(txt.includes('actualité')) setActiveFilter('news');
      if(txt.includes('map')) setActiveFilter('maps');
    });
  });
});
