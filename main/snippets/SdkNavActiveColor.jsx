// Mintlify's dropdown-style top nav tabs (SDKs, Dev Tools) mark the outer
// <button> with "text-primary" when that tab is active, but the inner <div>
// holding the visible icon+label hardcodes "text-gray-800 dark:text-gray-200"
// unconditionally - that inner color wins visually and hides the active
// purple regardless of state. No docs.json field controls this, so it's a
// small, scoped CSS override rather than DOM reparenting.
export const SdkNavActiveColor = () => {
  useEffect(() => {
    if (!document.getElementById("sdk-nav-active-color")) {
      var style = document.createElement("style");
      style.id = "sdk-nav-active-color";
      style.textContent =
        "button.nav-tabs-item.text-primary > div { color: #7549F2 !important; }" +
        ".dark button.nav-tabs-item.text-primary > div { color: #B3A7FF !important; }" +
        "button.nav-tabs-item.text-primary { background-color: rgba(117,73,242,0.1) !important; border-radius: 8px; padding: 0 0.5rem; }" +
        ".dark button.nav-tabs-item.text-primary { background-color: rgba(179,167,255,0.15) !important; }";
      document.head.appendChild(style);
    }

    // The tab icon is a plain <img src="/icons/sdks.svg">, drawn with a
    // hardcoded fill color inside the SVG file itself (not fill="currentColor"),
    // so the CSS color override above can't recolor it - swapping the src to
    // a purple-drawn variant of the same glyph is the only way to match. This
    // only touches the img's own src attribute, not its position in the tree.
    //
    // "button.nav-tabs-item.text-primary" also matches Dev Tools when THAT
    // tab is the active one (same Mintlify pattern), so this only swaps the
    // icon when it's actually the SDKs one - otherwise it'd overwrite Dev
    // Tools' icon with the SDKs glyph whenever Dev Tools is active instead.
    document.querySelectorAll("button.nav-tabs-item.text-primary img[src=\"/icons/sdks.svg\"]").forEach(function (icon) {
      icon.setAttribute("src", "/icons/sdks-active.svg");
    });
  }, []);

  return null;
};
