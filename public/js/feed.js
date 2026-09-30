function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

let feedPosts = [];
let editingPostId = null;

function renderPostCard(post) {
  const isMine = post.author && post.author._id === window.CURRENT_USER_ID;
  const typeLabel = post.type === 'partner' ? 'מחפש/ת שותף/ה' : 'המלצה';

  if (isMine && editingPostId === post._id) {
    return `
      <div class="card" data-post-id="${post._id}">
        <form class="edit-post-form">
          <div class="form-row"><label>כותרת</label><input type="text" name="title" value="${escapeHtml(post.title)}" required></div>
          <div class="form-row"><label>יעד</label><input type="text" name="destination" value="${escapeHtml(post.destination)}" required></div>
          <div class="form-row"><label>תיאור</label><textarea name="content" rows="3" required>${escapeHtml(post.content)}</textarea></div>
          <div class="form-row"><label>תקציב יומי (€)</label><input type="number" name="budgetPerDay" min="0" value="${post.budgetPerDay || ''}"></div>
          <div class="form-row"><label>תגיות</label><input type="text" name="tags" value="${escapeHtml((post.tags || []).join(', '))}"></div>
          <button type="submit">שמירה</button>
          <button type="button" class="secondary cancel-edit-post">ביטול</button>
        </form>
      </div>
    `;
  }

  const tagsHtml = (post.tags || [])
    .map((t) => `<span class="chip">${escapeHtml(t)}</span>`)
    .join(' ');

  const actions = isMine
    ? `
      <button type="button" class="secondary edit-post" data-id="${post._id}" style="margin-top:10px;">עריכה</button>
      <button type="button" class="secondary delete-post" data-id="${post._id}" style="margin-top:10px;">מחיקה</button>
    `
    : '';

  let contactAction = '';
  if (!isMine && post.author) {
    contactAction =
      post.type === 'partner'
        ? `<a href="/posts/${post._id}"><button type="button">לפרטים ובקשת הצטרפות</button></a>`
        : `<button type="button" class="secondary contact-author" data-user-id="${post.author._id}">יצירת קשר עם ${escapeHtml(post.author.displayName)}</button>`;
  }

  return `
    <div class="card" data-post-id="${post._id}">
      <span class="badge">${typeLabel}</span>
      <h3 style="margin-top:8px;">${escapeHtml(post.title)}</h3>
      <p class="muted">${escapeHtml(post.destination)}${post.group ? ' · ' + escapeHtml(post.group.name) : ''}</p>
      <p>${escapeHtml(post.content)}</p>
      <div>${tagsHtml}</div>
      <p class="muted" style="margin-top:8px;">מאת ${escapeHtml(post.author ? post.author.displayName : 'לא ידוע')}</p>
      ${contactAction}
      ${actions}
    </div>
  `;
}

function renderFeed() {
  const $list = $('#feed-list').empty();
  if (!feedPosts.length) {
    $list.append('<p class="muted">אין עדיין פוסטים. פרסמ/י את הראשון!</p>');
    return;
  }
  feedPosts.forEach((post) => $list.append(renderPostCard(post)));
}

function loadFeed() {
  $.get('/api/posts/feed', function (posts) {
    feedPosts = posts;
    renderFeed();
  });
}

$(function () {
  loadFeed();

  $('#feed-list').on('click', '.contact-author', function () {
    const userId = $(this).data('user-id').toString();
    const $btn = $(this);
    $.ajax({
      url: '/api/chat-requests',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ toUser: userId, answers: [] }),
      success: function (result) {
        if (result.alreadyApproved) {
          window.location.href = '/chat?with=' + userId;
        } else {
          $btn.prop('disabled', true).text('בקשת הצ׳אט נשלחה');
        }
      },
      error: function (xhr) {
        alert((xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בשליחת הבקשה');
      },
    });
  });

  $('#feed-list').on('click', '.delete-post', function () {
    const id = $(this).data('id');
    if (!confirm('למחוק את הפוסט הזה?')) return;
    $.ajax({ url: '/api/posts/' + id, method: 'DELETE', success: loadFeed });
  });

  $('#feed-list').on('click', '.edit-post', function () {
    editingPostId = $(this).data('id').toString();
    renderFeed();
  });

  $('#feed-list').on('click', '.cancel-edit-post', function () {
    editingPostId = null;
    renderFeed();
  });

  $('#feed-list').on('submit', '.edit-post-form', function (e) {
    e.preventDefault();
    const id = $(this).closest('.card').data('post-id');
    const data = {};
    $(this).serializeArray().forEach((f) => { data[f.name] = f.value; });

    $.ajax({
      url: '/api/posts/' + id,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function () {
        editingPostId = null;
        loadFeed();
      },
      error: function (xhr) {
        alert((xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בעדכון הפוסט');
      },
    });
  });
});
