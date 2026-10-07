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
});
