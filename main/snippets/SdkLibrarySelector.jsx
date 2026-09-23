// Visual mockup only - single dropdown combining library + version, matching
// the approved reference design. auth0-spa-js is the one library with a real
// generated reference; the rest are listed as options but selecting a
// library or version here only updates the trigger/row labels, it doesn't
// navigate to different content.
export const SdkLibrarySelector = () => {
  useEffect(() => {
    var LIBRARIES = [
      {
        name: "auth0-spa-js",
        versions: [
          { version: "2.27.0", status: "live" },
          { version: "2.26.0", status: "live" }
        ],
        selectedVersionIndex: 0
      },
      {
        name: "auth0-react",
        versions: [
          { version: "2.27.0", status: "live" },
          { version: "2.26.0", status: "live" }
        ],
        selectedVersionIndex: 0
      },
      {
        name: "auth0-angular",
        versions: [
          { version: "2.9.0", status: "live" },
          { version: "2.8.0", status: "live" }
        ],
        selectedVersionIndex: 0
      },
      {
        name: "auth0-vue",
        versions: [
          { version: "2.3.1", status: "live" },
          { version: "2.2.1", status: "live" }
        ],
        selectedVersionIndex: 0
      },
      {
        name: "ACUL",
        versions: [
          { version: "1.6.0", status: "live" },
          { version: "1.0.0", status: "deprecated" }
        ],
        selectedVersionIndex: 0
      }
    ];
    var GETTING_STARTED_HREFS = {
      "auth0-spa-js": "/docs/libraries/auth0-single-page-app-sdk#getting-started",
      "auth0-react": "/docs/libraries/auth0-react#getting-started",
      "auth0-angular": "/docs/libraries/auth0-angular-spa#getting-started",
      "auth0-vue": "/docs/libraries/auth0-vue#getting-started",
      "ACUL": "/docs/libraries/acul#getting-started"
    };
    var selectedIndex = 0;
    var activeSelection = { kind: "library", libIdx: 0, verIdx: null };

    // Dummy placeholder content only - modeled loosely on the My Account API
    // reference page structure (an intro line plus Overview/Examples
    // sections) so selecting a library visually swaps the main content area
    // instead of navigating to a different page. The homepage's own intro
    // paragraph and card sections are hidden (not removed) so it reads like
    // a real overview page instead of the SDK homepage with cards showing
    // underneath.
    var LIB_DESCRIPTIONS = {
      "auth0-spa-js":
        "Reference for the Auth0 Single Page Application SDK, covering client configuration, authentication, and token management for browser-based apps.",
      "auth0-react":
        "Reference for the Auth0 React SDK, covering the AuthProvider, hooks, and components used to protect React applications.",
      "auth0-angular":
        "Reference for the Auth0 Angular SDK, covering the AuthModule, route guards, and interceptors used to protect Angular applications.",
      "auth0-vue":
        "Reference for the Auth0 Vue SDK, covering the Auth0 plugin, composables, and route guards used to protect Vue applications.",
      "ACUL":
        "Reference for Advanced Customization for Universal Login, covering the screens, hooks, and rendering APIs used to build custom login experiences."
    };
    var DUMMY_SECTIONS = [
      {
        heading: "Overview",
        body: "The {NAME} SDK lets developers manage authentication and user sessions directly from their application."
      },
      {
        heading: "Examples",
        body: "Universal Login with authorization code flow: redirect to /authorize, then exchange the returned code for tokens with a POST to /oauth/token. Embedded login with native passkeys: challenge the user with a POST to /passkey/challenge, then complete the WebAuthn flow with a POST to /oauth/token."
      }
    ];

    function hideHomepageContent() {
      var content = document.getElementById("content");
      if (!content) return;
      Array.prototype.forEach.call(content.children, function (el) {
        if (el.id === "sdk-library-dummy-preview") return;
        el.style.display = "none";
      });
    }

    function updatePageTitle(lib) {
      var title = document.querySelector("h1");
      if (title) {
        title.textContent = lib.name;
        var overline = document.getElementById("sdk-library-overview-label");
        if (!overline && title.parentNode) {
          // Wrap the title in its own column container instead of inserting
          // the overline as a plain sibling - the title's parentNode can be
          // a flex row, which would place "Overview" beside the title
          // instead of stacked above it.
          var titleStack = document.createElement("div");
          titleStack.id = "sdk-library-title-stack";
          titleStack.style.display = "flex";
          titleStack.style.flexDirection = "column";
          overline = document.createElement("div");
          overline.id = "sdk-library-overview-label";
          overline.textContent = "Overview";
          overline.style.fontSize = "0.8rem";
          overline.style.color = "#6b7280";
          overline.style.marginBottom = "0.25rem";
          title.parentNode.insertBefore(titleStack, title);
          titleStack.appendChild(overline);
          titleStack.appendChild(title);
        }
      }
      document.title = lib.name + " - Auth0 Docs";
    }

    function renderDummyPreview(lib) {
      var content = document.getElementById("content");
      if (!content) return;
      updatePageTitle(lib);
      hideHomepageContent();
      var preview = document.getElementById("sdk-library-dummy-preview");
      if (!preview) {
        preview = document.createElement("div");
        preview.id = "sdk-library-dummy-preview";
        preview.style.margin = "1rem 0 1.5rem";
        content.insertBefore(preview, content.firstChild);
      }
      preview.innerHTML = "";
      var intro = document.createElement("p");
      intro.textContent = LIB_DESCRIPTIONS[lib.name] || "Reference overview for " + lib.name + ".";
      intro.style.margin = "0 0 1rem";
      preview.appendChild(intro);
      DUMMY_SECTIONS.forEach(function (section) {
        var heading = document.createElement("h2");
        heading.textContent = section.heading;
        heading.style.margin = "1.25rem 0 0.5rem";
        var body = document.createElement("p");
        body.textContent = section.body.replace("{NAME}", lib.name);
        body.style.margin = "0";
        preview.appendChild(heading);
        preview.appendChild(body);
      });
    }

    var sidebar = document.getElementById("sidebar-content");
    if (!sidebar || sidebar.querySelector("[data-sdk-library-selector]")) return;

    var CHEVRON_DOWN =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    var CHEVRON_UP =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';
    var CHECK_ICON =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

    // Simple purple line-style book icon (same color convention as the
    // sidebar's active "SDKs" nav icon, see icons/sdks-active.svg) instead of
    // per-SDK framework logos - keeps the dropdown to plain, single-color icons.
    var LIB_ICON_SVG =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><style>path{stroke:#7549F2}@media(prefers-color-scheme:dark){path{stroke:#B3A7FF}}</style><path stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>';

    function makeIcon(lib) {
      var box = document.createElement("div");
      box.style.width = "2rem";
      box.style.height = "2rem";
      box.style.borderRadius = "0.5rem";
      box.style.border = "1px solid rgba(0,0,0,0.08)";
      box.style.display = "flex";
      box.style.alignItems = "center";
      box.style.justifyContent = "center";
      box.style.flexShrink = "0";
      var icon = document.createElement("span");
      icon.style.display = "flex";
      icon.style.width = "1.25rem";
      icon.style.height = "1.25rem";
      icon.innerHTML = LIB_ICON_SVG;
      box.appendChild(icon);
      return box;
    }

    var wrap = document.createElement("div");
    wrap.setAttribute("data-sdk-library-selector", "true");
    wrap.style.padding = "1rem 1rem 0";
    wrap.style.marginBottom = "16px";
    wrap.style.position = "relative";

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.style.width = "100%";
    trigger.style.display = "flex";
    trigger.style.alignItems = "center";
    trigger.style.justifyContent = "space-between";
    trigger.style.gap = "0.6rem";
    trigger.style.padding = "0.5rem 0.75rem";
    trigger.style.border = "1px solid rgba(0,0,0,0.1)";
    trigger.style.borderRadius = "0.75rem";
    trigger.style.background = "transparent";
    trigger.style.cursor = "pointer";

    var triggerLeft = document.createElement("div");
    triggerLeft.style.display = "flex";
    triggerLeft.style.alignItems = "center";
    triggerLeft.style.gap = "0.6rem";
    triggerLeft.style.minWidth = "0";

    var triggerText = document.createElement("div");
    triggerText.style.textAlign = "left";
    triggerText.style.minWidth = "0";

    var triggerName = document.createElement("div");
    triggerName.className = "text-gray-900 dark:text-gray-100";
    triggerName.style.fontSize = "0.85rem";
    triggerName.style.fontWeight = "600";

    var triggerVersion = document.createElement("div");
    triggerVersion.className = "text-gray-500 dark:text-gray-400";
    triggerVersion.style.fontSize = "0.75rem";

    triggerText.appendChild(triggerName);
    triggerText.appendChild(triggerVersion);
    var triggerIcon = makeIcon(LIBRARIES[selectedIndex]);
    triggerLeft.appendChild(triggerIcon);
    triggerLeft.appendChild(triggerText);

    var chevron = document.createElement("span");
    chevron.style.display = "flex";
    chevron.style.opacity = "0.6";
    chevron.style.flexShrink = "0";
    chevron.innerHTML = CHEVRON_DOWN;

    trigger.appendChild(triggerLeft);
    trigger.appendChild(chevron);

    var triggerWrap = document.createElement("div");
    triggerWrap.style.position = "relative";

    var panel = document.createElement("div");
    panel.style.display = "none";
    panel.style.position = "absolute";
    panel.style.left = "0";
    panel.style.right = "0";
    panel.style.top = "100%";
    panel.style.zIndex = "21";
    panel.style.marginTop = "0.25rem";
    panel.style.padding = "0.4rem";
    panel.style.borderRadius = "0.75rem";
    panel.style.border = "1px solid rgba(0,0,0,0.1)";
    panel.style.background = "var(--background, #fff)";
    panel.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";

    function isOpen() {
      return panel.style.display !== "none";
    }

    function renderTrigger() {
      var lib = LIBRARIES[selectedIndex];
      var ver = lib.versions[lib.selectedVersionIndex];
      triggerName.textContent = lib.name;
      triggerVersion.textContent = "version: v" + ver.version;
      chevron.innerHTML = isOpen() ? CHEVRON_UP : CHEVRON_DOWN;
      var newIcon = makeIcon(lib);
      triggerLeft.replaceChild(newIcon, triggerIcon);
      triggerIcon = newIcon;
    }

    function renderPanel() {
      panel.innerHTML = "";
      LIBRARIES.forEach(function (lib, idx) {
        var isSelectedLibrary =
          activeSelection.kind === "library" && activeSelection.libIdx === idx;

        var group = document.createElement("div");
        group.style.padding = "0.4rem 0.5rem";
        group.style.borderRadius = "0.5rem";
        group.style.background = "transparent";

        var groupHeader = document.createElement("div");
        groupHeader.style.display = "flex";
        groupHeader.style.alignItems = "center";
        groupHeader.style.gap = "0.6rem";
        groupHeader.style.marginBottom = "0.3rem";
        groupHeader.style.borderRadius = "0.4rem";
        groupHeader.style.padding = "0.2rem 0.3rem";
        groupHeader.style.background = isSelectedLibrary ? "rgba(109, 91, 208, 0.1)" : "transparent";

        var rowName = document.createElement("a");
        rowName.href = "#";
        rowName.textContent = lib.name;
        rowName.style.fontSize = "0.85rem";
        rowName.style.fontWeight = "600";
        rowName.style.textDecoration = "none";
        rowName.style.display = "inline-block";
        if (isSelectedLibrary) {
          rowName.style.color = "#6d5bd0";
        } else {
          rowName.className = "text-gray-900 dark:text-gray-100";
        }

        rowName.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          selectedIndex = idx;
          activeSelection = { kind: "library", libIdx: idx, verIdx: null };
          panel.style.display = "none";
          renderTrigger();
          renderPanel();
          renderDummyPreview(lib);
        });

        groupHeader.appendChild(makeIcon(lib));
        groupHeader.appendChild(rowName);
        group.appendChild(groupHeader);

        var versionList = document.createElement("div");
        versionList.style.display = "flex";
        versionList.style.flexDirection = "column";
        versionList.style.gap = "0.2rem";
        // Icon (2rem) + groupHeader gap (0.6rem) puts the library name's
        // text at 2.6rem from this column's left edge; vRow below adds its
        // own 0.5rem left padding, so 2.1rem here lines the version text up
        // under that same starting letter instead of drifting further right.
        versionList.style.padding = "0 0.5rem 0 2.1rem";

        lib.versions.forEach(function (v, vIdx) {
          var isSelectedVersion =
            activeSelection.kind === "version" &&
            activeSelection.libIdx === idx &&
            activeSelection.verIdx === vIdx;
          var vRow = document.createElement("button");
          vRow.type = "button";
          vRow.style.display = "flex";
          vRow.style.alignItems = "center";
          vRow.style.justifyContent = "space-between";
          vRow.style.gap = "0.4rem";
          vRow.style.width = "100%";
          vRow.style.padding = "0.3rem 0.5rem";
          vRow.style.borderRadius = "0.4rem";
          vRow.style.border = "none";
          vRow.style.background = isSelectedVersion ? "rgba(109, 91, 208, 0.1)" : "transparent";
          vRow.style.fontSize = "0.75rem";
          vRow.style.cursor = "pointer";
          vRow.style.textAlign = "left";

          var vLeft = document.createElement("span");
          vLeft.style.display = "flex";
          vLeft.style.alignItems = "center";
          vLeft.style.gap = "0.4rem";

          var vLabel = document.createElement("span");
          vLabel.textContent = "version: v" + v.version;
          vLabel.className = isSelectedVersion ? "" : "text-gray-900 dark:text-gray-100";
          if (isSelectedVersion) {
            vLabel.style.color = "#6d5bd0";
          }
          vLeft.appendChild(vLabel);
          vRow.appendChild(vLeft);

          if (isSelectedVersion) {
            var check = document.createElement("span");
            check.style.color = "#6d5bd0";
            check.style.display = "flex";
            check.style.flexShrink = "0";
            check.innerHTML = CHECK_ICON;
            vRow.appendChild(check);
          }

          vRow.addEventListener("click", function (e) {
            e.stopPropagation();
            lib.selectedVersionIndex = vIdx;
            selectedIndex = idx;
            activeSelection = { kind: "version", libIdx: idx, verIdx: vIdx };
            panel.style.display = "none";
            renderTrigger();
            renderPanel();
            renderDummyPreview(lib);
          });
          versionList.appendChild(vRow);
        });
        group.appendChild(versionList);
        panel.appendChild(group);
      });
    }

    trigger.addEventListener("click", function () {
      panel.style.display = isOpen() ? "none" : "block";
      renderTrigger();
    });

    renderTrigger();
    renderPanel();
    triggerWrap.appendChild(trigger);
    triggerWrap.appendChild(panel);
    wrap.appendChild(triggerWrap);
    // #sidebar-content only has one top-level child (the scrollable nav
    // container) - the native "SDK Libraries" link is nested several levels
    // deep inside it as an <li>, so inserting relative to sidebar's own
    // children (previous approach) had no effect and the dropdown fell
    // through to the end of the sidebar instead. Anchor on that <li>
    // directly so the dropdown mounts right after it.
    var nativeLink = sidebar.querySelector('a[href="/docs/libraries"]');
    var nativeItem = nativeLink && nativeLink.closest("li");
    if (nativeItem && nativeItem.parentNode) {
      nativeItem.parentNode.insertBefore(wrap, nativeItem.nextSibling);
    } else {
      sidebar.insertBefore(wrap, sidebar.firstChild);
    }

    // Align with the page title, same approach as the previous version of
    // this component - the sidebar mount point sits slightly above where the
    // main content title renders, so correct for that gap once mounted.
    function alignWithTitle() {
      var title = document.querySelector("h1");
      if (!title) return;
      wrap.style.marginTop = "0px";
      var diff = title.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
      if (diff > 0) wrap.style.marginTop = diff + "px";
    }
    requestAnimationFrame(alignWithTitle);
    window.addEventListener("resize", alignWithTitle);
    setTimeout(alignWithTitle, 300);
    setTimeout(alignWithTitle, 1000);
  }, []);

  return null;
};
