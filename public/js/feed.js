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

  return `
    <div class="card" data-post-id="${post._id}">
      <span class="badge">${typeLabel}</span>
      <h3 style="margin-top:8px;">${escapeHtml(post.title)}</h3>
      <p class="muted">${escapeHtml(post.destination)}${post.group ? ' · ' + escapeHtml(post.group.name) : ''}</p>
      <p>${escapeHtml(post.content)}</p>
      <div>${tagsHtml}</div>
      <p class="muted" style="margin-top:8px;">מאת ${escapeHtml(post.author ? post.author.displayName : 'לא ידוע')}</p>
      ${!isMine && post.type === 'partner' ? `<a href="/posts/${post._id}"><button type="button">לפרטים ובקשת הצטרפות</button></a>` : ''}
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

function addQuestionRow() {
  const count = $('#screening-questions .question-row').length;
  if (count >= 3) return;
  $('#screening-questions').append(`
    <div class="form-row question-row">
      <label>שאלה ${count + 1}</label>
      <input type="text" class="question-text" placeholder="לדוגמה: מה אופי הטיול שאת/ה מחפש/ת?">
      <input type="text" class="question-options" placeholder="אפשרויות מופרדות בפסיק, למשל: רגוע, עמוס, מסיבות" style="margin-top:6px;">
    </div>
  `);
}

$(function () {
  loadFeed();

  $('select[name=type]').on('change', function () {
    $('#screening-section').toggle($(this).val() === 'partner');
  }).trigger('change');

  $('#add-question-btn').on('click', addQuestionRow);

  $('#new-post-form').on('submit', function (e) {
    e.preventDefault();
    const $form = $(this);
    const data = {};
    $form.serializeArray().forEach((f) => { data[f.name] = f.value; });

    if (data.type === 'partner') {
      data.screeningQuestions = [];
      $('#screening-questions .question-row').each(function () {
        const question = $(this).find('.question-text').val().trim();
        const options = $(this).find('.question-options').val().split(',').map((o) => o.trim()).filter(Boolean);
        if (question && options.length >= 2) {
          data.screeningQuestions.push({ question, options });
        }
      });
    }

    $.ajax({
      url: '/api/posts',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function () {
        $('#post-error').hide();
        $form[0].reset();
        $('#screening-questions').empty();
        loadFeed();
      },
      error: function (xhr) {
        const message = (xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בפרסום הפוסט';
        $('#post-error').text(message).show();
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
