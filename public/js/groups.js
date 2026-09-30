function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

function loadGroups(destination) {
  $.get('/api/groups', destination ? { destination } : {}, function (groups) {
    const $list = $('#groups-list').empty();
    if (!groups.length) {
      $list.append('<p class="muted">אין עדיין קבוצות. תהי/ה הראשונ/ה ליצור אחת!</p>');
      return;
    }
    groups.forEach((g) => {
      $list.append(`
        <div class="card">
          <h3>${escapeHtml(g.name)}</h3>
          <p class="muted">${escapeHtml(g.destination)} · ${g.members.length} חברים</p>
          <p>${escapeHtml(g.description || '')}</p>
          <p class="muted">מנהל/ת: ${escapeHtml(g.admin ? g.admin.displayName : '')}</p>
          <a href="/groups/${g._id}"><button type="button">כניסה לקבוצה</button></a>
        </div>
      `);
    });
  });
}

$(function () {
  loadGroups();

  $('#group-filter').on('input', function () {
    loadGroups($(this).val());
  });

  $('#new-group-form').on('submit', function (e) {
    e.preventDefault();
    const $form = $(this);
    const data = {};
    $form.serializeArray().forEach((f) => { data[f.name] = f.value; });

    $.ajax({
      url: '/api/groups',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function () {
        $('#group-error').hide();
        $form[0].reset();
        loadGroups();
      },
      error: function (xhr) {
        const message = (xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה ביצירת הקבוצה';
        $('#group-error').text(message).show();
      },
    });
  });
});
