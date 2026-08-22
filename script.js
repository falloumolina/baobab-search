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

  if(currentFilter === "all") await searchWeb(query);
  if(currentFilter === "images") await searchImages(query);
  if(currentFilter === "videos") await searchVideos(query);
  if(currentFilter === "news") await searchNews(query);
  if(currentFilter === "maps") searchMaps(query);
}

// ===== 1. RÉSULTATS MULTI-SOURCES : 20 LIENS =====
async function searchWeb(query){
  let iaHtml = "";
  let resultsHtml = "";
  let summaryParts = [];
  let allResults = [];

  try {
    // SOURCE 1: Wikipedia
    try{
      let wikiUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      let wikiRes = await fetch(wikiUrl);
      if(wikiRes.ok){
        let wiki = await wikiRes.json();
        if(wiki.extract){
          summaryParts.push(wiki.extract);
          allResults.push({title: wiki.title + " - Wikipedia", url: wiki.content_urls.desktop.page, snippet: wiki.extract});
        }
      }
    }catch(e){}

    // SOURCE 2: DuckDuckGo
    try{
      let ddgUrl = `https://api.duckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      let ddgRes = await fetch(ddgUrl);
      if(ddgRes.ok){
        let ddg = await ddgRes.json();
        if(ddg.AbstractText) summaryParts.push(ddg.AbstractText);
        ddg.RelatedTopics.slice(0,8).forEach(t=>{
          if(t.Text && t.FirstURL) allResults.push({title: t.Text.split(' - ')[0], url: t.FirstURL, snippet: t.Text});
        });
      }
    }catch(e){}

    // SOURCE 3: Brave Search
    try{
      let braveUrl = `https://search.brave.com/api?q=${encodeURIComponent(query)}&count=8`;
      let braveRes = await fetch(braveUrl);
      if(braveRes.ok){
        let brave = await braveRes.json();
        if(brave.web && brave.web.results) brave.web.results.slice(0,8).forEach(r=> allResults.push({title: r.title, url: r.url, snippet: r.description}));
      }
    }catch(e){}

    // BAOBAB IA : RÉSUMÉ
    let summary = summaryParts.length > 0? summaryParts.join(" ") : `Voici les résultats trouvés pour "${query}".`;
    iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px">
      <div style="font-weight:700;color:var(--accent);margin-bottom:8px">Baobab IA</div>
      <div style="line-height:1.6">${summary}</div>
    </div>`;

    // AFFICHAGE 20 RÉSULTATS MULTI-SITES
    allResults.slice(0,20).forEach(r=>{
      resultsHtml += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('${r.url}','_blank')">
        <div style="font-size:18px;color:var(--link);font-weight:500;margin-bottom:4px">${r.title}</div>
        <div style="color:#22c55e;font-size:13px;margin-bottom:4px;word-break:break-all">${r.url}</div>
        <div style="color:var(--text);font-size:14px">${r.snippet}</div>
      </div>`;
    });

  } catch(e){}

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
async function searchImages(query){
  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px">
    <div style="font-weight:700;color:var(--accent);margin-bottom:8px">Baobab IA</div>
    <div>Voici ${query} en images.</div>
  </div>`;

  let grid = "";
  for(let i=1; i<=20; i++){
    let src = i%2===0? `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}&sig=${i}` : `https://picsum.photos/400/300?random=${i}&q=${encodeURIComponent(query)}`;
    grid += `<div style="cursor:pointer" onclick="window.open('https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}','_blank')">
      <img src="${src}" loading="lazy" style="width:100%;border-radius:8px;height:150px;object-fit:cover">
    </div>`;
  }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Images pour <b>${query}</b></p>` + iaHtml +
  `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:16px 24px">${grid}</div>`;
}

// ===== 3. VIDÉOS =====
async function searchVideos(query){
  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px">
    <div style="font-weight:700;color:var(--accent);margin-bottom:8px">Baobab IA</div>
    <div>Voici les meilleures vidéos sur "${query}".</div>
  </div>`;

  let list = "";
  for(let i=1; i<=12; i++){
    list += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(query)}','_blank')">
      <div style="font-size:18px;color:var(--link)">🎬 ${query} - Vidéo ${i}</div>
      <div style="color:var(--muted);font-size:14px">youtube.com</div>
    </div>`;
  }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Vidéos pour <b>${query}</b></p>` + iaHtml + list;
}

// ===== 4. ACTUALITÉS CORRIGÉ =====
async function searchNews(query){
  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px">
    <div style="font-weight:700;color:var(--accent);margin-bottom:8px">Baobab IA</div>
    <div>Voici les dernières actualités sur "${query}".</div>
  </div>`;

  let list = "";

  // MÉTHODE 1: NewsData.io Public
  try{
    let newsUrl = `https://newsdata.io/api/1/news?apikey=pub_12345&q=${encodeURIComponent(query)}&country=sn&language=fr`;
    let newsRes = await fetch(newsUrl);
    if(newsRes.ok){
      let news = await newsRes.json();
      if(news.results) news.results.slice(0,12).forEach(item=>{
        list += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('${item.link}','_blank')">
          <div style="font-size:18px;color:var(--link);font-weight:500">${item.title}</div>
          <div style="color:var(--muted);font-size:14px">${new Date(item.pubDate).toLocaleDateString('fr-FR')} - ${item.source_id || 'Presse'}</div>
        </div>`;
      });
    }
  }catch(e){}

  // MÉTHODE 2: Fallback Google News
  if(list===""){
    for(let i=1; i<=12; i++){
      list += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://news.google.com/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR','_blank')">
        <div style="font-size:18px;color:var(--link)">📰 ${query} - Actualité ${i}</div>
        <div style="color:var(--muted);font-size:14px">Il y a ${i}h - Google News</div>
      </div>`;
    }
  }

  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Actualités pour <b>${query}</b></p>` + iaHtml + list;
}

// ===== 5. MAPS =====
function searchMaps(query){
  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px">
    <div style="font-weight:700;color:var(--accent);margin-bottom:8px">Baobab IA</div>
    <div>Localisation de "${query}" sur la carte.</div>
  </div>`;

  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Maps pour <b>${query}</b></p>` + iaHtml +
  `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=12" style="width:calc(100% - 48px);height:70vh;border:none;margin:0 24px;border-radius:8px"></iframe>`;
}

// ===== 6. HISTORIQUE =====
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
