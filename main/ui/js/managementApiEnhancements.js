(function () {
  "use strict";
  try {
  console.log("[adu] managementApiEnhancements.js loaded, path=" + window.location.pathname);

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
  //    repeats "GET"/"POST"/etc. badges for every endpoint link. Grow
  //    OUTWARD from a specific known anchor instead, and hard-check the
  //    candidate container is small before touching visibility.
  //    This happened on 2026-07-30; see feedback_mintlify_dom_manipulation.md
  //
  // Confirmed 2026-07-30: the "Try it" panel's parameter form (Server/
  // Authorization/Body sections) renders inside a SAME-ORIGIN <iframe>, not
  // the main document. All DOM helpers below take a `root` and use
  // `root.ownerDocument` (not the global `document`) so they work correctly
  // against either the main page or an iframe's contentDocument. Iframe
  // access is polling-based, not load-event-based - the load event can fire
  // before our listener attaches, which silently no-ops everything.

  var TARGET_PATH = "/docs/api/management/v2/jobs/post-users-imports";
  var LANGUAGE_LABELS = ["cURL", "Curl", "JavaScript", "Python", "Node", "Node.js", "PHP", "Java", "Go", "Ruby", "C#"];
  var HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  var SEND_LABELS = ["Try it", "Send"];
  var MAX_BAR_DESCENDANTS = 40;
  var SENSITIVE_LABEL_KEYWORDS = ["authorization", "bearer", "token", "password", "secret"];

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
      el.style.fontSize = "11px";
      el.style.color = "#fff";
      el.style.maxWidth = "70vw";
      el.style.whiteSpace = "pre-wrap";
      document.body.appendChild(el);
    }
    el.style.background = color;
    el.textContent = message;
  }

  // Shadow-DOM-aware traversal. Neither TreeWalker nor querySelectorAll
  // pierce shadow roots - if the form is rendered inside a web component's
  // shadow root (a different isolation mechanism than iframes, easy to
  // mistake for "not there at all" since every text/selector search comes
  // back with consistent, clean zero matches rather than a partial/flaky
  // result), all the leaf-text and field-detection logic below would
  // silently find nothing no matter how many times it's retried. This
  // walks into `.shadowRoot` wherever present so that possibility is ruled
  // out (or fixed, if that's what's actually happening).
  function walkDeep(node, visit) {
    if (node.shadowRoot) walkDeep(node.shadowRoot, visit);
    var kids = node.children;
    if (!kids) return;
    for (var i = 0; i < kids.length; i++) {
      visit(kids[i]);
      walkDeep(kids[i], visit);
    }
  }

  function leafTextElements(root) {
    var out = [];
    walkDeep(root, function (el) {
      if (el.children.length > 0) return; // has children (light or shadow) - not a leaf
      var text = (el.textContent || "").trim();
      if (text) out.push({ el: el, text: text });
    });
    return out;
  }

  function queryAllDeep(root, selector) {
    var out = [];
    walkDeep(root, function (el) {
      if (el.matches && el.matches(selector)) out.push(el);
    });
    return out;
  }

  function queryDeep(root, selector) {
    var found = null;
    walkDeep(root, function (el) {
      if (found) return;
      if (el.matches && el.matches(selector)) found = el;
    });
    return found;
  }

  function findLanguageBadge(root) {
    var leaves = leafTextElements(root);
    for (var i = 0; i < leaves.length; i++) {
      if (LANGUAGE_LABELS.indexOf(leaves[i].text) !== -1) return leaves[i].el;
    }
    return null;
  }

  function findSendAnchor(root) {
    var leaves = leafTextElements(root);
    for (var i = 0; i < leaves.length; i++) {
      if (SEND_LABELS.indexOf(leaves[i].text) !== -1) {
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

  function growToSharedAncestor(elA, elB, maxDepth) {
    var ancestor = elA;
    var depth = 0;
    while (ancestor && depth < maxDepth) {
      if (ancestor.contains(elB)) return ancestor;
      ancestor = ancestor.parentElement;
      depth++;
    }
    return null;
  }

  // Grows OUTWARD from the "Try it" button until it finds an ancestor whose
  // descendants include an HTTP method badge - the smallest container
  // holding both, staying local instead of reaching the sidebar.
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
    var tryIt = findSendAnchor(document.body);
    if (!tryIt) return "tryit-not-found";

    var bar = findRequestLineBar(tryIt, 6);
    if (!bar) return "bar-not-found";
    if (bar.dataset.aduShadowed === "1") return "already-done";

    var badge = findLanguageBadge(document.body);
    if (!badge) return "badge-not-found";

    var headerRow = climbToRow(badge, 2, 4);
    var card = headerRow ? headerRow.parentElement : null;
    if (!card || !card.parentElement) return "card-not-found";

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

    var wrapper = bar.parentElement;
    var wrapDepth = 0;
    while (wrapper && wrapper !== card.parentElement && wrapDepth < 3) {
      var visibleChildren = Array.prototype.filter.call(wrapper.children, function (child) {
        return child.style.display !== "none";
      });
      if (visibleChildren.length > 0) break;
      wrapper.style.display = "none";
      wrapper = wrapper.parentElement;
      wrapDepth++;
    }

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

    var cloneTryIt = findSendAnchor(clone);
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

  // One-time "Authorize" flow, matching the old Management API Explorer UX
  // described in customer feedback (2026-07-31 call transcript): paste a
  // bearer token once, tenant domain gets derived from the token itself
  // (Auth0 access tokens are JWTs whose `iss` claim is the tenant domain),
  // and both auto-fill into every endpoint's form from then on - no
  // per-endpoint re-entry. Stored in localStorage (survives tab close,
  // an improvement over the old session-only behavior).
  var CREDENTIALS_STORAGE_KEY = "adu_api_credentials";

  function getStoredCredentials() {
    try {
      var raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveStoredCredentials(domain, token) {
    try {
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify({ domain: domain, token: token }));
    } catch (e) {
      /* private browsing / storage quota - setup just won't persist, non-fatal */
    }
  }

  // Decodes the `iss` (issuer) claim out of a JWT's payload without
  // verifying its signature - we only need the tenant domain for
  // convenience auto-fill, this is never used for actual auth decisions.
  function decodeJwtDomain(token) {
    try {
      var clean = (token || "").replace(/^Bearer\s+/i, "").trim();
      var parts = clean.split(".");
      if (parts.length < 2) return null;
      var payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (payload.length % 4) payload += "=";
      var json = JSON.parse(atob(payload));
      if (json.iss) return json.iss.replace(/^https?:\/\//, "").replace(/\/$/, "");
    } catch (e) {
      /* not a decodable JWT, or no iss claim - fine, domain stays manual */
    }
    return null;
  }

  // Fills the tenant-domain and Authorization/Bearer fields directly from
  // stored credentials - unlike applyFormAutofill, this intentionally
  // DOES touch credential-labeled fields, since this is explicit,
  // user-provided data being reused with consent, not a guessed value.
  function applyStoredCredentials(root) {
    var creds = getStoredCredentials();
    if (!creds || !creds.token) return "no-stored-credentials";
    var inputs = queryAllDeep(root, "input, textarea");
    var filled = 0;
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (input.value) continue;
      var row = findFieldRow(input);
      var label = row ? rowLabelText(row, input) : "";
      if ((label.indexOf("domain") !== -1 || label.indexOf("tenant") !== -1) && creds.domain) {
        setNativeValue(input, creds.domain);
        filled++;
      } else if (label.indexOf("authorization") !== -1 || label.indexOf("bearer") !== -1) {
        setNativeValue(input, "Bearer " + creds.token.replace(/^Bearer\s+/i, ""));
        filled++;
      }
    }
    return filled;
  }

  function openAuthorizeModal(root, onSaved) {
    var doc = root.ownerDocument || document;
    if (queryDeep(doc, ".adu-authorize-modal")) return;

    var overlay = doc.createElement("div");
    overlay.className = "adu-authorize-overlay";

    var modal = doc.createElement("div");
    modal.className = "adu-authorize-modal";

    var title = doc.createElement("h3");
    title.textContent = "Set up your API credentials";

    var note = doc.createElement("p");
    note.className = "adu-authorize-note";
    note.textContent = "This is a one-time setup. Once saved, this information is automatically filled in every time you test any endpoint - you won't need to enter it again.";

    var tokenLabel = doc.createElement("label");
    tokenLabel.textContent = "Bearer Token";
    var tokenInput = doc.createElement("textarea");
    tokenInput.className = "adu-authorize-token-input";
    tokenInput.rows = 3;
    tokenInput.placeholder = "Paste your Management API access token";

    var domainLabel = doc.createElement("label");
    domainLabel.textContent = "Tenant Domain (auto-detected from the token if left blank)";
    var domainInput = doc.createElement("input");
    domainInput.type = "text";
    domainInput.placeholder = "{yourTenant}.auth0.com";

    var existing = getStoredCredentials();
    if (existing) {
      tokenInput.value = existing.token || "";
      domainInput.value = existing.domain || "";
    }

    tokenInput.addEventListener("input", function () {
      if (domainInput.value) return; // don't clobber a manually-entered domain
      var detected = decodeJwtDomain(tokenInput.value);
      if (detected) domainInput.value = detected;
    });

    var saveBtn = doc.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "adu-authorize-save";
    saveBtn.textContent = "Authorize";

    var cancelBtn = doc.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "adu-authorize-cancel";
    cancelBtn.textContent = "Cancel";

    saveBtn.addEventListener("click", function () {
      var token = tokenInput.value.trim();
      if (!token) return;
      var domain = domainInput.value.trim() || decodeJwtDomain(token) || "";
      saveStoredCredentials(domain, token);
      overlay.remove();
      if (onSaved) onSaved();
    });
    cancelBtn.addEventListener("click", function () {
      overlay.remove();
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });

    var actions = doc.createElement("div");
    actions.className = "adu-authorize-actions";
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    modal.appendChild(title);
    modal.appendChild(note);
    modal.appendChild(tokenLabel);
    modal.appendChild(tokenInput);
    modal.appendChild(domainLabel);
    modal.appendChild(domainInput);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    doc.body.appendChild(overlay);
  }

  // Mounts a persistent "Authorize" button near the page title - visible
  // before the user even opens "Try it", matching the old landing-page
  // Authorize button described in customer feedback. Re-applies stored
  // credentials on every call (not just when first mounted) so a
  // freshly-reopened Try It form still gets auto-filled.
  // No persistent button - the modal opens automatically the first time
  // the user lands on any endpoint page with no stored credentials yet.
  // Once saved, it never shows again in this browser and every endpoint's
  // form gets auto-filled silently. This matches the exact flow described
  // by the user (2026-07-31): select an endpoint -> modal appears once ->
  // fill it -> click "Try it" anywhere from then on and it's pre-filled.
  function showAuthorizeModalOnce(root) {
    var creds = getStoredCredentials();
    if (creds) {
      applyStoredCredentials(root);
      return "already-authorized";
    }
    if (window.__aduAuthorizeShown) return "modal-already-shown-this-session";
    window.__aduAuthorizeShown = true;
    openAuthorizeModal(root, function () {
      applyStoredCredentials(root);
    });
    return "modal-opened";
  }

  // Climbs from an input to the smallest ancestor that looks like "a field
  // row" - a handful of children and a reasonable width. Capped so it can
  // never grab an entire section card.
  function findFieldRow(input) {
    var row = input;
    var depth = 0;
    while (row && depth < 6) {
      row = row.parentElement;
      if (!row) break;
      if (row.children.length >= 2 && row.children.length <= 4) {
        var rect = row.getBoundingClientRect();
        if (rect.width > 250 && row.querySelectorAll("*").length <= 60) return row;
      }
      depth++;
    }
    return null;
  }

  function restyleFieldRowsToVertical(root) {
    var inputs = queryAllDeep(root, "input, select, textarea");
    var count = 0;
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (input.dataset.aduRestyled === "1") continue;
      var row = findFieldRow(input);
      if (!row) continue;
      row.style.setProperty("flex-direction", "column", "important");
      row.style.setProperty("align-items", "stretch", "important");
      row.style.setProperty("gap", "6px", "important");
      input.dataset.aduRestyled = "1";
      count++;
    }
    return count;
  }

  function findSectionCard(root, sectionName) {
    var leaves = leafTextElements(root);
    for (var i = 0; i < leaves.length; i++) {
      if (leaves[i].text === sectionName) {
        return climbToRow(leaves[i].el, 2, 5);
      }
    }
    return null;
  }

  function findFirstSectionCard(root) {
    var sectionNames = ["Server", "Authorization", "Body"];
    for (var i = 0; i < sectionNames.length; i++) {
      var card = findSectionCard(root, sectionNames[i]);
      if (card) return card;
    }
    return null;
  }

  // Strips the bordered/card look from each section (Server/Authorization/
  // Body) without touching its expand/collapse behavior - purely cosmetic
  // CSS, no functional change.
  function flattenSectionCards(root) {
    var sectionNames = ["Server", "Authorization", "Body"];
    var count = 0;
    for (var i = 0; i < sectionNames.length; i++) {
      var card = findSectionCard(root, sectionNames[i]);
      if (!card || card.dataset.aduFlattened === "1") continue;
      card.style.setProperty("border", "none", "important");
      card.style.setProperty("box-shadow", "none", "important");
      card.style.setProperty("background", "transparent", "important");
      card.style.setProperty("border-radius", "0", "important");
      card.dataset.aduFlattened = "1";
      count++;
    }
    return count;
  }

  // Adds a "Custom" tab into the code-sample's language row (cURL/C#/etc.),
  // toggling between the native rendered code and a blank editable
  // textarea for pasting ad-hoc JSON to test with. We don't control
  // Mintlify's own tab/dropdown state, so this only *hides* the native
  // code body (CSS display, not removal) and shows a new panel instead -
  // clicking back on any of the original language controls restores it.
  function addCustomBodyTab(root) {
    var badge = findLanguageBadge(root);
    if (!badge) return "badge-not-found";
    var item = badge.closest("button, [role='tab'], [role='button']") || badge;
    var headerRow = climbToRow(item, 2, 4);
    if (!headerRow) return "header-row-not-found";
    if (headerRow.dataset.aduCustomTab === "1") return "already-done";
    var card = headerRow.parentElement;
    if (!card) return "card-not-found";

    var codeBody = null;
    for (var i = 0; i < card.children.length; i++) {
      if (card.children[i] !== headerRow) {
        codeBody = card.children[i];
        break;
      }
    }
    if (!codeBody) return "code-body-not-found";
    headerRow.dataset.aduCustomTab = "1";

    var doc = root.ownerDocument || document;

    var customTabBtn = doc.createElement("button");
    customTabBtn.type = "button";
    customTabBtn.className = "adu-custom-tab-button";
    customTabBtn.textContent = "Custom";

    var customPanel = doc.createElement("div");
    customPanel.className = "adu-custom-body-panel";
    customPanel.style.display = "none";

    var label = doc.createElement("div");
    label.className = "adu-custom-body-label";
    label.textContent = "Paste your own JSON here to test with (not sent automatically)";

    var textarea = doc.createElement("textarea");
    textarea.className = "adu-custom-body-textarea";
    textarea.placeholder = '{\n  "your": "json here"\n}';
    textarea.spellcheck = false;
    textarea.rows = 10;

    customPanel.appendChild(label);
    customPanel.appendChild(textarea);

    function showCustom() {
      codeBody.style.display = "none";
      customPanel.style.display = "block";
      customTabBtn.classList.add("adu-tab-active");
    }
    function showNative() {
      customPanel.style.display = "none";
      codeBody.style.display = "";
      customTabBtn.classList.remove("adu-tab-active");
    }

    customTabBtn.addEventListener("click", showCustom);
    Array.prototype.forEach.call(headerRow.children, function (child) {
      if (child === customTabBtn) return;
      child.addEventListener("click", showNative);
    });

    headerRow.appendChild(customTabBtn);
    card.insertBefore(customPanel, codeBody.nextSibling);
    return "ok";
  }

  // Clamps the endpoint description paragraph (the long text right after the
  // <h1>) to 2 lines via CSS line-clamp - full text stays in the DOM
  // (accessible, copyable), just visually truncated.
  function truncateDescription(root) {
    var h1 = queryDeep(root, "h1");
    if (!h1) return "h1-not-found";
    var el = h1.nextElementSibling;
    var depth = 0;
    while (el && depth < 3) {
      var text = (el.textContent || "").trim();
      if (text.length > 60) {
        if (el.dataset.aduTruncated === "1") return "already-done";
        el.style.setProperty("display", "-webkit-box", "important");
        el.style.setProperty("-webkit-line-clamp", "2", "important");
        el.style.setProperty("-webkit-box-orient", "vertical", "important");
        el.style.setProperty("overflow", "hidden", "important");
        el.dataset.aduTruncated = "1";
        return "ok";
      }
      el = el.nextElementSibling;
      depth++;
    }
    return "no-long-text-found";
  }

  // Moves the operation-picker pill (method + endpoint title + dropdown,
  // e.g. "POST Create import users job v") to the right side of its bar,
  // next to Send - same CSS `order` technique already used for the language
  // badge on the main page. Pure style change, no reparenting.
  function moveOperationPillRight(root) {
    var h1 = queryDeep(root, "h1");
    if (!h1) return "h1-not-found";
    var titleText = (h1.textContent || "").trim();
    if (!titleText) return "title-empty";

    var leaves = leafTextElements(root);
    var pillLeaf = null;
    for (var i = 0; i < leaves.length; i++) {
      if (leaves[i].text === titleText && leaves[i].el !== h1 && !h1.contains(leaves[i].el)) {
        pillLeaf = leaves[i].el;
        break;
      }
    }
    if (!pillLeaf) return "pill-not-found";
    if (pillLeaf.dataset.aduPillMoved === "1") return "already-done";

    var sendAnchor = findSendAnchor(root);
    if (!sendAnchor) return "send-not-found";

    var pillItem = pillLeaf.closest("button, [role='button']") || pillLeaf;
    var bar = growToSharedAncestor(pillItem, sendAnchor, 8);
    if (!bar) return "bar-not-found";
    if (bar.querySelectorAll("*").length > 80) return "bar-too-large";

    var pillTopChild = pillItem;
    while (pillTopChild.parentElement && pillTopChild.parentElement !== bar) {
      pillTopChild = pillTopChild.parentElement;
    }
    if (pillTopChild.parentElement !== bar) return "pill-not-direct-child";

    Array.prototype.forEach.call(bar.children, function (child, i) {
      if (child === pillTopChild) return;
      if (!child.style.order) child.style.setProperty("order", String(i + 1), "important");
    });
    pillTopChild.style.setProperty("order", "9999", "important");
    pillLeaf.dataset.aduPillMoved = "1";
    return "ok";
  }

  function rowLabelText(row, input) {
    var leaves = leafTextElements(row);
    var texts = [];
    for (var i = 0; i < leaves.length; i++) {
      if (input.contains(leaves[i].el)) continue;
      texts.push(leaves[i].text);
    }
    return texts.join(" ").toLowerCase();
  }

  // Fills empty fields: real tenant domain where we have it, otherwise
  // promotes each field's own placeholder/example text into a real value.
  // Never touches anything whose label suggests a credential. Reads tenant
  // data from the OUTER window's rootStore regardless of which document
  // `root` belongs to - real session data only exists on the main page.
  function applyFormAutofill(root) {
    var inputs = queryAllDeep(root, "input, textarea");
    var filled = 0;
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (input.type === "checkbox" || input.type === "radio") continue;
      if (input.value) continue;

      var row = findFieldRow(input);
      var label = row ? rowLabelText(row, input) : "";
      var isSensitive = SENSITIVE_LABEL_KEYWORDS.some(function (k) {
        return label.indexOf(k) !== -1;
      });
      if (isSensitive) continue;

      var value = null;
      if ((label.indexOf("domain") !== -1 || label.indexOf("tenant") !== -1) && window.rootStore && window.rootStore.variableStore) {
        var v = window.rootStore.variableStore.values.get("{yourDomain}");
        if (v && v !== "{yourDomain}") value = v;
      }
      if (!value && input.placeholder) value = input.placeholder;
      if (value) {
        setNativeValue(input, value);
        filled++;
      }
    }
    return filled;
  }

  // Adds a real file-picker interaction to the "users" field: an "Upload"
  // button that triggers a hidden native <input type="file"> (genuinely
  // opens the OS file picker - standard browser behavior, not simulated),
  // and once a file is chosen, shows a chip with its name/size. The
  // original text input is hidden (not removed) and its value is kept in
  // sync via setNativeValue so anything listening to it still sees a value.
  function addUsersFileUploadUI(root) {
    var inputs = queryAllDeep(root, "input, textarea");
    var target = null;
    for (var i = 0; i < inputs.length; i++) {
      var row = findFieldRow(inputs[i]);
      var label = row ? rowLabelText(row, inputs[i]) : "";
      var placeholder = (inputs[i].placeholder || "").toLowerCase();
      if (label.indexOf("users") !== -1 || placeholder.indexOf("users") !== -1) {
        target = inputs[i];
        break;
      }
    }
    if (!target) return "users-input-not-found";
    if (target.dataset.aduUploadUi === "1") return "already-done";
    target.dataset.aduUploadUi = "1";

    var doc = root.ownerDocument || document;
    var wrap = doc.createElement("div");
    wrap.className = "adu-file-upload-wrap";

    var fileInput = doc.createElement("input");
    fileInput.type = "file";
    fileInput.className = "adu-file-upload-input";
    fileInput.accept = ".json,.csv,.txt";

    var button = doc.createElement("button");
    button.type = "button";
    button.className = "adu-file-upload-button";
    button.textContent = "Upload";

    var hint = doc.createElement("span");
    hint.className = "adu-file-upload-hint";
    // 512000 bytes is the actual documented limit for this endpoint (see
    // the 413 response in the OAS spec), not a made-up number.
    hint.textContent = "JSON, CSV, TXT · up to 500 KB";

    var chip = doc.createElement("div");
    chip.className = "adu-file-chip";
    chip.style.display = "none";

    var chipName = doc.createElement("span");
    chipName.className = "adu-file-chip-name";

    var removeBtn = doc.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "adu-file-chip-remove";
    removeBtn.textContent = "×";
    removeBtn.setAttribute("aria-label", "Remove file");

    chip.appendChild(chipName);
    chip.appendChild(removeBtn);

    button.addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      chipName.textContent = file.name + " · " + Math.max(1, Math.round(file.size / 1024)) + " KB";
      chip.style.display = "flex";
      button.textContent = "Change file";
      setNativeValue(target, file.name);
    });

    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      fileInput.value = "";
      chip.style.display = "none";
      button.textContent = "Upload";
      setNativeValue(target, "");
    });

    var sampleLink = doc.createElement("a");
    sampleLink.className = "adu-file-sample-link";
    sampleLink.href = "https://auth0.com/docs/users/references/bulk-import-database-schema-examples";
    sampleLink.target = "_blank";
    sampleLink.rel = "noopener noreferrer";
    sampleLink.textContent = "View sample file format";

    var row = doc.createElement("div");
    row.className = "adu-file-upload-row";
    row.appendChild(button);
    row.appendChild(hint);
    row.appendChild(chip);

    wrap.appendChild(row);
    wrap.appendChild(sampleLink);
    wrap.appendChild(fileInput);

    target.style.display = "none";
    target.parentElement.insertBefore(wrap, target);
    return "ok";
  }

  function mountFormAutofillToggle(root) {
    var doc = root.ownerDocument || document;
    if (queryDeep(doc, ".adu-form-autofill-toggle")) return "already-mounted";
    var card = findFirstSectionCard(root);
    if (!card || !card.parentElement) return "card-not-found";

    var wrap = doc.createElement("label");
    wrap.className = "adu-form-autofill-toggle";

    var checkbox = doc.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("aria-label", "Auto-fill all fields");

    var text = doc.createElement("span");
    text.textContent = "Auto-fill from your tenant";

    wrap.appendChild(checkbox);
    wrap.appendChild(text);

    checkbox.addEventListener("change", function () {
      if (!checkbox.checked) return;
      var filled = applyFormAutofill(card.parentElement);
      text.textContent = filled > 0 ? "Auto-filled " + filled + " field(s)" : "No empty fields to fill";
      setTimeout(function () {
        text.textContent = "Auto-fill from your tenant";
      }, 2500);
    });

    card.parentElement.insertBefore(wrap, card);
    return "ok";
  }

  function runFormEnhancements(root, label) {
    var results = [];
    function safe(name, fn) {
      try {
        results.push(name + ":" + fn());
      } catch (e) {
        results.push(name + "-ERR:" + e.message);
      }
    }
    safe("authorize", function () {
      return showAuthorizeModalOnce(root);
    });
    safe("desc", function () {
      return truncateDescription(root);
    });
    safe("flat", function () {
      return flattenSectionCards(root);
    });
    safe("restyled", function () {
      return restyleFieldRowsToVertical(root);
    });
    safe("toggle", function () {
      return mountFormAutofillToggle(root);
    });
    safe("pill", function () {
      return moveOperationPillRight(root);
    });
    safe("upload", function () {
      return addUsersFileUploadUI(root);
    });
    safe("customTab", function () {
      return addCustomBodyTab(root);
    });
    return label + " " + results.join(" ");
  }

  // Confirmed 2026-07-31 via live Elements-panel inspection: the parameter
  // form (Server/Authorization/Body, Radix UI tabpanel/code-group markup)
  // renders directly in the MAIN document, not an iframe. The one iframe
  // found earlier (id="q-messenger-frame", src on app.qualified.com, 0x0
  // size) is an unrelated third-party chat widget - its "frame-specific"
  // right-click context menu is almost certainly what got misread as
  // belonging to the form. Removed all iframe-reaching logic; everything
  // below runs directly against document.body.
  function enhance() {
    if (!isTargetPage()) {
      showDiagnosticBanner("adu script loaded, wrong page: " + window.location.pathname, "#888");
      return;
    }

    var moveResult;
    try {
      moveResult = moveRequestLineAboveCodeSample();
    } catch (e) {
      moveResult = "ERR:" + e.message;
    }

    var formResult;
    try {
      formResult = runFormEnhancements(document.body, "form");
    } catch (e) {
      formResult = "form-ERR:" + e.message;
    }

    showDiagnosticBanner("adu move:" + moveResult + " || " + formResult, "#2e7d32");
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

  // Safety net: if the iframe undergoes a full navigation (not just content
  // filling into its initial document), the outer page's own DOM never
  // changes, so the MutationObserver above never fires again, and any
  // observer attached to the iframe's now-discarded document goes inert.
  // Plain polling sidesteps all of that by re-reading iframe.contentDocument
  // fresh every time, regardless of whether the reference changed.
  setInterval(function () {
    if (isTargetPage()) enhance();
  }, 1000);
  } catch (e) {
    console.error("[adu] top-level error:", e);
    try {
      var banner = document.createElement("div");
      banner.style.position = "fixed";
      banner.style.top = "8px";
      banner.style.right = "8px";
      banner.style.zIndex = "999999";
      banner.style.padding = "6px 10px";
      banner.style.background = "#c0392b";
      banner.style.color = "#fff";
      banner.style.fontFamily = "monospace";
      banner.style.fontSize = "11px";
      banner.textContent = "adu TOP-LEVEL ERROR: " + e.message;
      document.body.appendChild(banner);
    } catch (e2) {
      /* truly nothing we can do */
    }
  }
})();
