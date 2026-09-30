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
        window.location.href = '/';
      },
      error: function (xhr) {
        const message = (xhr.responseJSON && xhr.responseJSON.error) || 'שגיאה בפרסום הפוסט';
        $('#post-error').text(message).show();
      },
    });
  });
});
