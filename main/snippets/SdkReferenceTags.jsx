export const SdkReferenceTags = () => {
  useEffect(() => {
    var KIND_LABELS = {
      classes: "CLASS",
      interfaces: "INTERFACE",
      types: "TYPE",
      variables: "VARIABLE",
      functions: "FUNCTION",
      enums: "ENUM",
    };

    // Tailwind's "-400/20" background-opacity utilities aren't already used
    // anywhere in Mintlify's compiled theme CSS except blue's (confirmed by
    // grepping the site's actual CSS chunks), so a class like bg-purple-400/20
    // would silently render nothing - same class-vs-runtime-injection issue
    // as the column width earlier. Inline rgba/hex values sidestep that.
    var KIND_COLORS = {
      CLASS: { bg: "rgba(59,130,246,0.2)", text: "#1D4ED8" }, // blue
      INTERFACE: { bg: "rgba(192,132,252,0.2)", text: "#7E22CE" }, // purple
      TYPE: { bg: "rgba(156,163,175,0.2)", text: "#374151" }, // gray
      VARIABLE: { bg: "rgba(251,146,60,0.2)", text: "#C2410C" }, // orange
      FUNCTION: { bg: "rgba(59,130,246,0.2)", text: "#1D4ED8" }, // blue (default)
      ENUM: { bg: "rgba(59,130,246,0.2)", text: "#1D4ED8" }, // blue (default)
    };

    // INTERFACE is the widest label, so its own row should sit exactly
    // TARGET_GAP_PX from the text; every other tag in the same section
    // shares that column so text lines up, and necessarily gets more than
    // TARGET_GAP_PX of visible space (unavoidable once alignment is
    // required - see the 2026-08-12 discussion).
    //
    // The <a> this wrapper sits inside already has Mintlify's own
    // "gap-x-3" class (column-gap: calc(var(--spacing)*3) = 12px in this
    // theme's compiled CSS), which applies between ALL of the anchor's flex
    // children - including our inserted wrapper and the text div next to
    // it. That native 12px stacks on top of whatever extra width we add
    // here, so adding the full TARGET_GAP_PX on top produced a real gap of
    // TARGET_GAP_PX + 12, not TARGET_GAP_PX (this is why the tags still
    // looked far from the text after the width fix - the fix was correct,
    // it just never subtracted the native gap it was stacking on).
    //
    // Scoped per top-level ".sidebar-group" (Getting Started / Clients /
    // Reference are each one), not the whole sidebar: computing one column
    // across the entire sidebar meant expanding "Configuration" (which has
    // INTERFACE) also widened "Clients" (which only has CLASS and had never
    // needed the extra room) as soon as both were mounted in the DOM at
    // once - groups that never contain INTERFACE should stay tight.
    var TARGET_GAP_PX = 16;
    var NATIVE_GAP_PX = 12;
    var EXTRA_PX = TARGET_GAP_PX - NATIVE_GAP_PX;

    function topLevelGroups(sidebar) {
      var all = sidebar.querySelectorAll(".sidebar-group");
      return Array.prototype.filter.call(all, function (g) {
        return !(g.parentElement && g.parentElement.closest(".sidebar-group"));
      });
    }

    function resyncColumnWidths(sidebar) {
      topLevelGroups(sidebar).forEach(function (group) {
        var badge = group.querySelector(
          '[data-sdk-reference-tag="INTERFACE"] .method-nav-pill > span'
        );
        if (!badge) return;
        var col = badge.getBoundingClientRect().width + EXTRA_PX;
        group.querySelectorAll("[data-sdk-reference-tag]").forEach(function (w) {
          w.style.width = col + "px";
        });
      });
    }

    function tagLinks() {
      // Scope to the sidebar only - an unscoped selector also matches the
      // cross-reference links the typedoc plugin injects into page body
      // text (e.g. "options: Auth0ClientOptions" in a Parameters list),
      // which should stay plain links with no tag.
      var sidebar = document.getElementById("sidebar-content");
      if (!sidebar) return;
      var links = sidebar.querySelectorAll(
        'a[href^="/docs/sdk/typescript/"]'
      );
      var insertedAny = false;
      links.forEach(function (link) {
        if (link.hasAttribute("data-sdk-tag-applied")) return;
        var parts = link.getAttribute("href").split("/");
        var kindSegment = parts[parts.length - 2];
        var label = KIND_LABELS[kindSegment];
        if (!label) return;

        var pillWrap = document.createElement("div");
        pillWrap.className = "h-[1lh] flex items-center shrink-0";
        pillWrap.setAttribute("data-sdk-reference-tag", label);
        pillWrap.style.justifyContent = "flex-start";

        var pill = document.createElement("span");
        pill.className = "method-nav-pill flex items-center";

        var colors = KIND_COLORS[label];
        var badge = document.createElement("span");
        badge.className = "px-1 py-0.5 rounded-md text-[0.55rem] leading-tight font-bold";
        badge.style.whiteSpace = "nowrap";
        badge.style.backgroundColor = colors.bg;
        badge.style.color = colors.text;
        badge.textContent = label;

        pill.appendChild(badge);
        pillWrap.appendChild(pill);
        link.insertBefore(pillWrap, link.firstChild);
        // Mintlify sets padding-left inline per nesting depth (deeper items
        // get more), so a tag under "Reference > Configuration" starts
        // further right than the "Configuration" header itself. This is a
        // style-only change to an existing node - not moving/reparenting it
        // - to flush tagged rows with the group header's own 1rem (pl-4).
        link.style.paddingLeft = "1rem";
        link.setAttribute("data-sdk-tag-applied", "true");
        insertedAny = true;
      });
      if (insertedAny) {
        requestAnimationFrame(function () {
          resyncColumnWidths(sidebar);
        });
      }
    }

    tagLinks();

    var observer = new MutationObserver(function () {
      tagLinks();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return function () {
      observer.disconnect();
    };
  }, []);

  return null;
};
