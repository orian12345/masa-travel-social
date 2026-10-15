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

let selectedImageBase64 = null;
const MAX_SOURCE_FILE_BYTES = 20_000_000; // sanity cap on the original file, before compression
const MAX_DIMENSION = 1280; // longer side, in px, after resizing
const JPEG_QUALITY = 0.8;

// Phone camera photos are routinely several MB — far too big to store as a
// base64 field on a MongoDB document, and too big for the request body
// limit. Rather than reject every real photo, downscale it and re-encode as
// a JPEG through a canvas, which comfortably fits almost any source image.
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('לא ניתן לקרוא את הקובץ'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('הקובץ שנבחר אינו תמונה תקינה'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

$(function () {
  $('select[name=type]').on('change', function () {
    $('#screening-section').toggle($(this).val() === 'partner');
  }).trigger('change');

  $('#add-question-btn').on('click', addQuestionRow);

  $('#image-input').on('change', function () {
    const file = this.files[0];
    const $input = $(this);
    if (!file) {
      selectedImageBase64 = null;
      $('#image-preview').hide();
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      alert('הקובץ גדול מדי (מעל 20MB). נסה/י תמונה אחרת.');
      $input.val('');
      selectedImageBase64 = null;
      $('#image-preview').hide();
      return;
    }

    $('#image-preview').hide();
    compressImage(file)
      .then((dataUrl) => {
        selectedImageBase64 = dataUrl;
        $('#image-preview').attr('src', dataUrl).show();
      })
      .catch((err) => {
        alert(err.message || 'שגיאה בעיבוד התמונה');
        $input.val('');
        selectedImageBase64 = null;
      });
  });

  $('#new-post-form').on('submit', function (e) {
    e.preventDefault();
    const $form = $(this);
    const data = {};
    $form.serializeArray().forEach((f) => { data[f.name] = f.value; });
    if (selectedImageBase64) data.imageBase64 = selectedImageBase64;

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
