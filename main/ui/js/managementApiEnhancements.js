(function () {
  "use strict";

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
      if (node.children.length > 0) continue; // want a leaf-ish label element
      var text = (node.textContent || "").trim();
      for (var i = 0; i < LANGUAGE_LABELS.length; i++) {
        if (text === LANGUAGE_LABELS[i]) {
          return node;
        }
      }
    }
    return null;
  }

  // Moves the code-sample language badge to the right/end of its row.
  // Uses text-content matching (not class names) since this targets Mintlify's
  // own theme internals, which don't expose stable selectors from this repo.
  function repositionLanguageBadge() {
    var containers = document.querySelectorAll(
      '[class*="api-playground"], [class*="playground"], main, article'
    );
    for (var c = 0; c < containers.length; c++) {
      var badge = findLanguageBadge(containers[c]);
      if (!badge) continue;
      // climb to the element that actually behaves like a flex row (has >1 child)
      var row = badge.parentElement;
      var depth = 0;
      while (row && row.children.length < 2 && depth < 4) {
        row = row.parentElement;
        depth++;
      }
      if (!row || row.dataset.aduBadgeMoved === "1") continue;
      row.dataset.aduBadgeMoved = "1";
      row.appendChild(badge.closest("button, [role='tab'], [role='button']") || badge);
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

  function mountAutofillToggle(root) {
    if (root.querySelector(".adu-autofill-toggle")) return;
    var anchor = findTryItAnchor(root);
    if (!anchor) return;

    var wrap = document.createElement("label");
    wrap.className = "adu-autofill-toggle";
    wrap.style.display = "inline-flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "6px";
    wrap.style.marginRight = "8px";
    wrap.style.fontSize = "0.75rem";
    wrap.style.cursor = "pointer";
    wrap.style.userSelect = "none";

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

    anchor.parentElement && anchor.parentElement.insertBefore(wrap, anchor);
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
