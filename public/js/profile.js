function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

const TRAVEL_STYLE_LABELS = {
  relaxed: 'בטן־גב',
  backpacking: 'תרמילאות',
  museums: 'מוזיאונים',
  nightlife: 'חיי לילה',
  family: 'משפחות',
};

function loadProfile() {
  $.get('/api/users/' + window.PROFILE_ID, function (user) {
    const isOwn = user._id === window.CURRENT_USER_ID;

    $('#profile-content').html(`
      <div class="card" style="text-align:center;">
        <h1>${escapeHtml(user.displayName)} ${user.verified ? '<span class="badge">מאומת</span>' : ''}</h1>
        <p class="muted">${user.age ? user.age + ' · ' : ''}${escapeHtml((user.languages || []).join(', '))}</p>
        <p class="muted">${TRAVEL_STYLE_LABELS[user.travelStyle] || ''}</p>
        <p>${escapeHtml(user.bio || '')}</p>
        ${!isOwn ? `
          <div id="profile-request-error" class="error-box" style="display:none;"></div>
          <button type="button" id="message-btn">שליחת בקשת צ'אט</button>
          <button type="button" class="secondary" id="block-btn">חסימה</button>
          <button type="button" class="secondary" id="report-btn">דיווח</button>
        ` : ''}
      </div>
    `);

    $('#message-btn').on('click', function () {
      $.ajax({
        url: '/api/chat-requests',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ toUser: user._id, answers: [] }),
        success: function (result) {
          if (result.alreadyApproved) {
            window.location.href = '/chat?with=' + user._id;
          } else {
            $('#profile-request-error').removeClass('error-box').addClass('badge').text('בקשת הצ׳אט נשלחה, ממתינה לאישור').show();
          }
        },
        error: function (xhr) {
          $('#profile-request-error').addClass('error-box').text((xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בשליחת הבקשה').show();
        },
      });
    });

    $('#block-btn').on('click', function () {
      if (!confirm('לחסום את המשתמש הזה? הוא/היא לא יוכלו ליצור איתך קשר.')) return;
      $.post('/api/moderation/block/' + user._id, function () {
        alert('המשתמש נחסם');
      });
    });

    $('#report-btn').on('click', function () {
      const reason = prompt('מה סיבת הדיווח?');
      if (!reason) return;
      $.ajax({
        url: '/api/moderation/report/' + user._id,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ reason }),
        success: function () { alert('הדיווח נשלח, תודה'); },
      });
    });

    if (isOwn) {
      $('#edit-section').show();
      $('#edit-profile-form [name=displayName]').val(user.displayName);
      $('#edit-profile-form [name=age]').val(user.age || '');
      $('#edit-profile-form [name=bio]').val(user.bio || '');
      $('#edit-profile-form [name=languages]').val((user.languages || []).join(', '));
      $('#edit-profile-form [name=travelStyle]').val(user.travelStyle);

      if (!user.verified) {
        $('#verify-section').show();
        mountVerifyWidget(user._id);
      }
    }
  });
}

$(function () {
  loadProfile();

  $('#edit-profile-form').on('submit', function (e) {
    e.preventDefault();
    const data = {};
    $(this).serializeArray().forEach((f) => { data[f.name] = f.value; });

    $.ajax({
      url: '/api/users/' + window.PROFILE_ID,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function () {
        $('#profile-error').hide();
        loadProfile();
      },
      error: function (xhr) {
        $('#profile-error').text((xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה').show();
      },
    });
  });

  $('#delete-account-btn').on('click', function () {
    if (!confirm('פעולה זו תמחק את החשבון שלך לצמיתות. להמשיך?')) return;
    $.ajax({
      url: '/api/users/' + window.PROFILE_ID,
      method: 'DELETE',
      success: function () { window.location.href = '/login'; },
    });
  });
});
