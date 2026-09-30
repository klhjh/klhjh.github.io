/* ==========================================================================
   app.js —— 渲染与交互逻辑，正常使用不需要改这个文件
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- 工具 ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function totalScore(post) {
    var s = post.scores || [];
    if (!s.length) return null;
    var w = 0, sum = 0;
    s.forEach(function (d) {
      var weight = Number(d.weight) || 0;
      w += weight;
      sum += (Number(d.value) || 0) * weight;
    });
    if (!w) return null;
    return Math.round((sum / w) * 10) / 10;
  }

  function sorted() {
    return POSTS.slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  function urlHost(url) {
    var m = /^https?:\/\/([^/]+)/.exec(url || '');
    return m ? m[1].replace(/^www\./, '') : url;
  }

  function articleUrl(slug) {
    return 'article.html?slug=' + encodeURIComponent(slug);
  }

  /* ---------- 公共区块：导航 / 页脚 ---------- */

  function renderChrome() {
    var page = document.body.getAttribute('data-page') || '';

    var nav = document.getElementById('nav');
    if (nav) {
      var links = [
        { href: 'index.html', label: '首页', key: 'home' },
        { href: 'articles.html', label: '全部推荐', key: 'list' },
        { href: 'about.html', label: '评测方法', key: 'about' }
      ];
      nav.innerHTML =
        '<a class="brand" href="index.html"><span class="mark"></span>' + esc(SITE.name) +
        '<span class="en">' + esc(SITE.enName) + '</span></a>' +
        '<nav class="nav-links">' +
        links.map(function (l) {
          return '<a href="' + l.href + '"' + (l.key === page ? ' class="on"' : '') + '>' + esc(l.label) + '</a>';
        }).join('') +
        //'<a href="mailto:' + esc(SITE.email) + '">联系</a>' +
        '</nav>';
    }

    var foot = document.getElementById('foot');
    if (foot) {
      foot.innerHTML =
        '<div class="wrap">' +
        '<div class="foot-grid">' +
        '<div class="dis"><strong style="color:var(--text-dim);font-weight:400">免责与说明</strong><br>' +
        esc(SITE.disclaimer) + '</div>' +
        '<div class="col">' +
        '<a href="index.html">首页</a>' +
        '<a href="articles.html">全部推荐</a>' +
        //'<a href="about.html">评测方法</a>' +
        '<a href="mailto:' + esc(SITE.email) + '">' + esc(SITE.email) + '</a>' +
        '</div>' +
        '</div>' +
        '<div class="mono copy">' + esc(SITE.name) + ' · ' + esc(SITE.enName) +
        ' &nbsp;/&nbsp; ' + (SITE.since || '') + '–' + new Date().getFullYear() +
        ' &nbsp;/&nbsp; ' + esc(SITE.author) + '</div>' +
        '</div>';
    }
  }

  /* ---------- 卡片 ---------- */

  function cardHtml(p) {
    var sc = totalScore(p);
    return '<a class="card reveal" href="' + articleUrl(p.slug) + '">' +
      '<div class="meta">' +
      '<span>' + esc(p.date) + '</span>' +
      (sc !== null ? '<span class="score">' + sc.toFixed(1) + '</span>' : '') +
      '<span>' + esc(p.platform || '') + '</span>' +
      '</div>' +
      '<h3>' + esc(p.title) + '</h3>' +
      '<p>' + esc(p.abstract) + '</p>' +
      '<div class="tags">' +
      (p.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
      '</div></a>';
  }

  /* ---------- 首页 ---------- */

  function renderHome() {
    var list = sorted();
    var pinned = list.filter(function (p) { return p.pinned; })[0] || list[0];
    var rest = list.filter(function (p) { return p !== pinned; });

    var hero = document.getElementById('hero');
    if (hero) {
      var tags = {};
      list.forEach(function (p) { (p.tags || []).forEach(function (t) { tags[t] = 1; }); });
      hero.innerHTML =
        '<p class="kicker">' + esc(SITE.enName) + ' / 新鲜资源分享</p>' +
        '<h1>' + esc(SITE.tagline) + '</h1>' +
        '<p class="lead">' + esc(SITE.intro) + '</p>' +
        '<div class="hero-cta">' +
        '<a class="btn primary" href="' + articleUrl(pinned.slug) + '">最新一篇 · ' + esc(pinned.title.slice(0, 18)) + '…</a>' +
        '<a class="btn" href="articles.html">浏览全部 ' + list.length + ' 篇</a>' +
        '</div>' +
        '<div class="stats">' +
        '<div><div class="k">recommendations</div><div class="v">' + list.length + ' 篇评测</div></div>' +
        '<div><div class="k">topics</div><div class="v">' + Object.keys(tags).length + ' 个主题</div></div>' +
        '<div><div class="k">purpose</div><div class="v">资源分享</div></div>' +
        '</div>';
    }

    var featureBox = document.getElementById('featured');
    if (featureBox && pinned) {
      featureBox.innerHTML = cardHtml(pinned);
    }

    var latestBox = document.getElementById('latest');
    if (latestBox) {
      latestBox.innerHTML = rest.map(cardHtml).join('');
    }
  }

  /* ---------- 列表页 ---------- */

  function renderList() {
    var root = document.getElementById('list');
    if (!root) return;

    var list = sorted();
    var tagSet = [];
    list.forEach(function (p) {
      (p.tags || []).forEach(function (t) { if (tagSet.indexOf(t) === -1) tagSet.push(t); });
    });

    var bars = document.getElementById('filters');
    bars.innerHTML =
      '<div class="search-box"><input id="q" type="search" placeholder="搜索标题、摘要、标签…" autocomplete="off"></div>' +
      '<button class="tag on" data-tag="">全部</button>' +
      tagSet.map(function (t) { return '<button class="tag" data-tag="' + esc(t) + '">' + esc(t) + '</button>'; }).join('');

    var grid = document.getElementById('grid');
    var count = document.getElementById('count');

    var state = { q: '', tag: '' };

    function apply() {
      var q = state.q.trim().toLowerCase();
      var out = list.filter(function (p) {
        var hay = [p.title, p.subtitle, p.abstract, (p.tags || []).join(' '), p.platform, p.license].join(' ').toLowerCase();
        var okQ = !q || hay.indexOf(q) > -1;
        var okT = !state.tag || (p.tags || []).indexOf(state.tag) > -1;
        return okQ && okT;
      });
      grid.innerHTML = out.length
        ? out.map(cardHtml).join('')
        : '<p class="dim" style="grid-column:1/-1;padding:40px 0">没有匹配的推荐，换个关键词试试。</p>';
      if (count) count.textContent = '共 ' + out.length + ' 篇';
      observeReveal();
    }

    bars.addEventListener('input', function (e) {
      if (e.target.id === 'q') { state.q = e.target.value; apply(); }
    });

    bars.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tag]');
      if (!b) return;
      state.tag = b.getAttribute('data-tag');
      Array.prototype.forEach.call(bars.querySelectorAll('.tag'), function (x) {
        x.classList.toggle('on', x === b);
      });
      apply();
    });

    var preset = param('tag');
    if (preset) {
      var btn = bars.querySelector('[data-tag="' + preset.replace(/"/g, '\\"') + '"]');
      if (btn) btn.click();
    }
    apply();
  }

  /* ---------- 文章页 ---------- */

  function blockHtml(b) {
    switch (b.type) {
      case 'h2':
        return '<h2 id="' + slugify(b.text) + '">' + esc(b.text) + '</h2>';
      case 'h3':
        return '<h3 id="' + slugify(b.text) + '">' + esc(b.text) + '</h3>';
      case 'p':
        return '<p>' + esc(b.text) + '</p>';
      case 'ul':
        return '<ul>' + (b.items || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
      case 'ol':
        return '<ol>' + (b.items || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>';
      case 'note':
        return '<div class="note">' + esc(b.text) + '</div>';
      case 'quote':
        return '<div class="quote">' + esc(b.text) + '</div>';
      case 'table':
        return '<table><thead><tr>' +
          (b.head || []).map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' +
          (b.rows || []).map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
          }).join('') +
          '</tbody></table>';
      default:
        return '';
    }
  }

  function slugify(text) {
    return 'sec-' + String(text).replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
  }

  function renderArticle() {
    var root = document.getElementById('article');
    if (!root) return;

    var list = sorted();
    var wanted = param('slug');
    var idx = -1;
    list.forEach(function (p, i) { if (p.slug === wanted) idx = i; });
    if (idx === -1) idx = 0;
    var post = list[idx];

    document.title = post.title + ' · ' + SITE.name;

    var sc = totalScore(post);

    var meta = [
      '<span>作者 <b>' + esc(SITE.author) + '</b></span>',
      '<span>发布 <b>' + esc(post.date) + '</b></span>',
      '<span>平台 <b>' + esc(post.platform || '—') + '</b></span>',
      '<span>授权 <b>' + esc(post.license || '—') + '</b></span>',
      '<span>约 <b>' + esc(post.readTime || '—') + ' 分钟</b></span>'
    ].join('');

    var scorePanel = '';
    if (sc !== null && post.scores) {
      scorePanel =
        '<div class="score-panel">' +
        '<div class="top"><span class="label">加权综合评分</span>' +
        '<span class="total">' + sc.toFixed(1) + '<i>/ 10</i></span></div>' +
        '<div class="bars">' +
        post.scores.map(function (d) {
          var pct = Math.max(0, Math.min(10, Number(d.value) || 0)) * 10;
          return '<div class="bar-row"><span class="n">' + esc(d.name) + '</span>' +
            '<span class="track"><span class="fill" data-w="' + pct + '"></span></span>' +
            '<span class="v">' + (Number(d.value) || 0).toFixed(1) + ' · ' + esc(d.weight) + '%</span></div>';
        }).join('') +
        '</div></div>';
    }

    var linkPanel = '';
    if (post.links && post.links.length) {
      linkPanel =
        '<div class="links-panel">' +
        '<h4>官方资源与下载</h4>' +
        '<div class="links-list">' +
        post.links.map(function (l) {
          return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' +
            '<span>' + esc(l.label) + '</span>' +
            '<span class="host">' + esc(urlHost(l.url)) + ' ↗</span></a>';
        }).join('') +
        '</div></div>';
    }

    var prev = list[idx - 1];
    var next = list[idx + 1];

    root.innerHTML =
      '<div class="crumb"><a href="index.html">首页</a> / <a href="articles.html">全部推荐</a> / ' + esc(post.slug) + '</div>' +
      '<h1>' + esc(post.title) + '</h1>' +
      (post.subtitle ? '<p class="sub">' + esc(post.subtitle) + '</p>' : '') +
      '<div class="meta-row">' + meta + '</div>' +
      '<div class="tags" style="margin-top:18px">' +
      (post.tags || []).map(function (t) {
        return '<a class="tag" href="articles.html?tag=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
      }).join('') + '</div>' +
      '<div class="abstract"><h4>摘要</h4><p>' + esc(post.abstract) + '</p></div>' +
      scorePanel +
      '<div class="prose">' + (post.body || []).map(blockHtml).join('') + '</div>' +
      linkPanel +
      '<div class="pager">' +
      (prev ? '<a href="' + articleUrl(prev.slug) + '"><span class="dir">← 更新的一篇</span><span class="t">' + esc(prev.title) + '</span></a>'
            : '<a class="ph" href="#"></a>') +
      (next ? '<a href="' + articleUrl(next.slug) + '"><span class="dir">更早的一篇 →</span><span class="t">' + esc(next.title) + '</span></a>'
            : '<a class="ph" href="#"></a>') +
      '</div>';

    buildToc();
  }

  function buildToc() {
    var toc = document.getElementById('toc');
    if (!toc) return;
    var heads = Array.prototype.slice.call(document.querySelectorAll('.prose h2'));
    if (heads.length < 2) { toc.style.display = 'none'; return; }
    toc.innerHTML = '<div class="t-label">目录</div><ol>' +
      heads.map(function (h) {
        return '<li><a href="#' + h.id + '">' + esc(h.textContent) + '</a></li>';
      }).join('') + '</ol>';

    var links = Array.prototype.slice.call(toc.querySelectorAll('a'));
    function spy() {
      var cur = 0;
      heads.forEach(function (h, i) {
        if (h.getBoundingClientRect().top < 140) cur = i;
      });
      links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    }
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  /* ---------- 入场动画 ---------- */

  var io = null;
  function observeReveal() {
    var nodes = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, function (n) { n.classList.add('in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
    setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.in)'), function (n) {
        n.classList.add('in');
      });
    }, 1200);
  }

  function animateBars() {
    var fills = document.querySelectorAll('.bar-row .fill');
    if (!fills.length) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(fills, function (f) {
          f.style.width = (f.getAttribute('data-w') || 0) + '%';
        });
      });
    });
  }

  function progressBar() {
    var el = document.getElementById('progress');
    if (!el) return;
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) : 0;
      el.style.width = Math.max(0, Math.min(1, p)) * 100 + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* ---------- 启动 ---------- */

  function boot() {
    renderChrome();
    var page = document.body.getAttribute('data-page');
    if (page === 'home') renderHome();
    if (page === 'list') renderList();
    if (page === 'article') renderArticle();
    observeReveal();
    animateBars();
    progressBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
