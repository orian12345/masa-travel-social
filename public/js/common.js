$(function () {
  $('#logout-btn').on('click', function () {
    $.ajax({
      url: '/logout',
      method: 'POST',
      success: function () {
        window.location.href = '/login';
      },
    });
  });

  // Side-drawer nav (see styles.css's max-width:860px block): the hamburger
  // button toggles the drawer open/closed, the backdrop or any nav link
  // click closes it again (so navigating away doesn't leave it hanging open
  // on the next page).
  const $navMenu = $('#nav-menu');
  const $navToggle = $('#nav-toggle');
  const $navBackdrop = $('#nav-backdrop');

  function closeNav() {
    $navMenu.removeClass('open');
    $navBackdrop.removeClass('open');
    $navToggle.attr('aria-expanded', 'false');
  }

  function toggleNav() {
    const isOpen = $navMenu.toggleClass('open').hasClass('open');
    $navBackdrop.toggleClass('open', isOpen);
    $navToggle.attr('aria-expanded', isOpen ? 'true' : 'false');
  }

  $navToggle.on('click', toggleNav);
  $navBackdrop.on('click', closeNav);
  $navMenu.on('click', 'a', closeNav);

  // Nav badges: polled rather than wired to every page's own socket, since
  // most pages don't otherwise need a live connection — a 30s refresh is
  // plenty for "you have unread messages/requests" to feel current.
  function setBadge($el, count) {
    if (count > 0) $el.text(count > 9 ? '9+' : count).prop('hidden', false);
    else $el.prop('hidden', true);
  }

  function refreshNotificationBadges() {
    if (!window.CURRENT_USER_ID) return;
    $.get('/api/notifications/summary', function (data) {
      setBadge($('#badge-messages'), data.unreadMessageRooms);
      setBadge($('#badge-requests'), data.pendingRequests);
    });
  }

  if (window.CURRENT_USER_ID) {
    refreshNotificationBadges();
    setInterval(refreshNotificationBadges, 30000);
  }

  // Registers the (deliberately minimal — see sw.js) service worker so the
  // browser treats the site as installable ("Add to Home Screen" on mobile,
  // an install icon in the address bar on desktop).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function (err) {
      console.error('Service worker registration failed', err);
    });
  }
});
