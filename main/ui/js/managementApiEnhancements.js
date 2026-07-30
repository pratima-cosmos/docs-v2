(function () {
  "use strict";

  // Safety rule for this file: NEVER move/reparent an existing DOM node that
  // Mintlify's native components render (appendChild/insertBefore on a node
  // that's already in the tree). That conflicts with React's reconciliation
  // and can blank out entire panels. Only these mutation styles are allowed:
  //   1. set style/attributes on an existing node in place
  //   2. hide an existing node with CSS (display: none) - does not remove it
  //      from the tree, so React can still find/patch it later
  //   3. insert a brand-new node (never seen by React, e.g. via cloneNode or
  //      createElement) next to an existing one
  // See ~/.claude/projects/-Users-pratima-rajput/memory/feedback_mintlify_dom_manipulation.md

  // TEMPORARY: scoped to a single page while we confirm this approach works.
  // Widen back to /docs/api/management once confirmed.
  var TARGET_PATH = "/docs/api/management/v2/jobs/post-users-imports";
  var LANGUAGE_LABELS = ["cURL", "Curl", "JavaScript", "Python", "Node", "Node.js", "PHP", "Java", "Go", "Ruby", "C#"];
  var HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  function isTargetPage() {
    return window.location.pathname.indexOf(TARGET_PATH) === 0;
  }

  // TEMPORARY diagnostic: an unmistakable on-page marker so we can tell at a
  // glance whether this script executed and what it found. Remove once confirmed.
  function showDiagnosticBanner(message, color) {
    var id = "adu-diagnostic-banner";
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.style.position = "fixed";
      el.style.top = "8px";
      el.style.right = "8px";
      el.style.zIndex = "999999";
      el.style.padding = "6px 10px";
      el.style.borderRadius = "6px";
      el.style.fontFamily = "monospace";
      el.style.fontSize = "12px";
      el.style.color = "#fff";
      el.style.maxWidth = "60vw";
      document.body.appendChild(el);
    }
    el.style.background = color;
    el.textContent = message;
  }

  function leafTextElements(root) {
    var out = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.children.length > 0) continue;
      var text = (node.textContent || "").trim();
      if (text) out.push({ el: node, text: text });
    }
    return out;
  }

  function findLanguageBadge(root) {
    var leaves = leafTextElements(root);
    for (var i = 0; i < leaves.length; i++) {
      if (LANGUAGE_LABELS.indexOf(leaves[i].text) !== -1) return leaves[i].el;
    }
    return null;
  }

  function findTryItAnchor(root) {
    var leaves = leafTextElements(root);
    for (var i = 0; i < leaves.length; i++) {
      if (leaves[i].text === "Try it") {
        return leaves[i].el.closest("button") || leaves[i].el;
      }
    }
    return null;
  }

  function climbToRow(el, minChildren, maxDepth) {
    var row = el.parentElement;
    var depth = 0;
    while (row && row.children.length < minChildren && depth < maxDepth) {
      row = row.parentElement;
      depth++;
    }
    return row;
  }

  // Finds the request-line bar: the row containing both the HTTP method
  // badge (e.g. "POST") and the "Try it" button.
  function findRequestLineBar(root) {
    var tryIt = findTryItAnchor(root);
    if (!tryIt) return null;
    var leaves = leafTextElements(root);
    var methodLeaf = null;
    for (var i = 0; i < leaves.length; i++) {
      if (HTTP_METHODS.indexOf(leaves[i].text) !== -1) {
        methodLeaf = leaves[i].el;
        break;
      }
    }
    if (!methodLeaf) return null;
    // the bar is the closest common ancestor of the method badge and Try it
    var bar = methodLeaf;
    for (var depth = 0; depth < 6 && bar; depth++) {
      if (bar.contains(tryIt)) return bar;
      bar = bar.parentElement;
    }
    return null;
  }

  // Purely visual duplication: hides the original request-line bar in place
  // (CSS only, node stays in the tree) and inserts a fresh clone directly
  // above the code-sample card. The clone is a new node React never tracked,
  // so this never reparents anything React owns.
  function moveRequestLineAboveCodeSample() {
    var bar = findRequestLineBar(document.body);
    if (!bar) return "bar-not-found";
    if (bar.dataset.aduShadowed === "1") return "already-done";

    var badge = findLanguageBadge(document.body);
    if (!badge) return "badge-not-found";

    var headerRow = climbToRow(badge, 2, 4);
    var card = headerRow ? headerRow.parentElement : null;
    if (!card || !card.parentElement) return "card-not-found";

    var clone = bar.cloneNode(true);
    clone.className += " adu-shadow-request-bar";
    bar.dataset.aduShadowed = "1";
    bar.style.display = "none";

    card.parentElement.insertBefore(clone, card);
    return "ok";
  }

  function enhance() {
    if (!isTargetPage()) {
      showDiagnosticBanner("adu script loaded, wrong page: " + window.location.pathname, "#888");
      return;
    }
    try {
      var result = moveRequestLineAboveCodeSample();
      showDiagnosticBanner("adu request-line move: " + result, result === "ok" ? "#2e7d32" : "#b8860b");
    } catch (e) {
      showDiagnosticBanner("adu error: " + e.message, "#c0392b");
    }
  }

  var scheduled = false;
  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      enhance();
    }, 150);
  }

  var observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.body, { childList: true, subtree: true });
  scheduleEnhance();
})();
