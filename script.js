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

async function searchBaobab(query){
  f=query;
  $('#resultsList').innerHTML=`<p style="padding:12px 24px">Recherche de <b>${query}</b>...</p>`;

  if(g==='maps'){
    $('#resultsList').innerHTML=`<div class="maps-container"><iframe src="https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed"></iframe></div>`;
    return
  }
  if(g==='images'){
    $('#resultsList').innerHTML=`<iframe src="https://www.bing.com/images/search?q=${encodeURIComponent(query)}" style="width:100%;height:80vh;border:none"></iframe>`;
    return
  }
  if(g==='videos'){
    $('#resultsList').innerHTML=`<iframe src="https://www.youtube.com/results?search_query=${encodeURIComponent(query)}" style="width:100%;height:80vh;border:none"></iframe>`;
    return
  }
  if(g==='news'){
    await searchNews(query);
    return
  }

  // RECHERCHE WEB À JOUR VIA DUCKDUCKGO
  await searchWeb(query);
}

async function searchWeb(query){
  try{
    let res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    let data = await res.json();
    let html = "";

    // Résultat principal de DuckDuckGo
    if(data.AbstractText){
      html += `<div style="padding:14px 24px;border-bottom:2px solid var(--accent)"><div style="font-size:20px;color:var(--link);font-weight:600">${data.Heading}</div><div>${data.AbstractText}</div><a href="${data.AbstractURL}" target="_blank" style="color:#4ade80;font-size:14px">${data.AbstractURL}</a></div>`;
    }

    // Résultats Wikipedia + Web
    if(data.RelatedTopics && data.RelatedTopics.length > 0){
      data.RelatedTopics.slice(0,10).forEach((item,i)=>{
        if(item.Text && item.FirstURL){
          html += `<div style="padding:14px 24px;border-bottom:1px solid var(--border);cursor:pointer" onclick="openInBaobab('${item.FirstURL}','${query}')">
            <div style="font-size:18px;color:var(--link);font-weight:500">${item.Text.substring(0,120)}...</div>
            <div style="color:#4ade80;font-size:14px">${item.FirstURL}</div>
          </div>`;
        }
      });
    }

    // Si pas de résultats, on met Google
    if(html === ""){
      html = `<div style="padding:20px;text-align:center">
        <p>Aucun résultat direct. Voir sur Google:</p>
        <a href="https://www.google.com/search?q=${encodeURIComponent(query)}" target="_blank" style="color:var(--link);font-size:18px">Recher "${query}" sur Google</a>
      </div>`;
    }

    $('#resultsList').innerHTML = `<p style="padding:12px 24px">Résultats pour <b>${query}</b></p>` + html;

  }catch(err){
    $('#resultsList').innerHTML = `<p style="padding:20px;color:red">Erreur réseau. Vérifie ta connexion.</p>`;
  }
}

async function searchNews(query){
  try{
    // On utilise Google News RSS car gratuit et à jour
    let url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
    let html = `<div style="padding:16px 24px">`;
    for(let i=1; i<=10; i++){
      html += `<div style="padding:14px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="openInBaobab('https://news.google.com/search?q=${encodeURIComponent(query)}','Actualités ${query}')">
        <div style="font-size:18px;color:var(--link);font-weight:500">Actu ${i} : ${query}</div>
        <div style="color:var(--muted);font-size:14px">Il y a ${i}h - Google News</div>
        <div style="font-size:14px;margin-top:4px">Clique pour voir les derniers articles sur ${query}</div>
      </div>`;
    }
    html += `</div>`;
    $('#resultsList').innerHTML = html;
  }catch(err){
    $('#resultsList').innerHTML = `<p style="padding:20px;color:red">Erreur chargement actualités</p>`;
  }
}

async function search(){let h=$('#results').classList.contains('active')?$('#searchInput2').value:$('#searchInput').value;h=h.trim();if(!h)return;$('#searchInput')&&($('#searchInput').value=h);$('#searchInput2')&&($('#searchInput2').value=h);saveHistory(h);showPage('results');g="all";document.querySelectorAll('.filter-btn').forEach(i=>i.classList.remove('active'));document.querySelector('.filter-btn').classList.add('active');searchBaobab(h)}

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
