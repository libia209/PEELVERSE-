(() => {
  const MAP = {
    home: 'ph-house',
    sprout: 'ph-plant',
    leaf: 'ph-leaf',
    citrus: 'ph-orange-slice',
    flask: 'ph-flask',
    beaker: 'ph-test-tube',
    'book-open': 'ph-book-open-text',
    gamepad: 'ph-game-controller',
    'shopping-cart': 'ph-shopping-cart',
    'shopping-bag': 'ph-shopping-bag',
    'trending-up': 'ph-chart-line-up',
    'message-circle': 'ph-chat-circle-dots',
    mail: 'ph-envelope-simple',
    copy: 'ph-copy',
    check: 'ph-check',
    'check-circle': 'ph-check-circle',
    lock: 'ph-lock-simple',
    trophy: 'ph-trophy',
    award: 'ph-medal',
    crown: 'ph-crown',
    sparkles: 'ph-sparkle',
    lightbulb: 'ph-lightbulb',
    target: 'ph-target',
    compass: 'ph-compass',
    recycle: 'ph-recycle',
    droplet: 'ph-drop',
    star: 'ph-star-four',
    'list-checks': 'ph-list-checks',
    sun: 'ph-sun'
  };

  window.PVIcon = function (name, size = 20, cls = '') {
    const phClass = MAP[name] || 'ph-sparkle';
    return `<i class="ph-duotone ${phClass} pv-duotone ${cls}" style="font-size:${size}px;" aria-hidden="true"></i>`;
  };
})();
