function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

let activeUserId = null;
let activeUserName = null;
const socket = io();

function renderMessage(msg) {
  const mine = msg.sender === window.CURRENT_USER_ID;
  const $bubble = $(`<div class="chat-bubble ${mine ? 'mine' : 'theirs'}"></div>`).text(msg.text);
  $('#chat-messages').append($bubble);
  $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
}

function openConversation(userId, displayName) {
  activeUserId = userId;
  activeUserName = displayName;
  $('#chat-with-name').text(displayName);
  $('#chat-input, #chat-send-btn').prop('disabled', false);
  $('.conversation-row').removeClass('active');
  $(`.conversation-row[data-user-id="${userId}"]`).addClass('active');

  $.ajax({
    url: '/api/messages/' + userId,
    success: function (messages) {
      $('#chat-messages').empty();
      messages.forEach(renderMessage);
    },
    error: function (xhr) {
      $('#chat-messages').html(
        `<p class="muted">${(xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בטעינת ההודעות'}</p>`
      );
      $('#chat-input, #chat-send-btn').prop('disabled', true);
    },
  });
}

function loadConversations(selectUserId) {
  $.get('/api/messages', function (conversations) {
    const $list = $('#conversations-list').empty();
    if (!conversations.length) {
      $list.append('<p class="muted">אין עדיין שיחות.</p>');
    }
    conversations.forEach((c) => {
      $list.append(`
        <div class="conversation-row" data-user-id="${c.userId}" style="padding:10px; border-radius: var(--radius-s); cursor:pointer;">
          <strong>${escapeHtml(c.displayName)}</strong>
          <p class="muted" style="margin:2px 0 0;">${escapeHtml(c.lastMessage || '')}</p>
        </div>
      `);
    });

    if (selectUserId) {
      const existing = conversations.find((c) => c.userId === selectUserId);
      if (existing) {
        openConversation(existing.userId, existing.displayName);
      } else {
        $.get('/api/users/' + selectUserId, function (user) {
          openConversation(user._id, user.displayName);
        });
      }
    } else if (activeUserId) {
      // A background refresh (new message arrived) — keep the open
      // conversation highlighted instead of losing the selection.
      $(`.conversation-row[data-user-id="${activeUserId}"]`).addClass('active');
    }
  });
}

function sendMessage() {
  const text = $('#chat-input').val().trim();
  if (!text || !activeUserId) return;
  socket.emit('chat:send', { recipientId: activeUserId, text });
  $('#chat-input').val('');
}

$(function () {
  const params = new URLSearchParams(window.location.search);
  loadConversations(params.get('with'));

  $('#conversations-list').on('click', '.conversation-row', function () {
    openConversation($(this).data('user-id').toString(), $(this).find('strong').text());
  });

  $('#chat-send-btn').on('click', sendMessage);
  $('#chat-input').on('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });

  socket.on('chat:message', function (msg) {
    if (activeUserId && (msg.sender === activeUserId || msg.recipient === activeUserId)) {
      renderMessage(msg);
    }
    loadConversations();
  });

  socket.on('chat:error', function (payload) {
    alert(payload.error);
  });

  socket.on('chat:safety-warning', function (payload) {
    $('#chat-messages').append(`<p class="muted" style="text-align:center;">⚠ ${escapeHtml(payload.message)}</p>`);
    $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
  });
});
