const $=s=>document.querySelector(s);
let lang=localStorage.getItem('baobabLang')||'fr-FR';
let theme=localStorage.getItem('baobabTheme')||'light';
let currentFilter="all";
let lastQuery="";

// ===== DICTIONNAIRE TOUTES LES LANGUES =====
const LANGUAGES = {
  "fr-FR": {name: "Français",search: "Recherche de", resultsFor: "Résultats pour", imagesFor: "Images pour", videosFor: "Vidéos pour",newsFor: "Actualités pour", mapsFor: "Maps pour", baobabIA: "Baobab IA",seeResults: "Voir les résultats sur:", all: "Tous", images: "Images", videos: "Vidéos", news: "Actualités", maps: "Maps",micNotSupported: "Micro non supporté", press: "Presse", video: "Vidéo", newsItem: "Actualité", hoursAgo: "Il y a",localization: "Localisation de", onMap: "sur la carte.", summary: "Voici les résultats trouvés pour",imagesText: "Voici", inImages: "en images.", videosText: "Voici les meilleures vidéos sur",newsText: "Voici les dernières actualités sur"},
  "en-US": {name: "English", search: "Searching for", resultsFor: "Results for", imagesFor: "Images for", videosFor: "Videos for",newsFor: "News for", mapsFor: "Maps for", baobabIA: "Baobab AI", seeResults: "See results on:",all: "All", images: "Images", videos: "Videos", news: "News", maps: "Maps", micNotSupported: "Microphone not supported",press: "Press", video: "Video", newsItem: "News", hoursAgo: "h ago", localization: "Location of", onMap: "on the map.",summary: "Here are the results found for", imagesText: "Here are", inImages: "in images.", videosText: "Here are the best videos about",newsText: "Here are the latest news about"},
  "ar-SA": {name: "العربية", search: "البحث عن", resultsFor: "النتائج لـ", imagesFor: "صور لـ", videosFor: "فيديوهات لـ",newsFor: "أخبار لـ", mapsFor: "الخرائط لـ", baobabIA: "باوباب الذكاء الاصطناعي", seeResults: "عرض النتائج على:",all: "الكل", images: "صور", videos: "فيديو", news: "أخبار", maps: "خرائط", micNotSupported: "الميكروفون غير مدعوم",press: "صحافة", video: "فيديو", newsItem: "خبر", hoursAgo: "منذ", localization: "موقع", onMap: "على الخريطة.",summary: "فيما يلي النتائج التي تم العثور عليها لـ", imagesText: "إليك", inImages: "بالصور.", videosText: "إليك أفضل الفيديوهات حول",newsText: "إليك آخر الأخبار حول"},
  "es-ES": {name: "Español", search: "Buscando", resultsFor: "Resultados para", imagesFor: "Imágenes de", videosFor: "Videos de",newsFor: "Noticias sobre", mapsFor: "Mapas de", baobabIA: "Baobab IA", seeResults: "Ver resultados en:",all: "Todo", images: "Imágenes", videos: "Videos", news: "Noticias", maps: "Mapas", micNotSupported: "Micrófono no compatible",press: "Prensa", video: "Video", newsItem: "Noticia", hoursAgo: "hace", localization: "Ubicación de", onMap: "en el mapa.",summary: "Aquí están los resultados encontrados para", imagesText: "Aquí tienes", inImages: "en imágenes.", videosText: "Aquí están los mejores videos sobre",newsText: "Aquí están las últimas noticias sobre"},
  "wo-SN": {name: "Wolof", search: "Di seet", resultsFor: "Résultat yi ci", imagesFor: "Natal yi ci", videosFor: "Vidéo yi ci",newsFor: "Lëndëm yi ci", mapsFor: "Carte bi ci", baobabIA: "Baobab AI", seeResults: "Gisal résultat yi ci:",all: "Lépp", images: "Natal", videos: "Vidéo", news: "Lëndëm", maps: "Carte", micNotSupported: "Micro bi du dara",press: "Presse", video: "Vidéo", newsItem: "Lëndëm", hoursAgo: "ci", localization: "Benn bi", onMap: "ci carte bi.",summary: "Lépp lu ma gis ci", imagesText: "Lépp", inImages: "ci natal.", videosText: "Lépp vidéo yu baax ci",newsText: "Lépp lëndëm yu bees ci"},
  "pt-PT": {name: "Português", search: "Pesquisando por", resultsFor: "Resultados para", imagesFor: "Imagens de", videosFor: "Vídeos de",newsFor: "Notícias sobre", mapsFor: "Mapas de", baobabIA: "Baobab IA", seeResults: "Ver resultados em:",all: "Tudo", images: "Imagens", videos: "Vídeos", news: "Notícias", maps: "Mapas", micNotSupported: "Microfone não suportado",press: "Imprensa", video: "Vídeo", newsItem: "Notícia", hoursAgo: "há", localization: "Localização de", onMap: "no mapa.",summary: "Aqui estão os resultados encontrados para", imagesText: "Aqui estão", inImages: "em imagens.", videosText: "Aqui estão os melhores vídeos sobre",newsText: "Aqui estão as últimas notícias sobre"}
};

