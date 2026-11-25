(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = function () { return window.matchMedia('(max-width: 760px)').matches; };

  var hdr = document.querySelector('.hdr');
  var autohide = document.body.hasAttribute('data-autohide');
  function onScroll() {
    if (!hdr) return;
    var open = document.querySelector('.nav.is-open');
    hdr.classList.toggle('is-hidden', autohide && window.scrollY < 120 && !open);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') !== 'true';
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      onScroll();
    });
  }

  var PATTERNS = {
    heroH: { rows: 8, ink: { '6,7': 'b1', '7,5': 'c3', '9,4': 'e4', '10,2': 'f6' }, order: ['b1', 'c3', 'e4', 'f6'],
      paper: function (f, r, l) { return f <= 4 || (f === 5 && l) || (f === 6 && l && r % 2 === 0) || (f === 7 && l && r % 3 === 1) || (f === 8 && l && r === 6); },
      delay: function (f, r, rows) { return f * 70 + (rows - 1 - r) * 45; } },
    heroV: { rows: 13, ink: { '1,8': 'b1', '2,6': 'c3', '4,7': 'e4', '5,9': 'f6' }, order: ['b1', 'c3', 'e4', 'f6'],
      paper: function (f, r, l) { return r <= 4 || (r === 5 && l) || (r === 6 && l && f % 2 === 0) || (r === 7 && l && f % 3 === 0) || (r === 8 && l && f === 3); },
      delay: function (f, r) { return r * 75 + f * 40; } },
    headH: { rows: 5,
      paper: function (f, r, l) { return f <= 5 || (f === 6 && l) || (f === 7 && l && r % 2 === 0) || (f === 8 && l && r === 3) || (f === 9 && l && r === 1); },
      delay: function (f, r) { return f * 45 + (4 - r) * 30; } },
    headV: { rows: 7,
      paper: function (f, r, l) { return r <= 4 || (r === 5 && l) || (r === 6 && l && f % 2 === 1); },
      delay: function (f, r) { return r * 60 + f * 30; } }
  };

  function buildBoard(host, animate) {
    var board = host.querySelector('.board');
    if (!board) return;
    var isHero = host.classList.contains('hero');
    var v = narrow();
    var p = isHero ? (v ? PATTERNS.heroV : PATTERNS.heroH) : (v ? PATTERNS.headV : PATTERNS.headH);
    var cell = v ? 65 : 102;
    var cols = Math.ceil(host.clientWidth / cell) + 1;
    var rows = p.rows;
    var ink = p.ink;
    if (!isHero) {
      ink = {};
      var spec = (host.getAttribute(v ? 'data-ink-v' : 'data-ink') || '').split(',');
      if (spec.length === 3) ink[spec[0] + ',' + spec[1]] = spec[2];
    }
    var html = '';
    for (var r = 0; r < rows; r++) {
      for (var f = 0; f < cols; f++) {
        var l = (r + f) % 2 === 0;
        var name = ink[f + ',' + r];
        var cls = name ? 'ink' : (p.paper(f, r, l) ? 'paper' : '');
        var d = name ? (isHero ? 1300 + p.order.indexOf(name) * 320 : 900) : p.delay(f, r, rows);
        html += '<i class="' + cls + '" style="--d:' + d + 'ms">' + (name || '') + '</i>';
      }
    }
    board.style.setProperty('--cols', cols);
    board.style.setProperty('--rows', rows);
    board.innerHTML = html;
    if (!animate || reduce) { board.classList.add('is-on'); host.classList.add('is-on'); }
  }

  var boards = Array.prototype.slice.call(document.querySelectorAll('.hero, .phead'));
  boards.forEach(function (host) {
    buildBoard(host, true);
    var wait = host.classList.contains('hero') ? 1400 : 250;
    setTimeout(function () {
      requestAnimationFrame(function () {
        host.querySelector('.board').classList.add('is-on');
        host.classList.add('is-on');
      });
    }, reduce ? 0 : wait);
  });
  var lastW = window.innerWidth, rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      boards.forEach(function (host) { buildBoard(host, false); });
    }, 150);
  });

  var video = document.querySelector('.hero video');
  if (video) {
    video.muted = true;
    if (reduce) { video.removeAttribute('autoplay'); video.pause(); }
    else { var pl = video.play(); if (pl && pl.catch) pl.catch(function () {}); }
  }

  var chips = document.querySelectorAll('[data-filter]');
  if (chips.length) {
    var state = { pub: 'todos', tipo: 'todos' };
    var cards = document.querySelectorAll('.fcard');
    var empty = document.querySelector('.fund-empty');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var axis = c.getAttribute('data-filter');
        state[axis] = c.getAttribute('data-value');
        document.querySelectorAll('[data-filter="' + axis + '"]').forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
        var shown = 0;
        cards.forEach(function (card) {
          var ok = (state.pub === 'todos' || card.getAttribute('data-pub') === state.pub) && (state.tipo === 'todos' || card.getAttribute('data-tipo') === state.tipo);
          card.hidden = !ok;
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  document.querySelectorAll('[role=tablist]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role=tab]'));
    function select(t, focus) {
      tabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute('aria-selected', on ? 'true' : 'false');
        o.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(o.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  var pieces = document.querySelector('.pieces');
  if (pieces) {
    var start = function () { pieces.classList.add('is-on'); };
    if (reduce || !('IntersectionObserver' in window)) start();
    else {
      var io = new IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; })) { start(); io.disconnect(); }
      }, { threshold: 0.3 });
      io.observe(pieces);
    }
    var steps = pieces.querySelectorAll('.step');
    var hls = pieces.querySelectorAll('.hl');
    var lds = pieces.querySelectorAll('.ld');
    var dots = pieces.querySelectorAll('.dot');
    var sel = -1;
    function paint(i) {
      sel = i;
      if (i < 0) pieces.removeAttribute('data-sel'); else pieces.setAttribute('data-sel', i);
      steps.forEach(function (s, k) {
        s.classList.toggle('is-sel', k === i);
        s.querySelector('button').setAttribute('aria-pressed', k === i ? 'true' : 'false');
      });
      hls.forEach(function (h, k) { h.style.opacity = k === i ? 1 : 0; });
      lds.forEach(function (l, k) { l.style.stroke = k === i ? '#111111' : ''; });
      dots.forEach(function (d, k) { d.style.transform = k === i ? 'scale(1.5)' : ''; });
    }
    steps.forEach(function (s, k) {
      var b = s.querySelector('button');
      b.addEventListener('mouseenter', function () { paint(k); });
      b.addEventListener('focus', function () { paint(k); });
      b.addEventListener('click', function () { paint(sel === k ? -1 : k); });
    });
    pieces.addEventListener('mouseleave', function () { paint(-1); });
  }

  var gate = document.querySelector('.gate');
  if (gate) {
    var key = 'chess-gate';
    var passed = false;
    try { passed = sessionStorage.getItem(key) === '1'; } catch (e) {}
    if (!passed) {
      gate.hidden = false;
      document.body.style.overflow = 'hidden';
      var chk = gate.querySelector('input[type=checkbox]');
      var go = gate.querySelector('.gate__go');
      chk.addEventListener('change', function () { go.disabled = !chk.checked; });
      go.addEventListener('click', function () {
        if (!chk.checked) return;
        try { sessionStorage.setItem(key, '1'); } catch (e) {}
        gate.hidden = true;
        document.body.style.overflow = '';
      });
      setTimeout(function () { chk.focus(); }, 50);
    }
  }

  var q = document.querySelector('#busca');
  if (q) {
    var items = document.querySelectorAll('.dcard');
    var none = document.querySelector('.doc-empty');
    var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    q.addEventListener('input', function () {
      var v = norm(q.value.trim()), shown = 0;
      items.forEach(function (it) {
        var ok = !v || norm(it.textContent).indexOf(v) >= 0;
        it.hidden = !ok;
        if (ok) shown++;
      });
      none.hidden = shown > 0;
    });
  }

  var form = document.querySelector('.form');
  if (form) {
    var t0 = Date.now();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form__msg');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (form.querySelector('.hp input').value || Date.now() - t0 < 2500) return;
      var action = form.getAttribute('action');
      if (!action || location.hostname.indexOf('github.io') >= 0) {
        msg.textContent = 'Esta é uma prévia do novo site: o envio do formulário funciona apenas na versão publicada em chess.capital.';
        return;
      }
      msg.textContent = 'Enviando…';
      fetch(action, { method: 'POST', body: new FormData(form) })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function () { msg.textContent = 'Mensagem enviada. Retornaremos em breve.'; form.reset(); })
        .catch(function () { msg.textContent = 'Não foi possível enviar agora. Escreva para institucional@chess.capital.'; });
    });
  }
})();
