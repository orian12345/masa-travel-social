function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

function loadRequests() {
  $.get('/api/chat-requests', function (requests) {
    const $list = $('#requests-list').empty();
    if (!requests.length) {
      $list.append('<p class="muted">אין בקשות ממתינות כרגע.</p>');
      return;
    }

    requests.forEach((r) => {
      const answersHtml = (r.answers || [])
        .map((a) => `<p class="muted"><strong>${escapeHtml(a.question)}</strong>: ${escapeHtml(a.answer)}</p>`)
        .join('');

      $list.append(`
        <div class="card" data-request-id="${r._id}">
          <h3>${escapeHtml(r.fromUser.displayName)} ${r.fromUser.verified ? '<span class="badge">מאומת</span>' : ''}</h3>
          <p class="muted">${r.fromUser.age ? r.fromUser.age + ' · ' : ''}${escapeHtml((r.fromUser.languages || []).join(', '))}</p>
          ${r.post ? `<p class="muted">בעניין: ${escapeHtml(r.post.title)} (${escapeHtml(r.post.destination)})</p>` : ''}
          ${answersHtml}
          <div style="margin-top:10px;">
            <button type="button" class="approve-request" data-id="${r._id}">אישור</button>
            <button type="button" class="secondary reject-request" data-id="${r._id}">דחייה</button>
          </div>
        </div>
      `);
    });
  });
}

$(function () {
  loadRequests();

  $('#requests-list').on('click', '.approve-request, .reject-request', function () {
    const id = $(this).data('id');
    const decision = $(this).hasClass('approve-request') ? 'approved' : 'rejected';
    $.ajax({
      url: '/api/chat-requests/' + id + '/respond',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ decision }),
      success: loadRequests,
    });
  });
});