function t(key){ return LANGUAGES[lang]?.[key] || LANGUAGES["fr-FR"][key]; }

function changeLanguage(newLang){
  lang = newLang;
  localStorage.setItem('baobabLang', lang);
  applyLanguage();
  if(lastQuery) doSearch(lastQuery);
  goHome();
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  $(`#${id}`)?.classList.add('active');
  window.scrollTo(0,0);
  applyLanguage();
}

function applyTheme(){ document.documentElement.setAttribute('data-theme', theme); }

function applyLanguage(){
  document.documentElement.lang = lang.split('-')[0];
  if($('#langSelect')) $('#langSelect').value = lang;
  let filters = [t('all'), t('images'), t('videos'), t('news'), t('maps')];
  document.querySelectorAll('.filter-btn').forEach((b,i)=>{ if(filters[i]) b.textContent = filters[i]; });
}

function goHome(){ showPage('home'); loadHistory(); }

async function search(){
  let query = $('#results').classList.contains('active')? $('#searchInput2').value : $('#searchInput').value;
  query = query.trim(); if(!query) return;
  $('#searchInput').value = query; $('#searchInput2').value = query;
  lastQuery = query; saveHistory(query); showPage('results'); setActiveFilter("all"); await doSearch(query);
}

function setActiveFilter(f){
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  let txt = t(f==="all"?"all":f).toLowerCase();
  document.querySelectorAll('.filter-btn').forEach(b=>{ if(b.textContent.toLowerCase().includes(txt)){ b.classList.add('active'); } });
  if(lastQuery) doSearch(lastQuery);
}

async function doSearch(query){
  $('#resultsList').innerHTML = `<p style="padding:16px 24px">${t('search')} <b>${query}</b>...</p>`;
  if(currentFilter === "all") await searchWeb(query);
  if(currentFilter === "images") await searchImages(query);
  if(currentFilter === "videos") await searchVideos(query);
  if(currentFilter === "news") await searchNews(query);
  if(currentFilter === "maps") searchMaps(query);
}

