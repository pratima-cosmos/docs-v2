(function () {
  "use strict";

  // Safety rule for this file: NEVER move/reparent an existing DOM node that
  // Mintlify's native components render (appendChild/insertBefore on a node
  // that's already in the tree). That conflicts with React's reconciliation
  // and can blank out entire panels. Only two mutation styles are allowed:
  //   1. set style/attributes on an existing node in place
  //   2. insert a brand-new node (never seen by React) next to an existing one
  // See ~/.claude/projects/-Users-pratima-rajput/memory/feedback_mintlify_dom_manipulation.md

  var MGMT_API_PATH_PREFIX = "/docs/api/management";
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

  function isManagementApiPage() {
    return window.location.pathname.indexOf(MGMT_API_PATH_PREFIX) === 0;
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
    var containers = document.querySelectorAll(
      '[class*="api-playground"], [class*="playground"], main, article'
    );
    for (var c = 0; c < containers.length; c++) {
      var badge = findLanguageBadge(containers[c]);
      if (!badge) continue;

      var item = badge.closest("button, [role='tab'], [role='button']") || badge;
      var row = item.parentElement;
      var depth = 0;
      while (row && row.children.length < 2 && depth < 4) {
        row = row.parentElement;
        depth++;
      }
      if (!row || row.dataset.aduBadgeReordered === "1") continue;
      row.dataset.aduBadgeReordered = "1";

      // give every existing sibling its natural order, then push the badge last
      Array.prototype.forEach.call(row.children, function (child, i) {
        if (child === item) return;
        if (!child.style.order) child.style.order = String(i + 1);
      });
      item.style.order = "9999";
    }
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
  function mountAutofillToggle(root) {
    if (root.querySelector(".adu-autofill-toggle")) return;
    var anchor = findTryItAnchor(root);
    if (!anchor || !anchor.parentElement) return;

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
      var scope = anchor.closest("form") || anchor.closest("section") || root;
      var filled = applyAutofill(scope);
      if (filled === 0) {
        text.textContent = "No matching fields found";
        setTimeout(function () {
          text.textContent = "Auto-fill from your tenant";
        }, 2000);
      }
    });

    anchor.parentElement.insertBefore(wrap, anchor);
  }

  function enhance() {
    if (!isManagementApiPage()) return;
    try {
      repositionLanguageBadge();
    } catch (e) {
      /* non-fatal: theme internals may have changed */
    }
    try {
      var containers = document.querySelectorAll(
        '[class*="api-playground"], [class*="playground"], main, article'
      );
      for (var i = 0; i < containers.length; i++) {
        mountAutofillToggle(containers[i]);
      }
    } catch (e) {
      /* non-fatal */
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
