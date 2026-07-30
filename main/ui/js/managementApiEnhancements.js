(function () {
  "use strict";

  // Safety rule for this file: NEVER move/reparent an existing DOM node that
  // Mintlify's native components render (appendChild/insertBefore on a node
  // that's already in the tree). That conflicts with React's reconciliation
  // and can blank out entire panels. Only two mutation styles are allowed:
  //   1. set style/attributes on an existing node in place
  //   2. insert a brand-new node (never seen by React) next to an existing one
  // See ~/.claude/projects/-Users-pratima-rajput/memory/feedback_mintlify_dom_manipulation.md

  // TEMPORARY: scoped to a single page while we confirm the script actually
  // loads/runs at all. Widen back to /docs/api/management once confirmed.
  var TARGET_PATH = "/docs/api/management/v2/jobs/post-users-imports";
  var LANGUAGE_LABELS = ["cURL", "Curl", "JavaScript", "Python", "Node", "Node.js", "PHP", "Java", "Go", "Ruby", "C#"];
  var AUTOFILL_MAP = {
    domain: "{yourDomain}",
    "tenant domain": "{yourDomain}",
    tenant: "{yourTenant}",
    "tenant name": "{yourTenant}",
    client_id: "{yourClientId}",
    "client id": "{yourClientId}",
    clientid: "{yourClientId}",
  };

  function isTargetPage() {
    return window.location.pathname.indexOf(TARGET_PATH) === 0;
  }

  // TEMPORARY diagnostic: an unmistakable on-page marker so we can tell at a
  // glance whether this script executed at all, independent of whether the
  // badge/toggle logic below finds the right elements. Remove once confirmed.
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
      document.body.appendChild(el);
    }
    el.style.background = color;
    el.textContent = message;
  }

  function setNativeValue(el, value) {
    var proto = Object.getPrototypeOf(el);
    var setter = Object.getOwnPropertyDescriptor(proto, "value");
    if (setter && setter.set) {
      setter.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function findLanguageBadge(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.children.length > 0) continue; // leaf-ish label element
      var text = (node.textContent || "").trim();
      for (var i = 0; i < LANGUAGE_LABELS.length; i++) {
        if (text === LANGUAGE_LABELS[i]) return node;
      }
    }
    return null;
  }

  // Pushes the code-sample language badge to the right/end of its row using
  // the CSS `order` property — this only touches style, never the DOM tree,
  // so it can't conflict with how Mintlify's own React tree is structured.
  function repositionLanguageBadge() {
    var badge = findLanguageBadge(document.body);
    if (!badge) return false;

    var item = badge.closest("button, [role='tab'], [role='button']") || badge;
    var row = item.parentElement;
    var depth = 0;
    while (row && row.children.length < 2 && depth < 4) {
      row = row.parentElement;
      depth++;
    }
    if (!row) return false;

    Array.prototype.forEach.call(row.children, function (child, i) {
      if (child === item) return;
      if (!child.style.order) child.style.setProperty("order", String(i + 1), "important");
    });
    item.style.setProperty("order", "9999", "important");
    return true;
  }

  function labelText(el) {
    return (el.textContent || "").trim().toLowerCase();
  }

  function findInputForLabel(label) {
    if (label.htmlFor) {
      var byId = document.getElementById(label.htmlFor);
      if (byId) return byId;
    }
    var input = label.querySelector("input, textarea, select");
    if (input) return input;
    var sibling = label.nextElementSibling;
    if (sibling && /input|textarea|select/i.test(sibling.tagName)) return sibling;
    if (sibling) {
      var nested = sibling.querySelector && sibling.querySelector("input, textarea, select");
      if (nested) return nested;
    }
    return null;
  }

  function applyAutofill(root) {
    if (!window.rootStore || !window.rootStore.variableStore) return 0;
    var values = window.rootStore.variableStore.values;
    var labels = root.querySelectorAll("label");
    var filled = 0;
    for (var i = 0; i < labels.length; i++) {
      var key = labelText(labels[i]);
      var placeholder = AUTOFILL_MAP[key];
      if (!placeholder) continue;
      var value = values.get ? values.get(placeholder) : null;
      if (!value || value === placeholder) continue; // no real value resolved yet
      var input = findInputForLabel(labels[i]);
      if (!input || input.tagName === "SELECT") continue;
      setNativeValue(input, value);
      filled++;
    }
    return filled;
  }

  function findTryItAnchor(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.children.length > 0) continue;
      if ((node.textContent || "").trim() === "Try it") {
        return node.closest("button") || node;
      }
    }
    return null;
  }

  // Inserts a brand-new element next to an existing one. This is safe: the
  // new node was never part of React's tree, so there's nothing for React to
  // lose track of. It's the mirror-image of the forbidden "move an existing
  // node" operation above.
  function mountAutofillToggle() {
    if (document.querySelector(".adu-autofill-toggle")) return true;
    var anchor = findTryItAnchor(document.body);
    if (!anchor || !anchor.parentElement) return false;

    var wrap = document.createElement("label");
    wrap.className = "adu-autofill-toggle";

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("aria-label", "Auto-fill playground fields from your tenant");

    var text = document.createElement("span");
    text.textContent = "Auto-fill from your tenant";

    wrap.appendChild(checkbox);
    wrap.appendChild(text);

    checkbox.addEventListener("change", function () {
      if (!checkbox.checked) return;
      var scope = anchor.closest("form") || anchor.closest("section") || document.body;
      var filled = applyAutofill(scope);
      if (filled === 0) {
        text.textContent = "No matching fields found";
        setTimeout(function () {
          text.textContent = "Auto-fill from your tenant";
        }, 2000);
      }
    });

    anchor.parentElement.insertBefore(wrap, anchor);
    return true;
  }

  function enhance() {
    if (!isTargetPage()) {
      showDiagnosticBanner("adu script loaded, wrong page: " + window.location.pathname, "#888");
      return;
    }
    var badgeMoved = false;
    var toggleMounted = false;
    try {
      badgeMoved = repositionLanguageBadge();
    } catch (e) {
      showDiagnosticBanner("adu badge error: " + e.message, "#c0392b");
      return;
    }
    try {
      toggleMounted = mountAutofillToggle();
    } catch (e) {
      showDiagnosticBanner("adu toggle error: " + e.message, "#c0392b");
      return;
    }
    showDiagnosticBanner(
      "adu script running — badge:" + badgeMoved + " toggle:" + toggleMounted,
      badgeMoved && toggleMounted ? "#2e7d32" : "#b8860b"
    );
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
