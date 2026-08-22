const $=s=>document.querySelector(s);
let lang=localStorage.getItem('baobabLang')||'fr-FR';
let theme=localStorage.getItem('baobabTheme')||'light';
let currentFilter="all";
let lastQuery="";

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
  await searchWeb(query);
}

// ===== 1. BAOBAB IA + WEB ENSEMBLE =====
async function searchWeb(query){
  let iaHtml = "";
  let resultsHtml = "";

  try {
    // 1. ON PREND LES DONNÉES D'ABORD
    let wikiData = null;
    let ddgData = null;

    // Wikipedia
    try{
      let wikiUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      let wikiRes = await fetch(wikiUrl);
      if(wikiRes.ok) wikiData = await wikiRes.json();
    }catch(e){}

    // DuckDuckGo Instant Answer
    try{
      let ddgUrl = `https://api.duckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      let ddgRes = await fetch(ddgUrl);
      if(ddgRes.ok) ddgData = await ddgRes.json();
    }catch(e){}

    // 2. BAOBAB IA GÉNÈRE UN RÉSUMÉ BASÉ SUR LES VRAIS RÉSULTATS
    let summary = "";
    if(wikiData && wikiData.extract){
      summary = wikiData.extract;
    } else if(ddgData && ddgData.AbstractText){
      summary = ddgData.AbstractText;
    } else if(ddgData && ddgData.RelatedTopics.length > 0){
      summary = ddgData.RelatedTopics.slice(0,3).map(t=>t.Text).join(" ");
    } else {
      summary = `Voici les résultats trouvés pour "${query}".`;
    }

    iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px">
      <div style="font-weight:700;color:var(--accent);margin-bottom:8px">Baobab IA</div>
      <div style="line-height:1.6">${summary}</div>
    </div>`;

    // 3. ON AFFICHE LES RÉSULTATS WEB EN DESSOUS
    if(wikiData && wikiData.extract){
      resultsHtml += `<div style="padding:14px 24px;border-bottom:1px solid var(--border)">
        <div style="font-size:18px;color:var(--link);font-weight:500;margin-bottom:4px">${wikiData.title}</div>
        <div style="color:#22c55e;font-size:13px;margin-bottom:4px">${wikiData.content_urls.desktop.page}</div>
        <div style="color:var(--text);font-size:14px">${wikiData.extract}</div>
      </div>`;
    }

    if(ddgData){
      ddgData.RelatedTopics.slice(0,8).forEach(t=>{
        if(t.Text && t.FirstURL){
          resultsHtml += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('${t.FirstURL}','_blank')">
            <div style="font-size:18px;color:var(--link);font-weight:500;margin-bottom:4px">${t.Text.split(' - ')[0]}</div>
            <div style="color:#22c55e;font-size:13px;margin-bottom:4px">${t.FirstURL}</div>
            <div style="color:var(--text);font-size:14px">${t.Text}</div>
          </div>`;
        }
      });
    }

  } catch(e){
    iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px">
      <div style="font-weight:700;color:var(--accent);margin-bottom:8px">Baobab IA</div>
      <div>Recherche en cours pour "${query}"...</div>
    </div>`;
  }

  if(resultsHtml === ""){
    resultsHtml = `<div style="padding:20px;text-align:center">
      <p style="margin-bottom:12px">Voir les résultats sur:</p>
      <a href="https://duckgo.com/?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:16px;display:block;margin-bottom:8px">DuckGo</a>
      <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:16px;display:block">Google</a>
    </div>`;
  }

  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Résultats pour <b>${query}</b></p>` + iaHtml + resultsHtml;
}

// ===== 2. IMAGES =====
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

// ===== 3. VIDEOS =====
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

// ===== 4. NEWS =====
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

// ===== 5. MAPS =====
function searchMaps(query, iaHtml){
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Maps pour <b>${query}</b></p>` + iaHtml +
  `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed" style="width:calc(100% - 48px);height:70vh;border:none;margin:0 24px;border-radius:8px"></iframe>`;
}

// ===== 6. HISTORIQUE + AUTRES =====
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
