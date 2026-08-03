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

  function isVisible(el) {
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
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

  // Same as findSendAnchor but skips hidden/off-screen duplicates - needed
  // once the Try It form is open, where an accessibility/duplicate "Send"
  // text can exist at y=0 and otherwise gets matched first, forcing any
  // shared-ancestor search outward to a huge, unrelated container. Kept
  // separate from findSendAnchor (used on the pre-click page too) so this
  // stricter filter can't regress the already-confirmed-working request-line
  // shadow-bar feature.
  function findVisibleSendAnchor(root) {
    var leaves = leafTextElements(root);
    for (var i = 0; i < leaves.length; i++) {
      if (SEND_LABELS.indexOf(leaves[i].text) === -1) continue;
      if (!isVisible(leaves[i].el)) continue;
      return leaves[i].el.closest("button") || leaves[i].el;
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
  // Mintlify pre-populates some fields (e.g. tenantDomain) with a literal
  // template VALUE like "{TENANT}.auth0.com" - not empty, not a real
  // HTML placeholder attribute, an actual .value. A plain `if (input.value)`
  // check treats that as real user input and never overwrites it. Real
  // domains/tokens never look like "{...}", so anything matching that
  // pattern (or genuinely empty) is safe to overwrite.
  function isPlaceholderLikeValue(value) {
    return !value || /^\{[^}]+\}/.test(value.trim());
  }

  function applyStoredCredentials(root) {
    var creds = getStoredCredentials();
    if (!creds || !creds.token) return "no-stored-credentials";
    var inputs = queryAllDeep(root, "input, textarea");
    var filled = 0;
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (!isPlaceholderLikeValue(input.value)) continue;
      var row = findFieldRow(input);
      var label = row ? rowLabelText(row, input) : "";
      if ((label.indexOf("domain") !== -1 || label.indexOf("tenant") !== -1) && creds.domain) {
        setNativeValue(input, creds.domain);
        filled++;
      } else if (label.indexOf("authorization") !== -1 || label.indexOf("bearer") !== -1) {
        // The real field already renders a fixed "Bearer " label before the
        // input (confirmed via DOM inspection, 2026-08-03) - the input's own
        // value must be just the raw token, not "Bearer <token>" again,
        // or it would show as "Bearer Bearer eyJ...".
        setNativeValue(input, creds.token.replace(/^Bearer\s+/i, ""));
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
    title.textContent = "API Token";

    // Inline Lucide icon markup (same open-source set used by this site's
    // own UI, ui/package.json depends on lucide-react) - embedded as raw
    // SVG since this is plain JS, not a React component, so the npm
    // package's components can't be imported directly. Kept tiny (only
    // the 5 icons this modal needs) rather than pulling in the library.
    var LUCIDE_ICONS = {
      eye:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
      eyeOff:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>',
      copy:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
      check:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
      info:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
      externalLink:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    };

    // Reuses Mintlify's own blue "Note" callout classes exactly (found by
    // inspecting a live rendered <Info>/<Note> callout elsewhere on this
    // site, e.g. docs/quickstart/agent-skills.mdx). Superseded by the info
    // icon's hover tooltip below - kept out of the modal body per direction
    // (2026-08-03).

    // Wraps an input in a relative-positioned container with a copy button
    // (and optionally an eye toggle for masked fields) overlaid on the
    // right side - so a filled-in value can always be copied/revealed
    // without needing to select the text manually.
    function wrapFieldWithIcons(input, opts) {
      var wrap = doc.createElement("div");
      wrap.className = "adu-authorize-field-wrap";

      var icons = doc.createElement("div");
      icons.className = "adu-authorize-field-icons";

      var eyeBtn = null;
      if (opts && opts.maskable) {
        eyeBtn = doc.createElement("button");
        eyeBtn.type = "button";
        eyeBtn.className = "adu-authorize-icon-btn";
        eyeBtn.title = "Show";
        eyeBtn.innerHTML = LUCIDE_ICONS.eyeOff;
        eyeBtn.addEventListener("click", function (e) {
          e.preventDefault();
          var revealed = input.type === "text";
          input.type = revealed ? "password" : "text";
          eyeBtn.innerHTML = revealed ? LUCIDE_ICONS.eye : LUCIDE_ICONS.eyeOff;
          eyeBtn.title = revealed ? "Show" : "Hide";
        });
        icons.appendChild(eyeBtn);
      }

      var copyBtn = doc.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "adu-authorize-icon-btn";
      copyBtn.title = "Copy";
      copyBtn.innerHTML = LUCIDE_ICONS.copy;
      copyBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (!input.value) return;
        navigator.clipboard.writeText(input.value).then(function () {
          copyBtn.innerHTML = LUCIDE_ICONS.check;
          setTimeout(function () {
            copyBtn.innerHTML = LUCIDE_ICONS.copy;
          }, 1200);
        });
      });
      icons.appendChild(copyBtn);

      wrap.appendChild(input);
      wrap.appendChild(icons);
      return wrap;
    }

    var tokenLabelRow = doc.createElement("div");
    tokenLabelRow.className = "adu-authorize-label-row";
    var tokenLabel = doc.createElement("label");
    tokenLabel.textContent = "API Token";

    // Custom tooltip instead of relying on the native `title` attribute -
    // that kept not showing (2026-08-03) despite every structural check
    // (title present, nothing overlapping, pointer-events fine) passing,
    // and native tooltip rendering/timing isn't something verifiable
    // ahead of time. This version's visibility is directly controlled by
    // JS, so it can be confirmed rather than assumed.
    var tokenInfoWrap = doc.createElement("span");
    tokenInfoWrap.className = "adu-authorize-info-icon";
    tokenInfoWrap.tabIndex = 0;
    tokenInfoWrap.setAttribute("role", "button");
    tokenInfoWrap.setAttribute("aria-label", "About the API token");
    tokenInfoWrap.innerHTML = LUCIDE_ICONS.info;

    var tokenInfoTooltip = doc.createElement("span");
    tokenInfoTooltip.className = "adu-authorize-tooltip";
    tokenInfoTooltip.textContent =
      "The token includes all the scopes that are granted to the API Explorer Application, by default it can invoke all the Management API endpoints.";
    tokenInfoWrap.appendChild(tokenInfoTooltip);

    function showTooltip() {
      tokenInfoTooltip.classList.add("adu-authorize-tooltip-visible");
    }
    function hideTooltip() {
      tokenInfoTooltip.classList.remove("adu-authorize-tooltip-visible");
    }
    tokenInfoWrap.addEventListener("mouseenter", showTooltip);
    tokenInfoWrap.addEventListener("mouseleave", hideTooltip);
    tokenInfoWrap.addEventListener("focus", showTooltip);
    tokenInfoWrap.addEventListener("blur", hideTooltip);

    tokenLabelRow.appendChild(tokenLabel);
    tokenLabelRow.appendChild(tokenInfoWrap);

    // A single-line masked input (not the previous multi-line textarea) -
    // needed for the eye-toggle pattern to work (type="password" only
    // applies to <input>, not <textarea>). Tokens are long but browsers
    // handle overflow in a single-line input fine (internal scroll).
    var tokenInput = doc.createElement("input");
    tokenInput.type = "password";
    tokenInput.className = "adu-authorize-token-input";
    tokenInput.placeholder = "Enter your token";
    var tokenFieldWrap = wrapFieldWithIcons(tokenInput, { maskable: true });

    // Auto-filling this from an already-logged-in dashboard session isn't
    // possible from here - browsers block cross-origin sites from reading
    // another site's session/cookies, this is a security boundary, not a
    // Mintlify limitation. A direct link is the practical alternative.
    // NOTE: this URL is specific to one tenant (product-design) and API id
    // - per explicit direction (2026-08-03) rather than the generic
    // manage.auth0.com entry point. A different visitor's dashboard login
    // would land here without access to this tenant's API Explorer.
    var tokenHelpRow = doc.createElement("div");
    tokenHelpRow.className = "adu-authorize-help-row";

    var tokenHelpText = doc.createElement("span");
    tokenHelpText.textContent = "Don't have a token?";

    var tokenHelpLink = doc.createElement("a");
    tokenHelpLink.className = "adu-authorize-help-link";
    tokenHelpLink.href = "https://manage.auth0.com/dashboard/us/product-design/apis/5efe591a3b8e2e0022c5eac8/explorer";
    tokenHelpLink.target = "_blank";
    tokenHelpLink.rel = "noopener noreferrer";
    var tokenHelpLinkIcon = doc.createElement("span");
    tokenHelpLinkIcon.className = "adu-authorize-external-icon";
    tokenHelpLinkIcon.innerHTML = LUCIDE_ICONS.externalLink;
    tokenHelpLink.appendChild(doc.createTextNode("Get Token"));
    tokenHelpLink.appendChild(tokenHelpLinkIcon);

    tokenHelpRow.appendChild(tokenHelpText);
    tokenHelpRow.appendChild(tokenHelpLink);

    var existing = getStoredCredentials();
    if (existing) {
      tokenInput.value = existing.token || "";
    }

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
      var domain = decodeJwtDomain(token) || "";
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

    // Grouped so the 24px rhythm (title -> content -> actions) can be
    // expressed as margin on this one wrapper, while the pieces inside it
    // (note, label, field, help link) keep their own tighter spacing.
    var content = doc.createElement("div");
    content.className = "adu-authorize-content";
    content.appendChild(tokenLabelRow);
    content.appendChild(tokenFieldWrap);
    content.appendChild(tokenHelpRow);

    modal.appendChild(title);
    modal.appendChild(content);
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
  // Confirmed 2026-07-31 via direct DOM trace (Puppeteer + CDP): the real
  // label|input split is a CSS GRID container (Tailwind `grid lg:grid-cols-2`),
  // not flexbox. The previous version climbed to the first ancestor with
  // 2-4 children regardless of layout mode, which matched a tiny 1-purpose
  // flex wrapper immediately around the input (2 levels too low) - setting
  // flex-direction on it did nothing since it never touched the actual
  // grid row. Must specifically require display:grid now.
  function findFieldRow(input) {
    var row = input;
    var depth = 0;
    while (row && depth < 8) {
      row = row.parentElement;
      if (!row) break;
      var cs = (row.ownerDocument.defaultView || window).getComputedStyle(row);
      if (cs.display === "grid" && row.children.length >= 2 && row.children.length <= 4) {
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
      row.style.setProperty("grid-template-columns", "1fr", "important");
      row.style.setProperty("gap", "6px", "important");
      input.dataset.aduRestyled = "1";
      count++;
    }
    return count;
  }

  // "Server"/"Authorization"/"Body" each have a static, unrelated duplicate
  // elsewhere on the page (confirmed via direct DOM trace 2026-07-31) - e.g.
  // a pre-existing "Authorization" heading that renders before the Try It
  // form even opens. "Server" itself is reliably unique, so it's used as a
  // Y-position anchor: any match for the OTHER section names above that
  // anchor is the unrelated duplicate, not the real form section.
  function findSectionCard(root, sectionName) {
    var leaves = leafTextElements(root);
    var anchorY = -Infinity;
    for (var j = 0; j < leaves.length; j++) {
      if (leaves[j].text === "Server" && isVisible(leaves[j].el)) {
        anchorY = leaves[j].el.getBoundingClientRect().y;
        break;
      }
    }
    for (var i = 0; i < leaves.length; i++) {
      if (leaves[i].text !== sectionName) continue;
      if (!isVisible(leaves[i].el)) continue;
      if (sectionName !== "Server" && leaves[i].el.getBoundingClientRect().y < anchorY) continue;
      return climbToRow(leaves[i].el, 2, 5);
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
    customTabBtn.textContent = "Try Custom";

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

    var isCustomActive = false;
    function showCustom() {
      codeBody.style.display = "none";
      customPanel.style.display = "block";
      customTabBtn.classList.add("adu-tab-active");
      isCustomActive = true;
    }
    function showNative() {
      customPanel.style.display = "none";
      codeBody.style.display = "";
      customTabBtn.classList.remove("adu-tab-active");
      isCustomActive = false;
    }

    // Real toggle: clicking again while active switches back (this was
    // previously one-way - clicking "Custom" had no way to return to the
    // native view except clicking an unrelated language control).
    customTabBtn.addEventListener("click", function () {
      if (isCustomActive) {
        showNative();
      } else {
        showCustom();
      }
    });

    // Group with the existing copy/sparkle icon cluster (the row's own
    // last child before this button is added) instead of appending
    // directly to headerRow - that row uses justify-content: space-between
    // for exactly 2 groups, and a 3rd top-level item there splits the gap
    // into two, creating a large, uneven gap. Joining the existing
    // cluster's own local gap keeps spacing consistent. Done BEFORE the
    // loop below, so `child.contains(customTabBtn)` actually evaluates
    // correctly - checking it beforehand always returns false since the
    // button isn't in the tree yet, which is exactly the bug that caused
    // the cluster to also get a "revert to native" listener and instantly
    // undo the toggle via event bubbling (2026-08-03).
    var iconsCluster = headerRow.children[headerRow.children.length - 1];
    iconsCluster.appendChild(customTabBtn);

    Array.prototype.forEach.call(headerRow.children, function (child) {
      if (child === customTabBtn || child.contains(customTabBtn)) return;
      child.addEventListener("click", showNative);
    });
    card.insertBefore(customPanel, codeBody.nextSibling);
    return "ok";
  }

  // Clamps the endpoint description paragraph (the long text right after the
  // <h1>) to 2 lines via CSS line-clamp - full text stays in the DOM
  // (accessible, copyable), just visually truncated.
  // Confirmed via DOM trace: h1's only sibling is the "Copy page" button -
  // the description paragraph is actually a sibling of h1's PARENT (the
  // title+copy-button row), one level up. Checks both in case some pages
  // really do have it as a direct h1 sibling.
  function truncateDescription(root) {
    var h1 = queryDeep(root, "h1");
    if (!h1) return "h1-not-found";

    function findLongTextSibling(startEl) {
      var el = startEl;
      var depth = 0;
      while (el && depth < 3) {
        if ((el.textContent || "").trim().length > 60) return el;
        el = el.nextElementSibling;
        depth++;
      }
      return null;
    }

    var target = findLongTextSibling(h1.nextElementSibling);
    var ancestor = h1.parentElement;
    for (var up = 0; !target && ancestor && up < 3; up++) {
      target = findLongTextSibling(ancestor.nextElementSibling);
      ancestor = ancestor.parentElement;
    }
    if (!target) return "no-long-text-found";
    if (target.dataset.aduTruncated === "1") return "already-done";
    target.style.setProperty("display", "-webkit-box", "important");
    target.style.setProperty("-webkit-line-clamp", "2", "important");
    target.style.setProperty("-webkit-box-orient", "vertical", "important");
    target.style.setProperty("overflow", "hidden", "important");
    target.dataset.aduTruncated = "1";
    return "ok";
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

    var sendAnchor = findVisibleSendAnchor(root);
    if (!sendAnchor) return "send-not-found";
    var sendY = sendAnchor.getBoundingClientRect().y;

    // Multiple elements can repeat the exact page title (e.g. an unrelated
    // "next page" card further down) - the real pill is the one closest in
    // Y position to the Send button, since they share the same top bar.
    var leaves = leafTextElements(root);
    var pillLeaf = null;
    var bestDistance = Infinity;
    for (var i = 0; i < leaves.length; i++) {
      if (leaves[i].text !== titleText || leaves[i].el === h1 || h1.contains(leaves[i].el)) continue;
      if (!isVisible(leaves[i].el)) continue; // skip hidden SEO/duplicate-title elements
      var distance = Math.abs(leaves[i].el.getBoundingClientRect().y - sendY);
      if (distance < bestDistance) {
        bestDistance = distance;
        pillLeaf = leaves[i].el;
      }
    }
    if (!pillLeaf) return "pill-not-found";
    if (pillLeaf.dataset.aduPillMoved === "1") return "already-done";

    var pillItem = pillLeaf.closest("button, [role='button']") || pillLeaf;
    var bar = growToSharedAncestor(pillItem, sendAnchor, 8);
    if (!bar) return "bar-not-found";
    // No size cap here unlike moveRequestLineAboveCodeSample - this only
    // ever sets CSS `order` on direct children (safe: reorders within an
    // existing flex row, can't hide/blank anything even in the worst case
    // of matching a larger-than-expected container).
    if (bar.contains(document.body) || bar === document.body) return "bar-is-body";

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
    var doc = root.ownerDocument || document;

    // Only one upload UI should ever exist. Repeated enhance() cycles
    // (mutation + 1s poll) combined with the form re-rendering fresh
    // "users" inputs across open/close cycles produced several stacked
    // upload buttons (2026-08-03) - the per-input dataset flag alone
    // didn't prevent this since each fresh input starts unflagged. Clean
    // up any extras and skip entirely if one is already present anywhere.
    var existingWraps = queryAllDeep(doc, ".adu-file-upload-wrap");
    if (existingWraps.length > 1) {
      for (var w = 1; w < existingWraps.length; w++) existingWraps[w].remove();
    }
    if (existingWraps.length > 0) return "already-mounted";

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
