function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

// A stable color per author, derived from their name — gives every avatar a
// distinct but consistent circle color without storing one per user.
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return `oklch(55% 0.14 ${hash})`;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'עכשיו';
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(dateStr).toLocaleDateString('he-IL');
}

const ICON_THUMB_UP =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v11"/><path d="M15 5.88 14 10h6.5a2 2 0 0 1 2 2.4l-1.6 7A2 2 0 0 1 19 21H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L13 3a2.6 2.6 0 0 1 2 2.88Z"/></svg>';
const ICON_THUMB_UP_FILLED =
  '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Zm13.5 1.5a2 2 0 0 0-1.76-1.5H14l1-4.12A2.6 2.6 0 0 0 13 3l-2.45 3.89A2 2 0 0 1 8.76 7.9L8 8v13h11a2 2 0 0 0 2-1.6l1.6-7a2 2 0 0 0-.1-1.1Z"/></svg>';
const ICON_COMMENT =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>';
const ICON_SHARE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>';

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

  const isOpen = !!openComments[post._id];
  const authorName = post.author ? post.author.displayName : 'לא ידוע';
  const initial = authorName.trim().charAt(0) || '?';

  const shareUrl = window.location.origin + '/posts/' + post._id;
  const shareText = encodeURIComponent(post.title + ' - ' + post.destination + '\n' + shareUrl);
  const whatsappHref = 'https://wa.me/?text=' + shareText;
  const smsHref = 'sms:?body=' + shareText;

  return `
    <div class="card" data-post-id="${post._id}">
      <div class="post-header">
        <div class="post-avatar" style="background:${avatarColor(authorName)};">${escapeHtml(initial)}</div>
        <div class="post-header-text">
          <span class="post-author-name">${escapeHtml(authorName)}</span>
          <span class="post-timestamp">
            ${timeAgo(post.createdAt)} · <span class="badge" style="padding:1px 8px; font-size:10.5px;">${typeLabel}</span>
            ${post.group ? ' · ' + escapeHtml(post.group.name) : ''}
          </span>
        </div>
      </div>

      ${sharedFromHtml}
      <p style="margin:0 0 4px;"><strong>${escapeHtml(post.title)}</strong> · <span class="muted">${escapeHtml(post.destination)}</span></p>
      <p>${escapeHtml(post.content)}</p>
      ${imageHtml}
      <div>${tagsHtml}</div>

      <div class="post-action-bar">
        <button type="button" class="toggle-like ${post.likedByMe ? 'liked' : ''}" data-id="${post._id}">
          ${post.likedByMe ? ICON_THUMB_UP_FILLED : ICON_THUMB_UP} לייק ${post.likesCount ? `(${post.likesCount})` : ''}
        </button>
        <button type="button" class="toggle-comments" data-id="${post._id}">${ICON_COMMENT} תגובה</button>
        <button type="button" class="toggle-share-menu" data-id="${post._id}">${ICON_SHARE} שיתוף</button>
      </div>

      <div class="share-menu" data-id="${post._id}" style="display:none; flex-direction:row; gap:8px; margin-top:8px;">
        <a href="${whatsappHref}" target="_blank" rel="noopener"><button type="button" class="secondary">שיתוף ב-WhatsApp</button></a>
        <a href="${smsHref}"><button type="button" class="secondary">שיתוף בהודעה</button></a>
      </div>

      ${contactAction ? `<div style="margin-top:10px;">${contactAction}</div>` : ''}
      ${actions ? `<div style="margin-top:10px; display:flex; gap:8px;">${actions}</div>` : ''}

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
