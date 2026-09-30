function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

$(function () {
  $('#post-search-form').on('submit', function (e) {
    e.preventDefault();
    const params = {};
    $(this).serializeArray().forEach((f) => { if (f.value) params[f.name] = f.value; });

    $.get('/api/posts/search', params, function (posts) {
      const $list = $('#post-results').empty();
      if (!posts.length) {
        $list.append('<p class="muted">לא נמצאו תוצאות.</p>');
        return;
      }
      posts.forEach((post) => {
        $list.append(`
          <div class="card">
            <span class="badge">${post.type === 'partner' ? 'מחפש/ת שותף/ה' : 'המלצה'}</span>
            <h3 style="margin-top:8px;">${escapeHtml(post.title)}</h3>
            <p class="muted">${escapeHtml(post.destination)}</p>
            <p>${escapeHtml(post.content)}</p>
          </div>
        `);
      });
    });
  });

  $('#user-search-form').on('submit', function (e) {
    e.preventDefault();
    const params = {};
    $(this).serializeArray().forEach((f) => { params[f.name] = f.value; });

    $.get('/api/users/search', params, function (users) {
      const $list = $('#user-results').empty();
      if (!users.length) {
        $list.append('<p class="muted">לא נמצאו מטיילים מתאימים.</p>');
        return;
      }
      users.forEach((u) => {
        $list.append(`
          <div class="card">
            <h3>${escapeHtml(u.displayName)}${u.verified ? ' <span class="badge">מאומת</span>' : ''}</h3>
            <p class="muted">${escapeHtml((u.languages || []).join(', '))}</p>
            <p><a href="/profile/${u._id}">לצפייה בפרופיל</a></p>
          </div>
        `);
      });
    });
  });
});
