const $=s=>document.querySelector(s);let a=localStorage.getItem('baobabLang')||'fr-FR',b=localStorage.getItem('baobabSecurity')||'standard',c=localStorage.getItem('baobabTheme')||'light',d=localStorage.getItem('baobabSafe')||'on',e=localStorage.getItem('baobabSuggestions')||'on',f="",g="all";

function showPage(h){document.querySelectorAll('.page').forEach(i=>i.classList.remove('active'));$(`#${h}`).classList.add('active');scrollTo(0,0)}
function openInBaobab(h,i){showPage('viewer');$('#viewerFrame').src=h;$('#viewerTitle').textContent=i}
function applyTheme(){document.documentElement.setAttribute('data-theme',c==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):c)}
function goHome(){showPage('home');loadHistory();$('#langSelect')&&($('#langSelect').value=a);$('#securityMode')&&($('#securityMode').value=b);$('#themeSelect')&&($('#themeSelect').value=c);$('#safeSearch')&&($('#safeSearch').value=d);$('#suggestionsToggle')&&($('#suggestionsToggle').value=e);checkAuth()}
function showSuggestions(){e==='off'||($('#suggestions').classList.remove('hidden'),loadHistory())}
function selectSuggest(h){$('#searchInput').value=h;$('#suggestions').classList.add('hidden');search()}
function toggleImageMenu(h){h.stopPropagation();$('#imageMenu').classList.toggle('hidden')}
function startImageSearch(h){$('#imageMenu').classList.add('hidden');let i=document.createElement('input');i.type='file';i.accept='image/*';'camera'===h&&(i.capture='environment');i.onchange=j=>{let k=j.target.files[0];k&&($('#searchInput').value=k.name.replace(/\.[^/.]+$/,""),search())};i.click()}
function setFilter(h,i){h.preventDefault();document.querySelectorAll('.filter-btn').forEach(j=>j.classList.remove('active'));h.target.classList.add('active');g=i;f&&searchBaobab(f)}

// ===== BAOBAB IA =====
function baobabIA(question){
  let q = question.toLowerCase();
  if(q.includes("bonjour") || q.includes("salut")) return "Bonjour! Je suis Baobab IA 🌳 Pose moi n'importe quelle question.";
  if(q.includes("météo") || q.includes("temps")) return `Pour la météo de ${question}, va dans l'onglet Maps.`;
  if(q.includes("sénégal")) return "Le Sénégal 🇸🇳 : Pays d'Afrique de l'Ouest. Capitale: Dakar. Monnaie: Franc CFA. Président: Bassirou Diomaye Faye.";
  if(q.includes("louga")) return "Louga : Région du nord du Sénégal. Connue pour son élevage et son agriculture. Capitale régionale: Louga.";
  return `Baobab IA a analysé "${question}". Voici les meilleurs résultats du web en dessous.`;
}

