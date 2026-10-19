/* ChowBuy content layer. Applies admin edits (assets/content-data.js) on top of the page markup.
   Also used by the admin console to discover what is editable. No dependencies. */
(function (g) {
'use strict';
var SIMPLE = {A:1,B:1,STRONG:1,EM:1,I:1,BR:1}, RICH = {A:1,B:1,STRONG:1,EM:1,I:1,BR:1,SPAN:1,SMALL:1,MARK:1,U:1};
var SEL = 'h1,h2,h3,h4,h5,p,li,figcaption,blockquote,td,th,label,.eyebrow,.lead,.tag,a.btn,button.btn';
var SKIP = 'script,style,svg,noscript,[data-cms-skip],[data-cms-cities],.post-grid,.jobs,.faq-list,#faq,.toasts,.sheet,[data-to],.cat-tabs,.doc .prose,.toc,.crumbs,.hsearch,.map,.phone,.pill-row';
var DEFAULT_CITIES = [{n:'Lagos',s:'Lagos'},{n:'Abuja',s:'Abuja'},{n:'Port Harcourt',s:'PH'},{n:'Ibadan',s:'Ibadan'},{n:'Kano',s:'Kano'},{n:'Enugu',s:'Enugu'}];
var LEGAL = {privacy:1, terms:1, cookies:1, 'rider-agreement':1};
var NUM = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];

function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fnv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function norm(s) { return String(s).replace(/\s+/g,' ').trim(); }
function safeUrl(u) {
  u = String(u).trim();
  if (/^(javascript|data|vbscript):/i.test(u)) return '#';
  return u;
}
/* ---------- inline mini-markup:  **bold**  *italic*  [text](url) ---------- */
function inl(s) {
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
    return '<a href="' + esc(safeUrl(u.replace(/&amp;/g,'&'))) + '">' + t + '</a>';
  });
  s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>');
  return s.replace(/\n/g,'<br>');
}
function toInl(n) {
  var o = '';
  [].forEach.call(n.childNodes, function (c) {
    if (c.nodeType === 3) o += c.nodeValue.replace(/\s+/g,' ');
    else if (c.nodeType === 1) {
      var t = c.tagName;
      if (t === 'BR') o += '\n';
      else if (t === 'A') o += '[' + toInl(c) + '](' + (c.getAttribute('href') || '#') + ')';
      else if (t === 'STRONG' || t === 'B') o += '**' + toInl(c) + '**';
      else if (t === 'EM' || t === 'I') o += '*' + toInl(c) + '*';
      else o += toInl(c);
    }
  });
  return o;
}
function clean(h) {
  var t = document.createElement('template'); t.innerHTML = h;
  (function w(n) {
    [].slice.call(n.childNodes).forEach(function (c) {
      if (c.nodeType === 1) {
        if (!RICH[c.tagName]) { c.remove(); return; }
        [].slice.call(c.attributes).forEach(function (a) {
          if (a.name === 'class' || a.name === 'aria-hidden') return;
          if (a.name === 'href' && c.tagName === 'A') { c.setAttribute('href', safeUrl(a.value)); return; }
          c.removeAttribute(a.name);
        });
        w(c);
      } else if (c.nodeType !== 3) c.remove();
    });
  })(t.content);
  return t.innerHTML;
}
/* ---------- block mini-markup (legal docs, blog bodies, FAQ answers) ---------- */
function mdToHtml(md, o) {
  o = o || {}; var n = 0, out = [];
  String(md || '').replace(/\r/g,'').split(/\n{2,}/).forEach(function (b) {
    b = b.replace(/^\n+|\n+$/g,''); if (!b.trim()) return;
    var L = b.split('\n'), m;
    if ((m = /^(#{2,3})\s+(.*)$/.exec(b)) && L.length === 1) {
      var tg = m[1].length === 2 ? 'h2' : 'h3';
      out.push('<' + tg + (tg === 'h2' && o.ids ? ' id="s' + (++n) + '"' : '') + '>' + inl(m[2]) + '</' + tg + '>');
    } else if (L.every(function (l) { return /^\s*[-*•]\s+/.test(l); })) {
      out.push('<ul>' + L.map(function (l) { return '<li>' + inl(l.replace(/^\s*[-*•]\s+/, '')) + '</li>'; }).join('') + '</ul>');
    } else if (L.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) {
      out.push('<ol>' + L.map(function (l) { return '<li>' + inl(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>'; }).join('') + '</ol>');
    } else if (L.every(function (l) { return /^\s*\|/.test(l); })) {
      var rows = L.map(function (l) { return l.trim().replace(/^\||\|$/g,'').split('|').map(function (c) { return c.trim(); }); });
      out.push('<table class="tbl"><thead><tr>' + rows[0].map(function (c) { return '<th>' + inl(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inl(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>');
    } else if (L.every(function (l) { return /^>\s?/.test(l); })) {
      out.push('<blockquote>' + inl(L.map(function (l) { return l.replace(/^>\s?/, ''); }).join('\n')) + '</blockquote>');
    } else out.push('<p>' + inl(b) + '</p>');
  });
  return out.join('');
}
function blocksToMd(parent) {
  var out = [];
  [].forEach.call(parent.children, function (c) {
    var t = c.tagName;
    if (t === 'H2') out.push('## ' + norm(toInl(c)));
    else if (t === 'H3') out.push('### ' + norm(toInl(c)));
    else if (t === 'P') out.push(toInl(c).trim());
    else if (t === 'UL') out.push([].map.call(c.children, function (li) { return '- ' + norm(toInl(li)); }).join('\n'));
    else if (t === 'OL') out.push([].map.call(c.children, function (li, i) { return (i + 1) + '. ' + norm(toInl(li)); }).join('\n'));
    else if (t === 'BLOCKQUOTE') out.push('> ' + norm(toInl(c)));
    else if (t === 'TABLE') out.push([].map.call(c.querySelectorAll('tr'), function (tr) { return '|' + [].map.call(tr.children, function (x) { return norm(toInl(x)); }).join('|') + '|'; }).join('\n'));
    else if (norm(c.textContent)) out.push(norm(c.textContent));
  });
  return out.join('\n\n');
}
/* ---------- cities ---------- */
function names(C) { return (C && C.cities && C.cities.length ? C.cities : DEFAULT_CITIES); }
function joinList(a, w) { return a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' ' + w + ' ' + a[a.length - 1]; }
function cityFull(C) { return joinList(names(C).map(function (x) { return x.n; }), 'and'); }
function cityShort(C) { return joinList(names(C).map(function (x) { return x.s || x.n; }), '&'); }
function cityCount(C) { var n = names(C).length; return NUM[n] || String(n); }
function tok(h, C) { return String(h).replace(/\{cities\}/g, esc(cityFull(C))).replace(/\{cities_short\}/g, esc(cityShort(C))).replace(/\{count\}/g, cityCount(C)); }
/* ---------- scanning ---------- */
function pageName(p) {
  p = (p || location.pathname).split('/').pop().replace(/\.html$/, '');
  return p && p !== 'index' ? p : 'index';
}
function modeOf(el) {
  var m = 'md', all = el.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var t = all[i].tagName;
    if (!RICH[t]) return null;
    if (!SIMPLE[t] || (all[i].attributes.length && !(t === 'A' && all[i].attributes.length === 1 && all[i].hasAttribute('href')))) m = 'html';
  }
  return m;
}
function inSkip(el, root) { return el.closest(SKIP); }
function scan(root, page) {
  var seen = {}, fields = [];
  [].forEach.call(root.querySelectorAll(SEL), function (el) {
    if (inSkip(el) || el.querySelector(SEL)) return;
    var text = norm(el.textContent); if (text.length < 2) return;
    var src = el;
    if (el.querySelector('[data-cms-cities]')) {
      src = el.cloneNode(true);
      [].forEach.call(src.querySelectorAll('[data-cms-cities]'), function (c) { c.replaceWith(document.createTextNode(c.getAttribute('data-cms-cities') === 'count' ? '{count}' : '{cities}')); });
    }
    var mode = modeOf(src); if (!mode) return;
    var scope = el.closest('header,footer') ? 'site' : page;
    var base = scope + ':' + fnv(text), n = seen[base] = (seen[base] || 0) + 1;
    var sec = el.closest('section,header,footer'), h = sec && sec.querySelector('h1,h2'), lab = el.closest('footer') ? 'Footer' : el.closest('header') ? 'Header & menu' : (h ? norm(h.textContent).slice(0, 48) : (sec && sec.className ? sec.className.split(' ')[0] : 'Page'));
    fields.push({key: base + '#' + n, el: el, tag: el.tagName.toLowerCase(), mode: mode, def: mode === 'md' ? toInl(src).trim() : clean(src.innerHTML).trim(), sec: lab, scope: scope});
  });
  return fields;
}
function scanImgs(root, page) {
  var cnt = {}, out = [];
  [].forEach.call(root.querySelectorAll('img'), function (el) {
    if (el.closest('.post-grid,#faq,.faq-list,[data-cms-skip]')) return;
    var scope = el.closest('header,footer') ? 'site' : page; cnt[scope] = (cnt[scope] || 0) + 1;
    var sec = el.closest('section,header,footer'), h = sec && sec.querySelector('h1,h2');
    out.push({key: 'img:' + scope + ':' + cnt[scope], el: el, src: el.getAttribute('src') || '', alt: el.getAttribute('alt') || '', sec: el.closest('footer') ? 'Footer' : el.closest('header') ? 'Header' : (h ? norm(h.textContent).slice(0, 48) : 'Page')});
  });
  return out;
}
/* ---------- list extraction (defaults) ---------- */
function q1(el, s) { var x = el.querySelector(s); return x ? norm(toInl(x)) : ''; }
function extract(root, page, raw) {
  var r = {fields: scan(root, page), imgs: scanImgs(root, page)};
  if (LEGAL[page]) { var pr = root.querySelector('.doc .prose'); if (pr) r.doc = blocksToMd(pr); }
  var posts = root.querySelectorAll('.post-grid details.post');
  if (posts.length || page === 'blog') r.blog = [].map.call(posts, function (d) {
    var im = d.querySelector('img');
    return {tag: q1(d, '.tag'), title: q1(d, 'h3'), ex: q1(d, '.ex'), body: blocksToMd(d.querySelector('.body') || d), img: im ? im.getAttribute('src') : '', alt: im ? im.getAttribute('alt') || '' : ''};
  });
  var jobs = root.querySelectorAll('.jobs .job');
  if (jobs.length || page === 'careers') r.jobs = [].map.call(jobs, function (j) {
    var a = j.querySelector('a'), h = a ? a.getAttribute('href') || '' : '';
    return {title: q1(j, 'h3'), meta: q1(j, 'p'), email: h.replace(/^mailto:/, '').split('?')[0]};
  });
  var fq = root.querySelectorAll('.faq-list.full .fq');
  if (fq.length) r.help = [].map.call(fq, function (f) {
    return {cat: f.getAttribute('data-cat') || 'orders', q: q1(f, 'h3 span'), a: blocksToMd(f.querySelector('.fa > div') || f)};
  });
  if (page === 'index' && raw) {
    var m = /var FQ=(\[\[[\s\S]*?\]\]);/.exec(raw);
    if (m) { try { r.homeFaq = (new Function('return ' + m[1]))().map(function (x) { return {q: x[0], a: x[1].replace(/<span data-cms-cities="full">[^<]*<\/span>/, '{cities}')}; }); } catch (e) {} }
  }
  return r;
}
/* ---------- rendering of lists ---------- */
function renderBlog(grid, posts, C) {
  grid.innerHTML = posts.map(function (p) {
    return '<details class="post"><summary>' + (p.img ? '<img class="pimg" src="' + esc(p.img) + '" alt="' + esc(p.alt || '') + '" loading="lazy">' : '') +
      '<span class="tag">' + esc(p.tag) + (p.date ? ' · ' + esc(p.date) : '') + '</span><h3>' + esc(p.title) + '</h3><p class="ex">' + inl(p.ex) + '</p><span class="rd">Read more</span></summary><div class="body">' + tok(mdToHtml(p.body), C) + '</div></details>';
  }).join('');
}
function renderJobs(box, jobs) {
  box.innerHTML = jobs.map(function (j) {
    return '<div class="job"><div><h3>' + esc(j.title) + '</h3><p>' + esc(j.meta) + '</p></div><a class="btn btn-ghost" href="mailto:' + esc(j.email || 'careers@chowbuy.ng') + '?subject=' + encodeURIComponent(j.title) + '">Apply</a></div>';
  }).join('');
}
function renderHelp(box, items, C) {
  box.innerHTML = items.map(function (f) {
    return '<div class="fq" data-cat="' + esc(f.cat) + '"><h3><button aria-expanded="false"><span>' + inl(f.q) + '</span><svg class="ic"><use href="#i-down"></use></svg></button></h3><div class="fa"><div>' + tok(mdToHtml(f.a), C) + '</div></div></div>';
  }).join('');
}
function renderHome(box, items, C) {
  box.innerHTML = items.map(function (f, i) {
    return '<div class="fq' + (i === 0 ? ' open' : '') + '"><h3><button aria-expanded="' + (i === 0) + '" aria-controls="fa' + i + '" id="fb' + i + '"><span>' + inl(f.q) + '</span><svg class="ic" aria-hidden="true"><use href="#i-down"/></svg></button></h3><div class="fa" id="fa' + i + '" role="region" aria-labelledby="fb' + i + '"><div>' + tok(mdToHtml(f.a), C) + '</div></div></div>';
  }).join('');
}
function renderDoc(prose, md, C) {
  prose.innerHTML = tok(mdToHtml(md, {ids: 1}), C);
  var ol = document.querySelector('.doc .toc ol');
  if (ol) ol.innerHTML = [].map.call(prose.querySelectorAll('h2'), function (h) { return '<li><a href="#' + h.id + '">' + esc(h.textContent) + '</a></li>'; }).join('');
}
function applyCities(C) {
  if (!C.cities || !C.cities.length) return;
  var list = names(C);
  [].forEach.call(document.querySelectorAll('[data-cms-cities]'), function (el) {
    var m = el.getAttribute('data-cms-cities');
    if (m === 'pill') { var tn = [].filter.call(el.childNodes, function (n) { return n.nodeType === 3; }).pop(); var txt = 'Now delivering in ' + cityShort(C); if (tn) tn.nodeValue = txt; else el.appendChild(document.createTextNode(txt)); }
    else if (m === 'full') el.textContent = cityFull(C);
    else if (m === 'count') el.textContent = cityCount(C);
    else if (m === 'chips') el.innerHTML = list.map(function (x) { return '<span class="chip">' + esc(x.n) + '</span>'; }).join('');
    else if (m === 'options') { var v = el.value; el.innerHTML = list.map(function (x) { return '<option>' + esc(x.n) + '</option>'; }).join(''); try { el.value = v; } catch (e) {} }
  });
  var low = list.map(function (x) { return x.n.toLowerCase(); });
  [].forEach.call(document.querySelectorAll('[data-cms-city]'), function (g) { g.style.display = low.indexOf(g.getAttribute('data-cms-city').toLowerCase()) < 0 ? 'none' : ''; });
}
/* ---------- apply everything ---------- */
function applyAll(C, page) {
  page = page || pageName();
  if (C.blog) { var bg = document.querySelector('.post-grid'); if (bg) renderBlog(bg, C.blog, C); }
  if (C.jobs) { var jb = document.querySelector('.jobs'); if (jb) renderJobs(jb, C.jobs); }
  if (C.help) { var hb = document.querySelector('.faq-list.full'); if (hb) renderHelp(hb, C.help, C); }
  if (C.homeFaq && page === 'index') { var fb = document.getElementById('faq'); if (fb) renderHome(fb, C.homeFaq, C); }
  if (C.docs && C.docs[page] != null) { var pr = document.querySelector('.doc .prose'); if (pr) renderDoc(pr, C.docs[page], C); }
  var T = C.t || {}, I = C.i || {};
  if (Object.keys(T).length) scan(document, page).forEach(function (f) {
    if (T[f.key] == null) return;
    f.el.innerHTML = tok(f.mode === 'md' ? inl(T[f.key]) : clean(T[f.key]), C);
  });
  if (Object.keys(I).length) scanImgs(document, page).forEach(function (f) {
    var v = I[f.key]; if (!v) return;
    if (v.src) { f.el.removeAttribute('srcset'); f.el.removeAttribute('sizes'); if (f.el.parentNode && f.el.parentNode.tagName === 'PICTURE') [].forEach.call(f.el.parentNode.querySelectorAll('source'), function (s) { s.remove(); }); f.el.src = v.src; }
    if (v.alt != null) f.el.setAttribute('alt', v.alt);
  });
  applyCities(C);
}
g.CMS = {scan: scan, scanImgs: scanImgs, extract: extract, applyAll: applyAll, inl: inl, mdToHtml: mdToHtml, blocksToMd: blocksToMd, toInl: toInl, clean: clean, tok: tok, pageName: pageName, defaultCities: DEFAULT_CITIES, cityFull: cityFull, cityShort: cityShort, cityCount: cityCount, legal: LEGAL, norm: norm, esc: esc, fnv: fnv};

/* ---------- public pages only ---------- */
if (g.__CMS_ADMIN || !document.body) return;
function run() {
  var C = g.CB_CONTENT || {}, prev = false;
  try { if (localStorage.getItem('cb-cms-on') === '1') { var d = JSON.parse(localStorage.getItem('cb-cms') || 'null'); if (d) { C = d; prev = true; } } } catch (e) {}
  try { applyAll(C); } catch (e) { if (g.console) console.warn('content layer', e); }
  if (prev) {
    var b = document.createElement('div');
    b.setAttribute('style', 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99999;background:#0F172A;color:#fff;font:600 13px/1.2 system-ui,sans-serif;padding:10px 14px;border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,.35);display:flex;gap:12px;align-items:center;max-width:94vw');
    b.innerHTML = '<span>Previewing unpublished edits</span><button type="button" style="all:unset;cursor:pointer;background:#FF5A1F;border-radius:999px;padding:6px 12px">Exit preview</button>';
    b.lastChild.onclick = function () { try { localStorage.removeItem('cb-cms-on'); } catch (e) {} location.reload(); };
    document.body.appendChild(b);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})(window);
