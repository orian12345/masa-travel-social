function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

let currentPost = null;

function renderPost() {
  const p = currentPost;
  const isMine = p.author && p.author._id === window.CURRENT_USER_ID;

  $('#post-content').html(`
    <div class="card">
      <span class="badge">${p.type === 'partner' ? 'מחפש/ת שותף/ה' : 'המלצה'}</span>
      <h1 style="margin-top:8px;">${escapeHtml(p.title)}</h1>
      <p class="muted">${escapeHtml(p.destination)}${p.group ? ' · קבוצה: ' + escapeHtml(p.group.name) : ''}</p>
      <p>${escapeHtml(p.content)}</p>
      ${p.budgetPerDay ? `<p class="muted">תקציב יומי משוער: ${p.budgetPerDay}€</p>` : ''}
      <div>${(p.tags || []).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join(' ')}</div>
      <hr style="border:none; border-top:1px solid var(--line); margin:14px 0;">
      <p class="muted">מאת ${escapeHtml(p.author ? p.author.displayName : '')} ${p.author && p.author.verified ? '<span class="badge">מאומת</span>' : ''}</p>
      ${p.author && p.author.age ? `<p class="muted">גיל ${p.author.age}</p>` : ''}
      ${p.author && p.author.languages && p.author.languages.length ? `<p class="muted">שפות: ${escapeHtml(p.author.languages.join(', '))}</p>` : ''}
    </div>
  `);

  if (!isMine && p.type === 'partner') {
    $('#request-panel').show();
    const questions = p.screeningQuestions || [];
    const $q = $('#request-questions').empty();
    questions.forEach((q, i) => {
      const options = q.options
        .map((opt) => `<label style="display:block; margin:4px 0;"><input type="radio" name="q${i}" value="${escapeHtml(opt)}" style="width:auto;"> ${escapeHtml(opt)}</label>`)
        .join('');
      $q.append(`<div class="form-row"><label>${escapeHtml(q.question)}</label>${options}</div>`);
    });
  }
}

function loadPost() {
  $.get('/api/posts/' + window.POST_ID, function (post) {
    currentPost = post;
    renderPost();
  });
}

$(function () {
  loadPost();

  $('#send-request-btn').on('click', function () {
    const questions = currentPost.screeningQuestions || [];
    const answers = [];

    for (let i = 0; i < questions.length; i++) {
      const value = $(`input[name="q${i}"]:checked`).val();
      if (!value) {
        $('#request-error').text('נא לענות על כל שאלות הסינון').show();
        return;
      }
      answers.push({ question: questions[i].question, answer: value });
    }

    $.ajax({
      url: '/api/chat-requests',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ postId: window.POST_ID, toUser: currentPost.author._id, answers }),
      success: function (result) {
        $('#request-error').hide();
        if (result.alreadyApproved) {
          window.location.href = '/chat?with=' + currentPost.author._id;
          return;
        }
        $('#send-request-btn').hide();
        $('#request-sent-msg').show();
      },
      error: function (xhr) {
        $('#request-error').text((xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בשליחת הבקשה').show();
      },
    });
  });
});
