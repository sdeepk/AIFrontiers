(function () {
  var body = document.body;
  var current = parseInt(body.getAttribute('data-slide'), 10);
  var total = parseInt(body.getAttribute('data-total'), 10);

  if (!current || !total) {
    // Index page – arrow right goes to slide 1
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        window.location.href = 'slides/slide-001.html';
      }
    });
    return;
  }

  function pad(n) {
    return String(n).padStart(3, '0');
  }

  function go(n) {
    if (n < 1 || n > total) return;
    window.location.href = 'slide-' + pad(n) + '.html';
  }

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      go(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      go(current - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      window.location.href = '../index.html';
    }
  });

  // Touch swipe support
  var touchStartX = 0;
  document.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  });
  document.addEventListener('touchend', function (e) {
    var diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) go(current + 1);
      else go(current - 1);
    }
  });
})();
