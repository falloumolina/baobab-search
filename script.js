const $=s=>document.querySelector(s);
let lang=localStorage.getItem('baobabLang')||'fr-FR';
let theme=localStorage.getItem('baobabTheme')||'light';
let currentFilter="all";
let lastQuery="";

// ===== 1. BAOBAB IA =====
function baobabIA(q){
  if(!q) return "";
  q=q.toLowerCase().trim();
  if(q.includes("bonjour") || q.includes("salut")) return "Salut! Je suis Baobab IA. Ton assistant sénégalais. Pose-moi une question.";
  if(q.includes("louga")) return "Louga : Région du nord du Sénégal. Capitale régionale: Louga. Économie: Agriculture, élevage. Pop: environ 300 000 habitants.";
  if(q.includes("dakar")) return "Dakar : Capitale du Sénégal. Plus grande ville. Port important. Pop: plus de 1 million.";
  if(q.includes("sénégal")) return "Sénégal : Pays d'Afrique de l'Ouest. Capitale: Dakar. Monnaie: Franc CFA. Président: Bassirou Diomaye Faye.";
  if(q.includes("météo")) return "Pour voir la météo, va dans l'onglet Maps et tape le nom de ta ville.";
  return `Baobab IA: J'ai analysé "${q}". Les résultats du web sont affichés ci-dessous.`;
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

// ===== 2. RECHERCHE WEB GRATUITE - CORRIGÉE =====
async function searchWeb(query, iaHtml){
  const proxies = [
    `https://api.codetabs.com/v1/proxy/?quest=`,
    `https://corsproxy.io/?`,
    `https://api.allorigins.win/raw?url=`
  ];
  const targetUrl = `https://html.duckgo.com/html/?q=${encodeURIComponent(query)}`;

  for(let proxy of proxies){
    try{
      let res = await fetch(proxy + encodeURIComponent(targetUrl));
      if(!res.ok) continue;
      let html = await res.text();

      let parser = new DOMParser();
      let doc = parser.parseFromString(html, "text/html");
      let results = doc.querySelectorAll('.result,.web-result');

      let resultsHtml = "";
      results.forEach((r,i)=>{
        if(i<10){
          let titleEl = r.querySelector('.result__a,.result__title');
          let snippetEl = r.querySelector('.result__snippet,.result__abstract');
          let linkEl = r.querySelector('.result__url,.result__a');
          if(titleEl && linkEl){
            let title = titleEl.innerText;
            let link = linkEl.href || linkEl.textContent;
            let snippet = snippetEl? snippetEl.innerText : "Clique pour voir le site";
            resultsHtml += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('${link}','_blank')">
              <div style="font-size:18px;color:var(--link);font-weight:500;margin-bottom:4px">${title}</div>
              <div style="color:#22c55e;font-size:13px;margin-bottom:4px;word-break:break-all">${link}</div>
              <div style="color:var(--text);font-size:14px">${snippet}</div>
            </div>`;
          }
        }
      });

      if(resultsHtml!== ""){
        $('#resultsList').innerHTML = `<p style="padding:12px 24px">Résultats pour <b>${query}</b></p>` + iaHtml + resultsHtml;
        return;
      }
    }catch(e){ console.log("Proxy failed:", proxy); continue; }
  }

  // Fallback si tous les proxies échouent
  $('#resultsList').innerHTML = iaHtml + `<div style="padding:20px;text-align:center">
    <p style="margin-bottom:12px">Clique pour voir les résultats:</p>
    <a href="https://duckgo.com/?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:16px;display:block;margin-bottom:8px">Recher sur DuckDuckGo</a>
    <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:16px;display:block">Recher sur Google</a>
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
