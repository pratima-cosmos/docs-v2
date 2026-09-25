// Visual mockup only, per 2026-08-13 direction - there is one real generated
// version of the auth0-spa-js reference (this preview). Picking a different
// version here does not swap to different content.
export const SdkVersionSelector = () => {
  useEffect(() => {
    var VERSIONS = [
      { version: "3.0.0", status: "beta" },
      { version: "2.24.1", status: "live" },
      { version: "2.20.0", status: "live" },
      { version: "1.5.0", status: "deprecated" },
      { version: "1.0.0", status: "archived" }
    ];
    var STATUS_COLORS = {
      live: { bg: "rgba(34,197,94,0.15)", text: "#15803D" },
      beta: { bg: "rgba(234,179,8,0.18)", text: "#A16207" },
      deprecated: { bg: "rgba(239,68,68,0.15)", text: "#B91C1C" },
      archived: { bg: "rgba(156,163,175,0.2)", text: "#374151" }
    };
    var selected = VERSIONS[1].version;

    var sidebar = document.getElementById("sidebar-content");
    if (!sidebar || sidebar.querySelector("[data-sdk-version-selector]")) return;

    var wrap = document.createElement("div");
    wrap.setAttribute("data-sdk-version-selector", "true");
    // No top padding/margin here - SdkLibrarySelector (mounted above this)
    // already provides the 16px gap via its own marginBottom, and is the
    // one that aligns with the page title since it's the topmost of the two.
    wrap.style.padding = "0 1rem 0";
    wrap.style.position = "relative";

    var label = document.createElement("div");
    label.textContent = "Version";
    label.className = "text-gray-700 dark:text-gray-300";
    label.style.fontSize = "0.7rem";
    label.style.fontWeight = "600";
    label.style.marginBottom = "4px";

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.style.width = "100%";
    trigger.style.display = "flex";
    trigger.style.alignItems = "center";
    trigger.style.justifyContent = "space-between";
    trigger.style.padding = "0.4rem 0.6rem";
    trigger.style.border = "1px solid rgba(0,0,0,0.1)";
    trigger.style.borderRadius = "0.5rem";
    trigger.style.background = "transparent";
    trigger.style.fontSize = "0.8rem";
    trigger.style.fontWeight = "400";
    trigger.style.cursor = "pointer";

    var panel = document.createElement("div");
    panel.style.display = "none";
    panel.style.position = "absolute";
    panel.style.left = "1rem";
    panel.style.right = "1rem";
    panel.style.top = "100%";
    panel.style.zIndex = "20";
    panel.style.marginTop = "0.25rem";
    panel.style.padding = "0.5rem";
    panel.style.borderRadius = "0.5rem";
    panel.style.border = "1px solid rgba(0,0,0,0.1)";
    panel.style.background = "var(--background, #fff)";
    panel.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";

    var list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "0.2rem";

    function makeStatusBadge(status) {
      var badge = document.createElement("span");
      var c = STATUS_COLORS[status];
      badge.textContent = status.toUpperCase();
      badge.style.fontSize = "0.6rem";
      badge.style.fontWeight = "700";
      badge.style.padding = "0.1rem 0.4rem";
      badge.style.borderRadius = "999px";
      badge.style.backgroundColor = c.bg;
      badge.style.color = c.text;
      return badge;
    }

    function renderList() {
      list.innerHTML = "";
      VERSIONS.forEach(function (v) {
        var row = document.createElement("button");
        row.type = "button";
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "flex-start";
        row.style.gap = "0.4rem";
        row.style.width = "100%";
        row.style.padding = "0.35rem 0.5rem";
        row.style.borderRadius = "0.4rem";
        row.style.border = "none";
        row.style.background = v.version === selected ? "rgba(0,0,0,0.05)" : "transparent";
        row.style.fontSize = "0.8rem";
        row.style.cursor = "pointer";
        row.style.textAlign = "left";

        var label = document.createElement("span");
        label.textContent = "v" + v.version;
        label.className = "text-gray-900 dark:text-gray-100";
        row.appendChild(label);
        row.appendChild(makeStatusBadge(v.status));

        row.addEventListener("click", function () {
          selected = v.version;
          labelSpan.textContent = "v" + selected;
          triggerLeft.replaceChild(makeStatusBadge(v.status), triggerLeft.lastElementChild);
          panel.style.display = "none";
          renderList();
        });
        list.appendChild(row);
      });
    }

    var triggerLeft = document.createElement("div");
    triggerLeft.style.display = "flex";
    triggerLeft.style.alignItems = "center";
    triggerLeft.style.gap = "0.4rem";

    var labelSpan = document.createElement("span");
    labelSpan.textContent = "v" + selected;
    labelSpan.className = "text-gray-900 dark:text-gray-100";

    var selectedVersionEntry = VERSIONS.filter(function (v) {
      return v.version === selected;
    })[0];
    triggerLeft.appendChild(labelSpan);
    triggerLeft.appendChild(makeStatusBadge(selectedVersionEntry.status));

    var chevron = document.createElement("span");
    chevron.style.display = "flex";
    chevron.style.opacity = "0.6";
    chevron.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    trigger.appendChild(triggerLeft);
    trigger.appendChild(chevron);

    trigger.addEventListener("click", function () {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    renderList();
    panel.appendChild(list);
    wrap.appendChild(label);
    wrap.appendChild(trigger);
    wrap.appendChild(panel);

    var libraryWrap = sidebar.querySelector("[data-sdk-library-selector]");
    if (libraryWrap) {
      libraryWrap.after(wrap);
    } else {
      sidebar.insertBefore(wrap, sidebar.firstChild);
    }

    // "create Auth0Client" below has its own top spacing from the sidebar
    // group's native layout - padding/margin on wrap alone can't target an
    // exact 16px, since that native spacing adds on top of whatever's set
    // here. Measuring the real gap and correcting with marginBottom (can go
    // negative to pull the next row up) lands on exactly 16px regardless of
    // how much spacing the sidebar itself already has.
    function fixBottomGap() {
      wrap.style.marginBottom = "0px";
      // Targeting wrap.nextElementSibling wasn't reliable - whatever
      // wrapper/group element sits there doesn't necessarily start exactly
      // where the visible first nav link's text does. Querying for the
      // actual first <a href> in the sidebar (our own dropdowns only
      // contain <button>s, never a real link) measures against the real
      // "create Auth0Client" row directly, regardless of what wraps it.
      var firstLink = sidebar.querySelector("a[href]");
      if (!firstLink) return;
      var gap = firstLink.getBoundingClientRect().top - wrap.getBoundingClientRect().bottom;
      wrap.style.marginBottom = 16 - gap + "px";
    }

    // A single post-mount measurement isn't enough - the sidebar's real
    // content (fetched/rendered after this effect runs) can still shift
    // position afterward, silently invalidating a one-shot fix. A couple of
    // delayed catch-up passes handle that.
    //
    // Deliberately NOT a MutationObserver on the sidebar subtree here: this
    // list has 143 items, and Mintlify mutates it during scroll (active-item
    // highlighting, etc.) - an observer watching the whole subtree fires
    // repeatedly mid-scroll, and each firing calls getBoundingClientRect
    // (forces a synchronous layout). Reading layout while it's actively
    // settling from a scroll in progress can grab a transient/incorrect
    // value that then sticks as marginBottom until the next firing - this
    // is what produced the blank-looking flash while scrolling.
    requestAnimationFrame(fixBottomGap);
    window.addEventListener("resize", fixBottomGap);
    setTimeout(fixBottomGap, 300);
    setTimeout(fixBottomGap, 1000);
  }, []);

  return null;
};
