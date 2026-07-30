(function () {
  "use strict";

  // Safety rules for this file:
  // 1. NEVER move/reparent an existing DOM node that Mintlify's native
  //    components render (appendChild/insertBefore on a node already in the
  //    tree). Conflicts with React's reconciliation, can blank out panels.
  // 2. Hiding an existing node with CSS (display: none) is fine - it stays
  //    in the tree, React can still find/patch it later.
  // 3. Inserting a brand-new node (cloneNode/createElement, never seen by
  //    React) next to an existing one is fine.
  // 4. NEVER hide anything found via a page-wide "first match" text search
  //    without confirming it's actually small/local - the left nav sidebar
  //    repeats "GET"/"POST"/etc. badges for every endpoint link, so a naive
  //    global search for the HTTP method text will match the sidebar, not
  //    the request-line bar, and climbing from there to find a common
  //    ancestor with the real "Try it" button can land on a huge wrapper
  //    (e.g. the whole page layout) - hiding it blanks the entire page.
  //    This happened on 2026-07-30; see feedback_mintlify_dom_manipulation.md
  // Search outward from a specific known anchor (like the "Try it" button)
  // instead, and hard-check the candidate container is actually small
  // before ever touching its visibility.

  var TARGET_PATH = "/docs/api/management/v2/jobs/post-users-imports";
  var LANGUAGE_LABELS = ["cURL", "Curl", "JavaScript", "Python", "Node", "Node.js", "PHP", "Java", "Go", "Ruby", "C#"];
  var HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  var MAX_BAR_DESCENDANTS = 40; // safety cap - the real request-line bar is a handful of elements

  function isTargetPage() {
    return window.location.pathname.indexOf(TARGET_PATH) === 0;
  }

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

  // Only ever matches the FIRST "Try it" leaf; there should only be one on
  // an endpoint page. Does not search for HTTP method text globally - that's
  // the part that broke before (sidebar nav repeats method badges).
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

  // Grows OUTWARD from the "Try it" button (not from a global text search)
  // until it finds an ancestor whose descendants include an HTTP method
  // badge - i.e. the smallest container holding both. This stays local to
  // the request-line bar and never reaches all the way to the sidebar.
  function findRequestLineBar(tryIt, maxDepth) {
    var ancestor = tryIt.parentElement;
    var depth = 0;
    while (ancestor && depth < maxDepth) {
      var leaves = leafTextElements(ancestor);
      for (var i = 0; i < leaves.length; i++) {
        if (HTTP_METHODS.indexOf(leaves[i].text) !== -1) {
          return ancestor;
        }
      }
      ancestor = ancestor.parentElement;
      depth++;
    }
    return null;
  }

  function moveRequestLineAboveCodeSample() {
    var tryIt = findTryItAnchor(document.body);
    if (!tryIt) return "tryit-not-found";

    var bar = findRequestLineBar(tryIt, 6);
    if (!bar) return "bar-not-found";
    if (bar.dataset.aduShadowed === "1") return "already-done";

    var badge = findLanguageBadge(document.body);
    if (!badge) return "badge-not-found";

    var headerRow = climbToRow(badge, 2, 4);
    var card = headerRow ? headerRow.parentElement : null;
    if (!card || !card.parentElement) return "card-not-found";

    // Hard safety checks before touching anything's visibility.
    if (bar.contains(card) || bar.contains(badge)) return "bar-too-large-contains-card";
    var descendantCount = bar.querySelectorAll("*").length;
    if (descendantCount > MAX_BAR_DESCENDANTS) return "bar-too-large-" + descendantCount + "-descendants";

    var clone = bar.cloneNode(true);
    clone.className += " adu-shadow-request-bar";
    clone.style.setProperty("box-sizing", "border-box", "important");
    clone.style.setProperty("margin-left", "0", "important");
    clone.style.setProperty("margin-right", "0", "important");
    bar.dataset.aduShadowed = "1";
    bar.style.display = "none";

    // Keep the clone's width in sync with the card's ACTUAL rendered width
    // on an ongoing basis (not a one-time snapshot) - the card may have its
    // own width constraint independent of the shared parent, and this needs
    // to keep matching across window resizes / sidebar toggles.
    function syncWidth() {
      var cardWidth = card.getBoundingClientRect().width;
      clone.style.setProperty("width", cardWidth + "px", "important");
      clone.style.setProperty("max-width", cardWidth + "px", "important");
    }
    syncWidth();
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(syncWidth).observe(card);
    } else {
      window.addEventListener("resize", syncWidth);
    }

    // The clone has no event listeners (cloneNode doesn't copy them), so
    // wire its "Try it" button to trigger the real hidden one instead of
    // trying to reimplement the playground's open/submit behavior.
    var cloneTryIt = findTryItAnchor(clone);
    if (cloneTryIt) {
      cloneTryIt.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        tryIt.click();
      });
    }

    card.parentElement.insertBefore(clone, card);
    return cloneTryIt ? "ok" : "ok-no-tryit-wiring";
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