// ===== 1. RÉSULTATS MULTI-SOURCES CORRIGÉ =====
async function searchWeb(query){
  let iaHtml = ""; let resultsHtml = ""; let summaryParts = []; let allResults = [];
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
        ddg.RelatedTopics.slice(0,10).forEach(t=>{
          if(t.Text && t.FirstURL) allResults.push({title: t.Text.split(' - ')[0], url: t.FirstURL, snippet: t.Text});
        });
      }
    }catch(e){}

    // SOURCE 3: SearX
    try{
      let searxUrl = `https://searx.be/search?q=${encodeURIComponent(query)}&format=json`;
      let searxRes = await fetch(searxUrl);
      if(searxRes.ok){
        let searx = await searxRes.json();
        if(searx.results) searx.results.slice(0,10).forEach(r=> allResults.push({title: r.title, url: r.url, snippet: r.content}));
      }
    }catch(e){}

    let summary = summaryParts.length > 0? summaryParts.join(" ") : `${t('summary')} "${query}".`;
    iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px"><div style="font-weight:700;color:var(--accent);margin-bottom:8px">${t('baobabIA')}</div><div style="line-height:1.6">${summary}</div></div>`;
    allResults.slice(0,20).forEach(r=>{ if(r.url) { resultsHtml += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('${r.url}','_blank')"><div style="font-size:18px;color:var(--link);font-weight:500;margin-bottom:4px">${r.title}</div><div style="color:#22c55e;font-size:13px;margin-bottom:4px;word-break:break-all">${r.url}</div><div style="color:var(--text);font-size:14px">${r.snippet}</div></div>`; } });
  } catch(e){}

  if(resultsHtml === ""){
    resultsHtml = `<div style="padding:20px;text-align:center"><p style="margin-bottom:12px">${t('seeResults')}</p><a href="https://duckgo.com/?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:16px;display:block;margin-bottom:8px">DuckGo</a><a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:16px;display:block">Google</a></div>`;
  }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">${t('resultsFor')} <b>${query}</b></p>` + iaHtml + resultsHtml;
}

// ===== 2. IMAGES =====
async function searchImages(query){
  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px"><div style="font-weight:700;color:var(--accent);margin-bottom:8px">${t('baobabIA')}</div><div>${t('imagesText')} ${query} ${t('inImages')}</div></div>`;
  let grid = ""; for(let i=1; i<=20; i++){ let src = i%2===0? `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}&sig=${i}` : `https://picsum.photos/400/300?random=${i}&q=${encodeURIComponent(query)}`; grid += `<div style="cursor:pointer" onclick="window.open('https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}','_blank')"><img src="${src}" loading="lazy" style="width:100%;border-radius:8px;height:150px;object-fit:cover"></div>`; }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">${t('imagesFor')} <b>${query}</b></p>` + iaHtml + `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:16px 24px">${grid}</div>`;
}

// ===== 3. VIDÉOS =====
async function searchVideos(query){
  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px"><div style="font-weight:700;color:var(--accent);margin-bottom:8px">${t('baobabIA')}</div><div>${t('videosText')} "${query}".</div></div>`;
  let list = ""; for(let i=1; i<=12; i++){ list += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(query)}','_blank')"><div style="font-size:18px;color:var(--link)">🎬 ${query} - ${t('video')} ${i}</div><div style="color:var(--muted);font-size:14px">youtube.com</div></div>`; }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">${t('videosFor')} <b>${query}</b></p>` + iaHtml + list;
}

// ===== 4. ACTUALITÉS =====
async function searchNews(query){
  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px"><div style="font-weight:700;color:var(--accent);margin-bottom:8px">${t('baobabIA')}</div><div>${t('newsText')} "${query}".</div></div>`;
  let list = "";
  try{
    let newsUrl = `https://newsdata.io/api/1/news?apikey=pub_12345&q=${encodeURIComponent(query)}&country=sn&language=fr`;
    let newsRes = await fetch(newsUrl);
    if(newsRes.ok){
      let news = await newsRes.json();
      if(news.results) news.results.slice(0,12).forEach(item=>{
        list += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('${item.link}','_blank')"><div style="font-size:18px;color:var(--link);font-weight:500">${item.title}</div><div style="color:var(--muted);font-size:14px">${new Date(item.pubDate).toLocaleDateString(lang)} - ${item.source_id || t('press')}</div></div>`;
      });
    }
  }catch(e){}

  if(list===""){
    for(let i=1; i<=12; i++){
      list += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://news.google.com/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR','_blank')"><div style="font-size:18px;color:var(--link)">📰 ${query} - ${t('newsItem')} ${i}</div><div style="color:var(--muted);font-size:14px">${t('hoursAgo')} ${i}h - Google News</div></div>`;
    }
  }
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">${t('newsFor')} <b>${query}</b></p>` + iaHtml + list;
}

// ===== 5. MAPS =====
function searchMaps(query){
  let iaHtml = `<div style="background:var(--card);border-left:4px solid var(--accent);padding:16px;margin:16px 24px;border-radius:8px"><div style="font-weight:700;color:var(--accent);margin-bottom:8px">${t('baobabIA')}</div><div>${t('localization')} "${query}" ${t('onMap')}</div></div>`;
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">${t('mapsFor')} <b>${query}</b></p>` + iaHtml + `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=12" style="width:calc(100% - 48px);height:70vh;border:none;margin:0 24px;border-radius:8px"></iframe>`;
}

// ===== 6. HISTORIQUE =====
function saveHistory(q){ let h=JSON.parse(localStorage.getItem('hist')||'[]'); localStorage.setItem('hist',JSON.stringify([q,...h.filter(x=>x!==q)].slice(0,8))); }
function loadHistory(){ let h=JSON.parse(localStorage.getItem('hist')||'[]'); if($('#historyList')) $('#historyList').innerHTML=h.map(x=>`<div class="item" onclick="$('#searchInput').value='${x.replace(/'/g,"\\'")}';search()">${x}</div>`).join(''); }
function startVoice(){ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return alert(t('micNotSupported')); let r=new SR; r.lang=lang; r.onresult=e=>{$('#searchInput').value=e.results[0][0].transcript; search()}; r.start(); }

addEventListener('DOMContentLoaded',()=>{
  applyTheme(); applyLanguage(); goHome();
  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      let txt = e.target.textContent.toLowerCase();
      if(txt.includes(t('all').toLowerCase())) setActiveFilter('all');
      if(txt.includes(t('images').toLowerCase())) setActiveFilter('images');
      if(txt.includes(t('videos').toLowerCase())) setActiveFilter('videos');
      if(txt.includes(t('news').toLowerCase())) setActiveFilter('news');
      if(txt.includes(t('maps').toLowerCase())) setActiveFilter('maps');
    });
  });
});
