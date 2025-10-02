function gridCellDimensions() {
  const element = document.createElement("div");
  element.style.position = "fixed";
  element.style.height = "var(--line-height)";
  element.style.width = "1ch";
  document.body.appendChild(element);
  const rect = element.getBoundingClientRect();
  document.body.removeChild(element);
  return { width: rect.width, height: rect.height };
}

// Add padding to each media to maintain grid.
function adjustMediaPadding() {
  const cell = gridCellDimensions();

  function setHeightFromRatio(media, ratio) {
      const rect = media.getBoundingClientRect();
      const realHeight = rect.width / ratio;
      const diff = cell.height - (realHeight % cell.height);
      media.style.setProperty("padding-bottom", `${diff}px`);
  }

  function setFallbackHeight(media) {
      const rect = media.getBoundingClientRect();
      const height = Math.round((rect.width / 2) / cell.height) * cell.height;
      media.style.setProperty("height", `${height}px`);
  }

  function onMediaLoaded(media) {
    var width, height;
    switch (media.tagName) {
      case "IMG":
        width = media.naturalWidth;
        height = media.naturalHeight;
        break;
      case "VIDEO":
        width = media.videoWidth;
        height = media.videoHeight;
        break;
    }
    if (width > 0 && height > 0) {
      setHeightFromRatio(media, width / height);
    } else {
      setFallbackHeight(media);
    }
  }

  const medias = document.querySelectorAll("img, video");
  for (media of medias) {
    switch (media.tagName) {
      case "IMG":
        if (media.complete) {
          onMediaLoaded(media);
        } else {
          media.addEventListener("load", () => onMediaLoaded(media));
          media.addEventListener("error", function() {
              setFallbackHeight(media);
          });
        }
        break;
      case "VIDEO":
        switch (media.readyState) {
          case HTMLMediaElement.HAVE_CURRENT_DATA:
          case HTMLMediaElement.HAVE_FUTURE_DATA:
          case HTMLMediaElement.HAVE_ENOUGH_DATA:
            onMediaLoaded(media);
            break;
          default:
            media.addEventListener("loadeddata", () => onMediaLoaded(media));
            media.addEventListener("error", function() {
              setFallbackHeight(media);
            });
            break;
        }
        break;
    }
  }
}

adjustMediaPadding();
window.addEventListener("load", adjustMediaPadding);
window.addEventListener("resize", adjustMediaPadding);

function checkOffsets() {
  const ignoredTagNames = new Set([
    "THEAD",
    "TBODY",
    "TFOOT",
    "TR",
    "TD",
    "TH",
  ]);
  const cell = gridCellDimensions();
  const elements = document.querySelectorAll("body :not(.debug-grid, .debug-toggle)");
  for (const element of elements) {
    if (ignoredTagNames.has(element.tagName)) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      continue;
    }
    const top = rect.top + window.scrollY;
    const left = rect.left + window.scrollX;
    const offset = top % (cell.height / 2);
    if(offset > 0) {
      element.classList.add("off-grid");
      console.error("Incorrect vertical offset for", element, "with remainder", top % cell.height, "when expecting divisible by", cell.height / 2);
    } else {
      element.classList.remove("off-grid");
    }
  }
}

const debugToggle = document.querySelector(".debug-toggle");
function onDebugToggle() {
  document.body.classList.toggle("debug", debugToggle.checked);
}
debugToggle.addEventListener("change", onDebugToggle);
onDebugToggle();

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('monospace-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial theme
  if (savedTheme) {
    setTheme(savedTheme);
  } else if (prefersDark) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
  
  // Update active state
  updateThemeSelector();
}

function setTheme(theme) {
  const html = document.documentElement;
  
  // Remove existing theme classes
  html.classList.remove('theme-light', 'theme-dark', 'theme-matrix');
  
  // Add new theme class
  html.classList.add(`theme-${theme}`);
  
  // Save preference
  localStorage.setItem('monospace-theme', theme);
  
  // Update UI
  updateThemeSelector();
  
  // Trigger custom event
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

function updateThemeSelector() {
  const currentTheme = getCurrentTheme();
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.toggle('active', option.dataset.theme === currentTheme);
  });
}

function getCurrentTheme() {
  const html = document.documentElement;
  if (html.classList.contains('theme-light')) return 'light';
  if (html.classList.contains('theme-dark')) return 'dark';
  if (html.classList.contains('theme-matrix')) return 'matrix';
  return 'light'; // fallback
}

function cycleTheme() {
  const themes = ['light', 'dark', 'matrix'];
  const current = getCurrentTheme();
  const currentIndex = themes.indexOf(current);
  const nextIndex = (currentIndex + 1) % themes.length;
  setTheme(themes[nextIndex]);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Add theme option click handlers
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      setTheme(option.dataset.theme);
    });
  });
  
  // Add keyboard shortcut for theme cycling (T key)
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only if not in an input field
        if (document.activeElement.tagName !== 'INPUT' && 
            document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          cycleTheme();
        }
      }
    }
  });
});