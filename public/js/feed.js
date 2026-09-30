function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

let feedPosts = [];
let editingPostId = null;
const openComments = {}; // postId -> true while its comment panel is expanded

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
      <button type="button" class="secondary edit-post" data-id="${post._id}">עריכה</button>
      <button type="button" class="secondary delete-post" data-id="${post._id}">מחיקה</button>
    `
    : '';

  let contactAction = '';
  if (!isMine && post.author) {
    contactAction =
      post.type === 'partner'
        ? `<a href="/posts/${post._id}"><button type="button">לפרטים ובקשת הצטרפות</button></a>`
        : `<button type="button" class="secondary contact-author" data-user-id="${post.author._id}">יצירת קשר עם ${escapeHtml(post.author.displayName)}</button>`;
  }

  const sharedFromHtml = post.sharedFrom
    ? `<p class="muted" style="font-size:11.5px;">שותף מתוך פוסט של ${escapeHtml(post.sharedFrom.author ? post.sharedFrom.author.displayName : '')}</p>`
    : '';

  const imageHtml = post.imageBase64
    ? `<img src="${post.imageBase64}" style="width:100%; border-radius:var(--radius-m); margin:10px 0;" alt="">`
    : '';

  const heartColor = post.likedByMe ? 'var(--primary)' : 'var(--text-muted)';
  const isOpen = !!openComments[post._id];

  const shareUrl = window.location.origin + '/posts/' + post._id;
  const shareText = encodeURIComponent(post.title + ' - ' + post.destination + '\n' + shareUrl);
  const whatsappHref = 'https://wa.me/?text=' + shareText;
  const smsHref = 'sms:?body=' + shareText;

  return `
    <div class="card" data-post-id="${post._id}">
      <span class="badge">${typeLabel}</span>
      ${sharedFromHtml}
      <h3 style="margin-top:8px;">${escapeHtml(post.title)}</h3>
      <p class="muted">${escapeHtml(post.destination)}${post.group ? ' · ' + escapeHtml(post.group.name) : ''}</p>
      <p>${escapeHtml(post.content)}</p>
      ${imageHtml}
      <div>${tagsHtml}</div>
      <p class="muted" style="margin-top:8px;">מאת ${escapeHtml(post.author ? post.author.displayName : 'לא ידוע')}</p>

      <div style="display:flex; gap:8px; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid var(--line);">
        <button type="button" class="secondary toggle-like" data-id="${post._id}" style="color:${heartColor};">
          ♥ ${post.likesCount || 0}
        </button>
        <button type="button" class="secondary toggle-comments" data-id="${post._id}">תגובות</button>
        <button type="button" class="secondary toggle-share-menu" data-id="${post._id}">שיתוף</button>
      </div>

      <div class="share-menu" data-id="${post._id}" style="display:none; flex-direction:row; gap:8px; margin-top:8px;">
        <a href="${whatsappHref}" target="_blank" rel="noopener"><button type="button" class="secondary">שיתוף ב-WhatsApp</button></a>
        <a href="${smsHref}"><button type="button" class="secondary">שיתוף בהודעה</button></a>
      </div>

      ${contactAction}
      ${actions}

      <div class="comments-panel" data-id="${post._id}" style="${isOpen ? '' : 'display:none;'} margin-top:10px;">
        <div class="comments-list" style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px;"></div>
        <form class="add-comment-form" data-id="${post._id}" style="display:flex; gap:8px;">
          <input type="text" name="text" placeholder="כתוב/כתבי תגובה..." maxlength="500" required style="flex:1;">
          <button type="submit">שליחה</button>
        </form>
      </div>
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
  Object.keys(openComments).forEach((postId) => {
    if (openComments[postId]) loadComments(postId);
  });
}

function loadFeed() {
  $.get('/api/posts/feed', function (posts) {
    feedPosts = posts;
    renderFeed();
  });
}

function renderComment(c) {
  const isMine = c.author && c.author._id === window.CURRENT_USER_ID;
  return `
    <div class="comment-row" data-comment-id="${c._id}" style="font-size:13px; display:flex; justify-content:space-between; gap:8px;">
      <div><strong>${escapeHtml(c.author ? c.author.displayName : '')}</strong>: ${escapeHtml(c.text)}</div>
      ${isMine ? `<button type="button" class="secondary delete-comment" data-comment-id="${c._id}" style="padding:2px 8px; font-size:11px;">מחיקה</button>` : ''}
    </div>
  `;
}

function loadComments(postId) {
  $.get('/api/posts/' + postId + '/comments', function (comments) {
    const $panel = $(`.comments-panel[data-id="${postId}"] .comments-list`);
    $panel.empty();
    if (!comments.length) {
      $panel.append('<p class="muted" style="font-size:12px;">אין עדיין תגובות.</p>');
    } else {
      comments.forEach((c) => $panel.append(renderComment(c)));
    }
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

  $('#feed-list').on('click', '.toggle-like', function () {
    const id = $(this).data('id').toString();
    $.post('/api/posts/' + id + '/like', function (result) {
      const post = feedPosts.find((p) => p._id === id);
      if (post) {
        post.likesCount = result.likesCount;
        post.likedByMe = result.likedByMe;
        renderFeed();
      }
    });
  });

  $('#feed-list').on('click', '.toggle-share-menu', function () {
    const id = $(this).data('id').toString();
    const $menu = $(`.share-menu[data-id="${id}"]`);
    $menu.css('display', $menu.css('display') === 'none' ? 'flex' : 'none');
  });

  $('#feed-list').on('click', '.toggle-comments', function () {
    const id = $(this).data('id').toString();
    openComments[id] = !openComments[id];
    const $panel = $(`.comments-panel[data-id="${id}"]`);
    $panel.toggle(openComments[id]);
    if (openComments[id]) loadComments(id);
  });

  $('#feed-list').on('submit', '.add-comment-form', function (e) {
    e.preventDefault();
    const id = $(this).data('id').toString();
    const text = $(this).find('input[name=text]').val();
    const $form = $(this);
    $.ajax({
      url: '/api/posts/' + id + '/comments',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ text }),
      success: function () {
        $form[0].reset();
        loadComments(id);
      },
    });
  });

  $('#feed-list').on('click', '.delete-comment', function () {
    const commentId = $(this).data('comment-id').toString();
    const postId = $(this).closest('.comments-panel').data('id').toString();
    $.ajax({
      url: '/api/posts/' + postId + '/comments/' + commentId,
      method: 'DELETE',
      success: function () { loadComments(postId); },
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
