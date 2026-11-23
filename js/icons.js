(() => {
  // Minimalist Luxury Botanical Apothecary monochrome SVG icon library (stroke-width 1.5)
  const PATHS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
    compass: '<circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5"/>',
    sprout: '<path d="M7 20h10"/><path d="M12 20V10"/><path d="M12 13c-3.5 0-6-2.2-6-5.5 3.5 0 6 2 6 5.5Z"/><path d="M12 11c3.5 0 6-2.2 6-5.5-3.5 0-6 2-6 5.5Z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    citrus: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64 5.64 18.36"/>',
    flask: '<path d="M10 2v7.5L4.7 19.5a1.5 1.5 0 0 0 1.3 2.25h12a1.5 1.5 0 0 0 1.3-2.25L14 9.5V2"/><path d="M8.5 2h7"/><path d="M7 15.5h10"/>',
    beaker: '<path d="M4.5 3h15"/><path d="M6 3v15.5A2.5 2.5 0 0 0 8.5 21h7a2.5 2.5 0 0 0 2.5-2.5V3"/><path d="M6 13.5h12"/>',
    'book-open': '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    gamepad: '<rect x="3" y="7" width="18" height="10" rx="3"/><path d="M7 12h4M9 10v4"/><circle cx="15.5" cy="11" r="0.8" fill="currentColor"/><circle cx="17.5" cy="13" r="0.8" fill="currentColor"/>',
    sliders: '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="2"/>',
    'shopping-cart': '<path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/>',
    'shopping-bag': '<path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/>',
    'trending-up': '<polyline points="21 7 13.5 14.5 9 10 3 16"/><polyline points="16 7 21 7 21 12"/>',
    'message-circle': '<path d="M21 12a8.5 8.5 0 0 1-12.3 7.6L3 21l1.4-5.7A8.5 8.5 0 1 1 21 12Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><polyline points="8.5 12.2 10.8 14.5 15.5 9.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    trophy: '<path d="M6 9H4a2 2 0 0 1 0-4h2"/><path d="M18 9h2a2 2 0 0 0 0-4h-2"/><path d="M6 4h12v5a6 6 0 0 1-12 0V4Z"/><path d="M12 15v5"/><path d="M8 20h8"/>',
    award: '<circle cx="12" cy="9" r="5.5"/><path d="M9 14v7l3-2 3 2v-7"/>',
    crown: '<path d="m3 17 2-9 5 4 2-6 2 6 5-4 2 9H3Z"/>',
    sparkles: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>',
    lightbulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.8c.5.4.8 1 .8 1.7V16h5.4v-.5c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    recycle: '<path d="M7 19H4.8a1.8 1.8 0 0 1-1.5-2.7L7.2 9.5"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.5-2.7l-1.2-2.1"/><path d="m14 16-3 3 3 3"/><path d="m9.3 5.8 1.1-1.9a1.8 1.8 0 0 1 3.1 0l3.9 6.8"/>',
    droplet: '<path d="M12 2.5C9 7.5 6 10.5 6 14a6 6 0 0 0 12 0c0-3.5-3-6.5-6-11.5Z"/>',
    star: '<polygon points="12 3 14.8 8.6 21 9.5 16.5 13.8 17.6 20 12 17 6.4 20 7.5 13.8 3 9.5 9.2 8.6 12 3"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
    funnel: '<polygon points="3 4 21 4 14 12.5 14 19 10 21 10 12.5 3 4"/>',
    storefront: '<path d="M3 9 4.5 4h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>',
    package: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><line x1="20" y1="20" x2="16.4" y2="16.4"/>',
    'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'
  };

  window.PVIcon = function (name, size = 18, cls = '') {
    const inner = PATHS[name] || PATHS.sparkles;
    return `<svg class="pv-svg-icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  };
})();