async function searchBaobab(query){
  f=query;
  $('#resultsList').innerHTML = `<div style="text-align:center;padding:20px">Recherche en cours...</div>`;

  let iaResponse = baobabIA(query);
  let html = `<div style="background:var(--card);border-left:4px solid var(--accent);border-radius:8px;padding:16px;margin:16px 24px">
    <div style="font-size:16px;font-weight:700;color:var(--accent)">🌳 Baobab IA</div>
    <div style="margin-top:8px;line-height:1.6">${iaResponse}</div>
  </div>`;

  // ASTUCE: On utilise textise dot iitty pour éviter CORS
  let url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://duckgo.com/html/?q=${query}`)}`;

  try{
    let res = await fetch(url);
    let text = await res.text();

    // On extrait les résultats de DuckDuckGo
    let parser = new DOMParser();
    let doc = parser.parseFromString(text, "text/html");
    let results = doc.querySelectorAll('.result');

    if(results.length === 0){
      html += `<div style="padding:20px;text-align:center"><a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link)">Voir sur Google</a></div>`;
    }else{
      results.forEach((r,i)=>{
        if(i<10){
          let title = r.querySelector('.result__a')?.innerText || "Résultat";
          let link = r.querySelector('.result__a')?.href || "#";
          let snippet = r.querySelector('.result__snippet')?.innerText || "";
          html += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="openInBaobab('${link}','${title}')">
            <div style="font-size:18px;color:var(--link);font-weight:500">${title}</div>
            <div style="color:#4ade80;font-size:14px">${link}</div>
            <div style="margin-top:4px">${snippet}</div>
          </div>`;
        }
      });
    }
    $('#resultsList').innerHTML = `<p style="padding:12px 24px">Résultats pour <b>${query}</b></p>` + html;

  }catch(err){
    // Fallback si ça bloque
    $('#resultsList').innerHTML = html + `<div style="padding:20px;text-align:center">
      <p>Mode hors-ligne activé</p>
      <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:18px">Rechercher "${query}" sur Google</a>
    </div>`;
  }
}

function searchImages(query){
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Images pour <b>${query}</b></p>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:16px">
    ${[1,2,3,4,5,6,7,8,9].map(i=>`<img src="https://source.unsplash.com/300x300/?${encodeURIComponent(query)}&sig=${i}" style="width:100%;border-radius:8px;cursor:pointer" onclick="window.open('https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}','_blank')">`).join('')}
  </div>`;
}

function searchVideos(query){
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Vidéos pour <b>${query}</b></p>
  <div style="padding:16px">
    ${[1,2,3,4,5].map(i=>`<div style="padding:12px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(query)}','_blank')">
      <div style="font-size:16px;color:var(--link)">Vidéo ${i} : ${query}</div>
      <div style="color:var(--muted);font-size:14px">youtube.com</div>
    </div>`).join('')}
  </div>`;
}

function searchNews(query){
  $('#resultsList').innerHTML = `<p style="padding:12px 24px">Actualités pour <b>${query}</b></p>
  <div style="padding:16px">
    ${[1,2,3,4,5].map(i=>`<div style="padding:12px;border-bottom:1px solid var(--border);cursor:pointer" onclick="window.open('https://news.google.com/search?q=${encodeURIComponent(query)}','_blank')">
      <div style="font-size:16px;color:var(--link)">Actu ${i} : ${query}</div>
      <div style="color:var(--muted);font-size:14px">Il y a ${i}h - Google News</div>
    </div>`).join('')}
  </div>`;
}

async function search(){
  let h=$('#results').classList.contains('active')?$('#searchInput2').value:$('#searchInput').value;h=h.trim();if(!h)return;
  $('#searchInput')&&($('#searchInput').value=h);$('#searchInput2')&&($('#searchInput2').value=h);saveHistory(h);showPage('results');
  g="all";document.querySelectorAll('.filter-btn').forEach(i=>i.classList.remove('active'));document.querySelector('.filter-btn').classList.add('active');

  if(g==="all") searchBaobab(h);
  if(g==="images") searchImages(h);
  if(g==="videos") searchVideos(h);
  if(g==="news") searchNews(h);
  if(g==="maps") $('#resultsList').innerHTML = `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(h)}&output=embed" style="width:100%;height:80vh;border:none"></iframe>`;
}

document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click', e=>{
    let filter = e.target.innerText.toLowerCase();
    if(filter.includes('image')) g='images';
    if(filter.includes('vidéo')) g='videos';
    if(filter.includes('actualité')) g='news';
    if(filter.includes('map')) g='maps';
    if(filter.includes('tous')) g='all';
    setFilter(e,g);
  });
});

let recognition;function startVoice(){const h=window.SpeechRecognition||window.webkitSpeechRecognition;h?(recognition=new h,recognition.lang=a,recognition.onresult=i=>{$('#searchInput').value=i.results[0][0].transcript;search()},recognition.start()):alert("Micro non supporté.")}
function setSecurityMode(h){b=h;localStorage.setItem('baobabSecurity',h);$('#strongBanner')&&$('#strongBanner').classList.toggle('hidden','strong'!==h)}
function saveHistory(h){$('#saveActivity')&&!$('#saveActivity').checked||(localStorage.setItem('hist',JSON.stringify([h,...JSON.parse(localStorage.getItem('hist')||'[]').filter(i=>i!==h)].slice(0,5))),loadHistory())}
function loadHistory(){let h=JSON.parse(localStorage.getItem('hist')||'[]');$('#historyList')&&($('#historyList').innerHTML=h.map(i=>`<div class="item" onclick="selectSuggest('${i.replace(/'/g,"\\'")}')">${i}</div>`).join(''))}
function clearHistory(){localStorage.removeItem('hist');loadHistory();alert('Historique effacé')}

