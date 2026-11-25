/* Wolf Clips sources page. Generated and published by the shorts pipeline — edits made
   directly in the public repo are overwritten on the next sync.

   Safety rules this file keeps:
   - Pasted text is only used to LOOK UP an id in clips.json; it never becomes a destination.
   - The only redirect target is https://youtu.be/<11-char id>?t=<seconds>, rebuilt here from
     clips.json and re-validated before use.
   - Nothing is ever inserted as HTML: all text goes in via textContent. */
(function () {
  "use strict";
  var ID_RE = /^[A-Za-z0-9_-]{11}$/;
  var LINK_RE = /(?:shorts\/|youtu\.be\/|[?&]v=|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/;
  var TARGET_RE = /^https:\/\/youtu\.be\/[A-Za-z0-9_-]{11}\?t=\d{1,6}$/;
  var CODE_RE = /^[a-z0-9-]{2,40}$/;
  // Phones: Android/iOS only hand a link to the YouTube app when the link itself is TAPPED.
  // A redirect a moment later stays in the browser (in-app browsers show a black player),
  // so on phones we never auto-redirect — the user taps a real link instead.
  var PHONE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "") ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  var data = null, byId = {}, byLower = {}, filter = "";
  var $ = function (id) { return document.getElementById(id); };

  var MOODS = {
    hello: "assets/mascot/hello.png", happy: "assets/mascot/happy.png",
    excited: "assets/mascot/excited.png", confused: "assets/mascot/confused.png",
    thinking: "assets/mascot/thinking.png"
  };
  function mood(name, text) {
    var img = $("mascot");
    if (img && MOODS[name]) {
      img.src = MOODS[name];
      img.classList.remove("pop"); void img.offsetWidth; img.classList.add("pop");
    }
    if (text != null && $("bubble")) $("bubble").textContent = text;
  }

  // ---- counting (GoatCounter pixel; no third-party script is loaded) -------------------
  function count(path, isEvent, title) {
    try {
      var code = data && data.counter;
      if (!code || !CODE_RE.test(code)) return;
      var q = "p=" + encodeURIComponent(path) + (isEvent ? "&e=true" : "") +
        (title ? "&t=" + encodeURIComponent(String(title).slice(0, 120)) : "") +
        "&rnd=" + Math.random().toString(36).slice(2);
      var img = new Image();
      img.referrerPolicy = "no-referrer";
      img.src = "https://" + code + ".goatcounter.com/count?" + q;
    } catch (e) { /* counting must never break the page */ }
  }

  // ---- lookup ----------------------------------------------------------------------------
  function extractId(text) {
    text = String(text || "").trim();
    var m = text.match(LINK_RE);
    if (m) return m[1];
    return ID_RE.test(text) ? text : null;
  }
  function find(id) {
    if (!id) return null;
    if (byId[id]) return byId[id];
    var hit = byLower[id.toLowerCase()];
    return hit && hit.length === 1 ? hit[0] : null; // case slips only if unambiguous
  }
  function targetOf(clip) {
    var lead = Math.max(0, Math.min(60, parseInt(data.lead, 10) || 0));
    var t = Math.max(0, Math.floor(Number(clip.t) || 0) - lead);
    var url = "https://youtu.be/" + clip.o + "?t=" + t;
    return TARGET_RE.test(url) ? appLinks(clip.o, t) : null;
  }

  // ---- open in the YouTube APP, not the in-app/web browser --------------------------------
  // Everyone here came from the YouTube app, so on phones we hand the video straight back to
  // it: an Android intent (with the web link as Android's own fallback) or iOS's youtube://
  // scheme. Only if the page is still showing a moment later (app missing / launch blocked)
  // do we fall back to the normal web link. Links are rebuilt from a validated id + seconds.
  function appLinks(id, t) {
    var web = "https://youtu.be/" + id + "?t=" + t;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || !/^\d{1,6}$/.test(String(t))) return null;
    var ua = navigator.userAgent || "";
    var watch = "www.youtube.com/watch?v=" + id + "&t=" + t;
    if (/Android/i.test(ua)) {
      // Only Chrome (and Chrome-based in-app tabs) handle intent:// links. Brave, Firefox,
      // Samsung Internet & co. show an error page for them, so they get the normal YouTube
      // link, which Android opens in the YouTube app (or the browser asks to).
      var chrome = /Chrome\/\d/.test(ua) && !/EdgA|OPR|SamsungBrowser|Firefox|YaBrowser|DuckDuckGo|Vivaldi/i.test(ua)
                   && !(navigator.brave && typeof navigator.brave.isBrave === "function");
      if (!chrome) return { web: "https://www.youtube.com/watch?v=" + id + "&t=" + t + "s", app: null, t: t };
      return { web: web, app: "intent://" + watch + "#Intent;scheme=https;package=com.google.android.youtube;" +
               "S.browser_fallback_url=" + encodeURIComponent(web) + ";end", t: t };
    }
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      return { web: web, app: "youtube://" + watch, t: t };
    }
    return { web: web, app: null, t: t };
  }
  function openOriginal(links) {
    if (!links.app) { window.location.replace(links.web); return; }
    var left = false;
    var mark = function () { left = true; };
    window.addEventListener("pagehide", mark);
    window.addEventListener("blur", mark);            // iOS "Open in YouTube?" prompt
    document.addEventListener("visibilitychange", function () { if (document.hidden) left = true; });
    window.location.href = links.app;
    setTimeout(function () { if (!left && !document.hidden) window.location.replace(links.web); }, 2500);
  }

  // The whole original video, right here, starting a moment before the Short's part.
  function player(id, t) {
    if (!ID_RE.test(id) || !/^\d{1,6}$/.test(String(t))) return null;
    var wrap = document.createElement("div"); wrap.className = "player";
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?start=" + t +
            "&autoplay=1&playsinline=1&rel=0&modestbranding=1";
    f.title = "Full video";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.setAttribute("allowfullscreen", "");
    f.referrerPolicy = "strict-origin-when-cross-origin";
    wrap.appendChild(f);
    return wrap;
  }

  function showResult(kind, title, text, links, clip) {
    var box = $("result");
    box.hidden = false;
    box.className = "result " + kind;
    box.textContent = "";
    var b = document.createElement("b"); b.textContent = title; box.appendChild(b);
    if (text) { var p = document.createElement("span"); p.textContent = text; box.appendChild(p); }
    if (clip && links) {
      var pl = player(clip.o, links.t);
      if (pl) box.appendChild(pl);
    }
    if (links) {
      var a = document.createElement("a");
      a.className = "btn main"; a.href = links.app || links.web; a.rel = "noopener";
      a.textContent = links.app ? "Open in the YouTube app ▶" : "Watch on YouTube ▶";
      box.appendChild(document.createElement("br")); box.appendChild(a);
      if (links.app) {
        var w = document.createElement("a");
        w.className = "alt"; w.href = links.web; w.rel = "noopener";
        w.textContent = "or watch in the browser";
        box.appendChild(w);
      }
    }
  }

  function go(clip, how) {
    var links = targetOf(clip);
    if (!links) { showResult("miss", "That clip's original link looks broken.", ""); return; }
    var label = (clip.source_title || clip.title || "") + (clip.creator ? " — " + clip.creator : "");
    // The whole original plays right here (from the Short's moment). The button below opens
    // it in the YouTube app / on YouTube instead — a real tap, which phones need for the app.
    count("go/" + clip.s, true, clip.title);
    mood("excited", "Found it! Here's the full video.");
    showResult("ok", "Found it — the full video:", label, links, clip);
    var btn = $("result").querySelector(".btn.main");
    if (btn) btn.addEventListener("click", function () { count("app/" + clip.s, true, clip.title); });
    var pl = $("result").querySelector(".player");
    (pl || $("result")).scrollIntoView({ block: "start", behavior: how === "auto" ? "auto" : "smooth" });
  }

  function lookup(raw, how) {
    var id = extractId(raw);
    if (!id) {
      count("paste-bad", true);
      mood("confused", "Hmm, that doesn't look like a YouTube link.");
      showResult("miss", "That doesn't look like a Short link.",
        "On the Short, tap Share → Copy link, then paste it here.");
      return;
    }
    var clip = find(id);
    if (!clip) {
      count("paste-miss", true);
      mood("confused", "I can't find that one yet…");
      showResult("miss", "I can't find that clip yet.",
        "If it was just posted, give it a minute and try again. Or pick it from the latest clips below.");
      return;
    }
    count("paste-hit", true);
    go(clip, how);
  }

  // ---- list ------------------------------------------------------------------------------
  function isNew(at) {
    var t = Date.parse(at || "");
    return t && Date.now() - t < 36 * 3600 * 1000;
  }
  function playShort(box, clip) {
    if (!ID_RE.test(clip.s)) return;
    count("play/" + clip.s, true, clip.title);
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + clip.s + "?autoplay=1&playsinline=1&rel=0&modestbranding=1";
    f.title = clip.title || "Short";
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.setAttribute("allowfullscreen", "");
    f.referrerPolicy = "strict-origin-when-cross-origin";
    var wrap = document.createElement("div"); wrap.className = "thumb playing";
    wrap.appendChild(f);
    box.replaceWith(wrap);
  }

  function renderFilters() {
    var box = $("filters"); box.textContent = "";
    var names = [];
    data.clips.forEach(function (c) { if (c.creator && names.indexOf(c.creator) < 0) names.push(c.creator); });
    if (names.length < 2) return;
    [""].concat(names).forEach(function (n) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip" + (n === filter ? " on" : "");
      b.textContent = n || "All";
      b.addEventListener("click", function () { filter = n; renderFilters(); renderList(); });
      box.appendChild(b);
    });
  }
  function renderList() {
    var list = $("list"); list.textContent = "";
    var items = data.clips.filter(function (c) { return !filter || c.creator === filter; }).slice(0, 60);
    if (!items.length) {
      var p = document.createElement("p"); p.className = "empty";
      p.textContent = "No clips here yet — check back soon!"; list.appendChild(p); return;
    }
    items.forEach(function (c) {
      var card = document.createElement("article"); card.className = "clip";
      // Thumbnail first; YouTube's player loads only when tapped (fast page, fewer cookies).
      var th = document.createElement("button"); th.type = "button"; th.className = "thumb";
      th.setAttribute("aria-label", "Play the Short");
      var img = document.createElement("img"); img.loading = "lazy"; img.alt = "";
      img.src = "https://i.ytimg.com/vi/" + c.s + "/hqdefault.jpg"; th.appendChild(img);
      var play = document.createElement("span"); play.className = "play"; play.textContent = "▶";
      th.appendChild(play);
      th.addEventListener("click", function () { playShort(th, c); });
      if (isNew(c.at)) { var n = document.createElement("span"); n.className = "new"; n.textContent = "New"; th.appendChild(n); }
      var meta = document.createElement("div"); meta.className = "meta";
      var t = document.createElement("div"); t.className = "t"; t.textContent = c.title || "Clip";
      var cr = document.createElement("div"); cr.className = "c"; cr.textContent = c.creator || "";
      // The full video plays at the top of the page (with an "Open in the YouTube app" link).
      var b = document.createElement("button"); b.type = "button"; b.className = "btn small";
      b.addEventListener("click", function () { $("link").value = "https://youtube.com/shorts/" + c.s; go(c, "click"); });
      b.textContent = "Watch full video ▶";
      meta.appendChild(t); if (c.creator) meta.appendChild(cr); meta.appendChild(b);
      card.appendChild(th); card.appendChild(meta); list.appendChild(card);
    });
  }

  // ---- wiring ----------------------------------------------------------------------------
  function load() {
    return fetch("clips.json?ts=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var originals = d.originals || {};
        d.clips = (d.clips || []).map(function (c) {
          if (!c.short) return c;                        // v1 entry (old cached file)
          var o = originals[c.original.id] || {};
          return { s: c.short.id, title: c.short.title, at: c.short.posted,
                   o: c.original.id, t: c.original.start,
                   source_title: o.title || "", creator: o.creator || "" };
        }).filter(function (c) { return ID_RE.test(c.s) && ID_RE.test(c.o); });
        data = d; byId = {}; byLower = {};
        d.clips.forEach(function (c) {
          byId[c.s] = c;
          (byLower[c.s.toLowerCase()] = byLower[c.s.toLowerCase()] || []).push(c);
        });
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var ex = $("howtoEx");
    if (ex) ex.textContent = window.location.origin + window.location.pathname.replace(/[^\/]*$/, "") +
                             "https://youtube.com/shorts/…";
    $("finder").addEventListener("submit", function (e) { e.preventDefault(); if (data) lookup($("link").value, "submit"); });
    $("pasteBtn").addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (txt) {
          $("link").value = txt || "";
          if (txt && data) lookup(txt, "paste");
        }).catch(function () { $("link").focus(); mood("thinking", "Long-press the box and tap Paste."); });
      } else { $("link").focus(); mood("thinking", "Long-press the box and tap Paste."); }
    });
    $("link").addEventListener("paste", function () {
      setTimeout(function () { if (data && extractId($("link").value)) lookup($("link").value, "paste"); }, 0);
    });

    load().then(function () {
      count("/", false, document.title);
      renderFilters(); renderList();
      var q = new URLSearchParams(window.location.search);
      var s = q.get("s") || q.get("u") || q.get("url") || q.get("v") || "";
      if (!s) {           // a link pasted right after the address: ?https://… or #https://…
        var raw = "";
        try { raw = decodeURIComponent(window.location.search.slice(1) + " " + window.location.hash.slice(1)); }
        catch (e) { raw = window.location.search.slice(1) + " " + window.location.hash.slice(1); }
        s = extractId(raw.trim()) || "";
      }
      if (s) { $("link").value = s; lookup(s, "auto"); }
      else mood("hello", data.clips.length ? "Hey! Paste a Short's link and I'll find the full video."
                                         : "Hey! Clips are coming soon.");
    }).catch(function () {
      mood("confused", "Couldn't load the clips — refresh in a moment?");
      $("list").textContent = "";
    });
  });
})();
