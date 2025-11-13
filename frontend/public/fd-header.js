
(function(){
  function ensureEl(id, creator){
    var el = document.getElementById(id);
    if (!el) {
      el = creator();
      document.body.insertBefore(el, document.body.firstChild);
    }
    return el;
  }
  function addFooter(){
    if (document.getElementById('fd-footer')) return;
    var f = document.createElement('div');
    f.id = 'fd-footer';
    f.innerHTML = '© 2025 Fale Direito';
    document.body.appendChild(f);
  }
  function addHeader(){
    ensureEl('fd-header', function(){
      var h = document.createElement('div');
      h.id = 'fd-header';
      h.innerHTML = '<div class="fd-header-inner">\
        <img class="fd-header-logo" src="/logo-fale-direito.png" alt="Fale Direito" />\
        <div class="fd-header-title-wrap">\
          <div class="fd-header-title">Fale Direito</div>\
          <div class="fd-header-sub">Eficiência em atendimento jurídico digital</div>\
        </div>\
      </div>';
      return h;
    });
  }
  function setTitle(){
    try { document.title = "Fale Direito — Atendimento Jurídico Inteligente"; } catch(e){}
  }
  function setFavicon(){
    var link = document.querySelector('link[rel="icon"]');
    if (!link){
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }
    link.href = "/favicon.png";
  }
  function maybeLoginGradient(){
    // Heuristic: if path includes 'login' or query/hash contains login
    var path = (location.pathname || '').toLowerCase();
    var hash = (location.hash || '').toLowerCase();
    var qs = (location.search || '').toLowerCase();
    if (path.indexOf('login') >= 0 || hash.indexOf('login') >= 0 || qs.indexOf('login') >= 0) {
      document.body.classList.add('fd-login-gradient');
    }
  }
  function init(){
    setTitle();
    setFavicon();
    addHeader();
    addFooter();
    maybeLoginGradient();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
