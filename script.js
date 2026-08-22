const $=s=>document.querySelector(s);
let lang=localStorage.getItem('baobabLang')||'fr-FR';
let theme=localStorage.getItem('baobabTheme')||'system'; // 1. Passer à 'system' par défaut
let currentFilter="all";
let lastQuery="";

// ... ton LANGUAGES ne bouge pas ...

function applyTheme(){
  let actualTheme = theme;
  if(theme === 'system'){ // 2. Gérer le mode système
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', actualTheme);
  if($('#themeSelect')) $('#themeSelect').value = theme; // 3. Mettre le select à jour
}

function applyLanguage(){
  document.documentElement.lang = lang.split('-')[0];
  if($('#langSelect')) $('#langSelect').value = lang;
  let filters = [t('all'), t('images'), t('videos'), t('news'), t('maps')];
  document.querySelectorAll('.filter-btn').forEach((b,i)=>{ if(filters[i]) b.textContent = filters[i]; });
}

// ... tout ton code du milieu ne bouge pas ...

addEventListener('DOMContentLoaded',()=>{
  applyTheme(); // Appliquer au démarrage
  applyLanguage(); 
  goHome();

  // 4. Écouter le changement du select Thème
  if($('#themeSelect')){
    $('#themeSelect').addEventListener('change', (e)=>{
      theme = e.target.value;
      localStorage.setItem('baobabTheme', theme);
      applyTheme();
    });
  }

  // 5. Écouter si l'utilisateur change le thème de son téléphone
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if(theme === 'system') applyTheme();
  });

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
