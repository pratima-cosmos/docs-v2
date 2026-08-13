// Visual mockup only, matching SdkVersionSelector's precedent - only
// auth0-spa-js has a real generated reference, so switching the selection
// here just updates the label; it doesn't navigate to different content.
// Mirrors the exact section/card names on docs/libraries.mdx.
export const SdkLibrarySelector = () => {
  useEffect(() => {
    var CATEGORIES = [
      {
        label: "Single-Page Application (SPA)",
        items: ["React", "Vue", "Angular", "JavaScript", "Flutter (Web)"]
      },
      {
        label: "Regular Web Application",
        items: [
          "Next.js", "Express", "Fastify", "Nuxt", "ASP.NET Core MVC",
          "ASP.NET Core Blazor", "Laravel", "Java Spring Boot", "Python",
          "Go", "PHP", "Ruby on Rails", "Java MVC", "Java EE", "Hono"
        ]
      },
      {
        label: "Backend Service and API",
        items: [
          "Node (Express) API", "Fastify API", "Spring Boot API", "Go API",
          "ASP.NET Core Web API", "Laravel API", "Python API", "PHP API",
          "Ruby On Rails API"
        ]
      },
      {
        label: "Native/Mobile App",
        items: [
          "React Native", "Flutter", "iOS / macOS", "Android", "Expo",
          ".NET (OIDC Client)", "MAUI", "Xamarin"
        ]
      },
      {
        label: "Advanced Customization for Universal Login (ACUL)",
        items: ["JS SDK", "React SDK"]
      },
      {
        label: "Management API",
        items: [
          ".NET", "Go", "Go JWT Middleware", "Java", "Node",
          "Node JWT Bearer", "PHP", "Python", "Ruby"
        ]
      },
      {
        label: "Lock",
        items: ["Lock for Android", "Lock for iOS", "Lock for Web"]
      }
    ];
    var selected = "JavaScript";

    var sidebar = document.getElementById("sidebar-content");
    if (!sidebar || sidebar.querySelector("[data-sdk-library-selector]")) return;

    var wrap = document.createElement("div");
    wrap.setAttribute("data-sdk-library-selector", "true");
    wrap.style.padding = "1rem 1rem 0";
    wrap.style.marginBottom = "16px";
    wrap.style.position = "relative";

    var label = document.createElement("div");
    label.textContent = "SDK Libraries";
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
    panel.style.zIndex = "21";
    panel.style.marginTop = "0.25rem";
    panel.style.padding = "0.5rem";
    panel.style.borderRadius = "0.5rem";
    panel.style.border = "1px solid rgba(0,0,0,0.1)";
    panel.style.background = "var(--background, #fff)";
    panel.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    panel.style.maxHeight = "22rem";
    panel.style.overflowY = "auto";

    var labelSpan = document.createElement("span");
    labelSpan.textContent = selected;
    labelSpan.className = "text-gray-900 dark:text-gray-100";
    var chevron = document.createElement("span");
    chevron.style.display = "flex";
    chevron.style.opacity = "0.6";
    chevron.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    trigger.appendChild(labelSpan);
    trigger.appendChild(chevron);

    function renderPanel() {
      panel.innerHTML = "";
      CATEGORIES.forEach(function (cat) {
        var heading = document.createElement("div");
        heading.textContent = cat.label;
        heading.className = "text-gray-900 dark:text-gray-100";
        heading.style.fontSize = "0.65rem";
        heading.style.fontWeight = "700";
        heading.style.textTransform = "uppercase";
        heading.style.padding = "0.4rem 0.5rem 0.15rem";
        panel.appendChild(heading);

        cat.items.forEach(function (name) {
          var row = document.createElement("button");
          row.type = "button";
          row.textContent = name;
          row.className = "text-gray-900 dark:text-gray-100";
          row.style.display = "block";
          row.style.width = "100%";
          row.style.textAlign = "left";
          row.style.padding = "0.35rem 0.5rem";
          row.style.borderRadius = "0.4rem";
          row.style.border = "none";
          row.style.background = name === selected ? "rgba(0,0,0,0.05)" : "transparent";
          row.style.fontSize = "0.8rem";
          row.style.cursor = "pointer";

          row.addEventListener("click", function () {
            selected = name;
            labelSpan.textContent = selected;
            panel.style.display = "none";
            renderPanel();
          });
          panel.appendChild(row);
        });
      });
    }

    trigger.addEventListener("click", function () {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    renderPanel();
    wrap.appendChild(label);
    wrap.appendChild(trigger);
    wrap.appendChild(panel);
    sidebar.insertBefore(wrap, sidebar.firstChild);

    // Topmost of the two dropdowns, so this is the one that needs to line
    // up with the main content title - the version selector below just
    // needs a flat 16px from this one, which its own fixed marginBottom
    // handles without any measurement.
    function alignWithTitle() {
      var title = document.querySelector("h1");
      if (!title) return;
      wrap.style.marginTop = "0px";
      // wrap has its own top padding (1rem), so its own bounding box top
      // sits above where the "SDK Libraries" text actually renders - align
      // against the label's real position, not wrap's outer box edge.
      var diff = title.getBoundingClientRect().top - label.getBoundingClientRect().top;
      if (diff > 0) wrap.style.marginTop = diff + "px";
    }
    requestAnimationFrame(alignWithTitle);
    window.addEventListener("resize", alignWithTitle);
    setTimeout(alignWithTitle, 300);
    setTimeout(alignWithTitle, 1000);
  }, []);

  return null;
};