let currentUser=JSON.parse(localStorage.getItem('baobab_current_user')||'null'),phoneValidated=!1;function checkAuth(){const h=$('#loginForm'),i=$('#accountInfo');h&&(currentUser?(h.style.display='none',i.style.display='block',$('#userEmail').innerText=currentUser.email,$('#userPhone').innerText=currentUser.phone||""):(h.style.display='block',i.style.display='none'))}
function validatePhone(){const h=$('#phoneInput').value.trim();h?/^\+?[0-9\s\-()]{8,15}$/.test(h)?(phoneValidated=!0,showAccountMsg("Numéro validé ✓","success")):showAccountMsg("Format invalide. Ex:+221771234567","error"):showAccountMsg("Entre ton numéro","error")}
function createAccount(){const h=$('#emailInput').value.trim(),i=$('#passwordInput').value,j=$('#phoneInput').value.trim();h&&i&&j?phoneValidated?4<=i.length?localStorage.getItem('baobab_user_'+h)?showAccountMsg("Ce compte existe déjà","error"):(localStorage.setItem('baobab_user_'+h,JSON.stringify({email:h,password:i,phone:j,verified:!1})),phoneValidated=!1,showAccountMsg("Compte créé!","success"),$('#emailInput').value="",$('#passwordInput').value="",$('#phoneInput').value=""):showAccountMsg("Mot de passe trop court","error"):showAccountMsg("Clique sur Valider d'abord","error"):showAccountMsg("Remplis tout","error")}
function login(){const h=$('#emailInput').value.trim(),i=$('#passwordInput').value,j=localStorage.getItem('baobab_user_'+h);j?(JSON.parse(j).password===i?(currentUser={email:h,phone:JSON.parse(j).phone},localStorage.setItem('baobab_current_user',JSON.stringify(currentUser)),showAccountMsg("Connexion réussie","success"),checkAuth()):showAccountMsg("Email ou mot de passe incorrect","error")):showAccountMsg("Compte introuvable","error")}
function logout(){currentUser=null;localStorage.removeItem('baobab_current_user');showAccountMsg("Déconnecté","success");checkAuth()}
function showAccountMsg(h,i){const j=$('#loginMessage');j&&(j.innerText=h,j.className='message '+i,setTimeout(()=>{j.innerText=""},4e3))}

addEventListener('DOMContentLoaded',()=>{applyTheme();$('#langSelect')&&($('#langSelect').value=a,$('#langSelect').addEventListener('change',h=>{a=h.target.value;localStorage.setItem('baobabLang',a)}));$('#themeSelect')&&($('#themeSelect').value=c,$('#themeSelect').addEventListener('change',h=>{c=h.target.value;localStorage.setItem('baobabTheme',c);applyTheme()}));$('#safeSearch')&&($('#safeSearch').value=d,$('#safeSearch').addEventListener('change',h=>{d=h.target.value;localStorage.setItem('baobabSafe',d)}));$('#suggestionsToggle')&&($('#suggestionsToggle').value=e,$('#suggestionsToggle').addEventListener('change',h=>{e=h.target.value;localStorage.setItem('baobabSuggestions',e)}));addEventListener('click',h=>{$('#suggestions')&&!h.target.closest('.search-bar')&&$('#suggestions').classList.add('hidden');$('#imageMenu')&&!h.target.closest('#imageMenu')&&!h.target.closest('.icon-btn[title="Recherche par image"]')&&$('#imageMenu').classList.add('hidden')});goHome()});
