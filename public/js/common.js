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
});
