function escapeHtml(str) {
  return $('<div>').text(str == null ? '' : str).html();
}

let activeTab = 'private';
let activeChat = null; // { type: 'private'|'group', id, name }
const socket = io();

function renderMessage(msg) {
  const mine = msg.sender === window.CURRENT_USER_ID;
  const $bubble = $(`<div class="chat-bubble ${mine ? 'mine' : 'theirs'}"></div>`);
  if (activeChat && activeChat.type === 'group' && !mine) {
    const name = msg.senderName || (msg.sender && msg.sender.displayName) || '';
    $bubble.append($('<strong>').css({ display: 'block', fontSize: '11px', marginBottom: '2px' }).text(name));
  }
  $bubble.append(document.createTextNode(msg.text));
  $('#chat-messages').append($bubble);
  $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
}

function openPrivateConversation(userId, displayName) {
  activeChat = { type: 'private', id: userId, name: displayName };
  $('#chat-with-name').text(displayName);
  $('#chat-input, #chat-send-btn').prop('disabled', false);
  $('.conversation-row, .group-chat-row').removeClass('active');
  $(`.conversation-row[data-user-id="${userId}"]`).addClass('active');

  $.ajax({
    url: '/api/messages/' + userId,
    success: function (messages) {
      $('#chat-messages').empty();
      messages.forEach(renderMessage);
    },
    error: function (xhr) {
      $('#chat-messages').html(`<p class="muted">${(xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בטעינת ההודעות'}</p>`);
      $('#chat-input, #chat-send-btn').prop('disabled', true);
    },
  });
}

function openGroupChat(groupId, name) {
  activeChat = { type: 'group', id: groupId, name };
  $('#chat-with-name').text(name);
  $('#chat-input, #chat-send-btn').prop('disabled', false);
  $('.conversation-row, .group-chat-row').removeClass('active');
  $(`.group-chat-row[data-group-id="${groupId}"]`).addClass('active');

  $.ajax({
    url: '/api/messages/group/' + groupId,
    success: function (messages) {
      $('#chat-messages').empty();
      messages.forEach((m) => renderMessage({ ...m, sender: m.sender._id || m.sender, senderName: m.sender.displayName }));
    },
    error: function (xhr) {
      $('#chat-messages').html(`<p class="muted">${(xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בטעינת הודעות הקבוצה'}</p>`);
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
        openPrivateConversation(existing.userId, existing.displayName);
      } else {
        $.get('/api/users/' + selectUserId, function (user) {
          openPrivateConversation(user._id, user.displayName);
        });
      }
    } else if (activeChat && activeChat.type === 'private') {
      // A background refresh (new message arrived) — keep the open
      // conversation highlighted instead of losing the selection.
      $(`.conversation-row[data-user-id="${activeChat.id}"]`).addClass('active');
    }
  });
}

function loadGroupChats() {
  $.get('/api/messages/groups/mine', function (groups) {
    const $list = $('#conversations-list').empty();
    if (!groups.length) {
      $list.append('<p class="muted">עדיין לא הצטרפת לאף קבוצה.</p>');
    }
    groups.forEach((g) => {
      $list.append(`
        <div class="group-chat-row" data-group-id="${g._id}" style="padding:10px; border-radius: var(--radius-s); cursor:pointer;">
          <strong>${escapeHtml(g.name)}</strong>
          <p class="muted" style="margin:2px 0 0;">${escapeHtml(g.destination)}</p>
        </div>
      `);
    });
    if (activeChat && activeChat.type === 'group') {
      $(`.group-chat-row[data-group-id="${activeChat.id}"]`).addClass('active');
    }
  });
}

function sendMessage() {
  const text = $('#chat-input').val().trim();
  if (!text || !activeChat) return;
  if (activeChat.type === 'group') {
    socket.emit('chat:send', { groupId: activeChat.id, text });
  } else {
    socket.emit('chat:send', { recipientId: activeChat.id, text });
  }
  $('#chat-input').val('');
}

function switchTab(tab) {
  activeTab = tab;
  activeChat = null;
  $('#chat-with-name').text('בחר/י שיחה');
  $('#chat-messages').empty();
  $('#chat-input, #chat-send-btn').prop('disabled', true);
  $('.chat-tab').each(function () {
    const isActive = $(this).data('tab') === tab;
    $(this).css({ 'border-bottom-color': isActive ? 'var(--primary)' : 'transparent', color: isActive ? 'var(--text)' : 'var(--text-muted)' });
  });
  if (tab === 'private') loadConversations();
  else loadGroupChats();
}

$(function () {
  const params = new URLSearchParams(window.location.search);
  switchTab('private');
  if (params.get('with')) loadConversations(params.get('with'));

  $('.chat-tab').on('click', function () {
    switchTab($(this).data('tab'));
  });

  $('#conversations-list').on('click', '.conversation-row', function () {
    openPrivateConversation($(this).data('user-id').toString(), $(this).find('strong').text());
  });

  $('#conversations-list').on('click', '.group-chat-row', function () {
    openGroupChat($(this).data('group-id').toString(), $(this).find('strong').text());
  });

  $('#chat-send-btn').on('click', sendMessage);
  $('#chat-input').on('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });

  socket.on('chat:message', function (msg) {
    if (activeChat) {
      const belongsToActiveChat =
        (activeChat.type === 'group' && msg.group === activeChat.id) ||
        (activeChat.type === 'private' && (msg.sender === activeChat.id || msg.recipient === activeChat.id));
      if (belongsToActiveChat) renderMessage(msg);
    }
    if (activeTab === 'private') loadConversations();
  });

  socket.on('chat:error', function (payload) {
    alert(payload.error);
  });

  socket.on('chat:safety-warning', function (payload) {
    $('#chat-messages').append(`<p class="muted" style="text-align:center;">⚠ ${escapeHtml(payload.message)}</p>`);
    $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
  });
});
