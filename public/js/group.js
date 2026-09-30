function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

let currentGroup = null;

function renderGroupHeader() {
  const g = currentGroup;
  const isAdmin = g.admin && g.admin._id === window.CURRENT_USER_ID;
  const isMember = (g.members || []).some((m) => m._id === window.CURRENT_USER_ID);

  const membershipButton = isAdmin
    ? ''
    : isMember
    ? '<button type="button" class="secondary" id="leave-group-btn">עזיבת הקבוצה</button>'
    : '<button type="button" id="join-group-btn">הצטרפות לקבוצה</button>';

  $('#group-header').html(`
    <h1>${escapeHtml(g.name)}</h1>
    <p class="muted">${escapeHtml(g.destination)} · ${g.members.length} חברים · מנהל/ת: ${escapeHtml(g.admin.displayName)}</p>
    <p>${escapeHtml(g.description || '')}</p>
    ${membershipButton}
  `);

  $('#group-admin-panel').toggle(isAdmin);
  if (isAdmin) {
    $('#edit-group-form [name=name]').val(g.name);
    $('#edit-group-form [name=destination]').val(g.destination);
    $('#edit-group-form [name=description]').val(g.description || '');
  }
}

function loadGroup() {
  $.get('/api/groups/' + window.GROUP_ID, function (group) {
    currentGroup = group;
    renderGroupHeader();
  });
}

function loadGroupPosts() {
  $.get('/api/posts/group/' + window.GROUP_ID, function (posts) {
    const $list = $('#group-posts').empty();
    if (!posts.length) {
      $list.append('<p class="muted">אין עדיין פוסטים בקבוצה הזו.</p>');
      return;
    }
    posts.forEach((post) => {
      const isMine = post.author && post.author._id === window.CURRENT_USER_ID;
      $list.append(`
        <div class="card">
          <span class="badge">${post.type === 'partner' ? 'מחפש/ת שותף/ה' : 'המלצה'}</span>
          <h3 style="margin-top:8px;">${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.content)}</p>
          <p class="muted">מאת ${escapeHtml(post.author ? post.author.displayName : '')}</p>
          ${!isMine && post.type === 'partner' ? `<a href="/posts/${post._id}"><button type="button">לפרטים ובקשת הצטרפות</button></a>` : ''}
          ${isMine ? `<button type="button" class="secondary delete-group-post" data-id="${post._id}">מחיקה</button>` : ''}
        </div>
      `);
    });
  });
}

$(function () {
  loadGroup();
  loadGroupPosts();

  $(document).on('click', '#join-group-btn', function () {
    $.post('/api/groups/' + window.GROUP_ID + '/join', loadGroup);
  });
  $(document).on('click', '#leave-group-btn', function () {
    $.post('/api/groups/' + window.GROUP_ID + '/leave', loadGroup);
  });

  $('#edit-group-form').on('submit', function (e) {
    e.preventDefault();
    const data = {};
    $(this).serializeArray().forEach((f) => { data[f.name] = f.value; });
    $.ajax({
      url: '/api/groups/' + window.GROUP_ID,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: loadGroup,
      error: function (xhr) {
        $('#group-admin-error').text((xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה').show();
      },
    });
  });

  $('#delete-group-btn').on('click', function () {
    if (!confirm('למחוק את הקבוצה לצמיתות?')) return;
    $.ajax({
      url: '/api/groups/' + window.GROUP_ID,
      method: 'DELETE',
      success: function () { window.location.href = '/groups'; },
    });
  });

  $('#new-group-post-form').on('submit', function (e) {
    e.preventDefault();
    const $form = $(this);
    const data = { destination: currentGroup.destination, groupId: window.GROUP_ID };
    $form.serializeArray().forEach((f) => { data[f.name] = f.value; });

    $.ajax({
      url: '/api/posts',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function () {
        $('#group-post-error').hide();
        $form[0].reset();
        loadGroupPosts();
      },
      error: function (xhr) {
        $('#group-post-error').text((xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה').show();
      },
    });
  });

  $('#group-posts').on('click', '.delete-group-post', function () {
    const id = $(this).data('id');
    if (!confirm('למחוק את הפוסט?')) return;
    $.ajax({ url: '/api/posts/' + id, method: 'DELETE', success: loadGroupPosts });
  });
});
