$(document).ready(function () {
  const details = $('#details');
  const submit = $('#view-avail');

  function checkForm(){
    let isFilled = true;
    details.find('[required]').each(function () {
      if (!$(this).val() || $(this).val() === "") {
        isFilled = false;
        return false;
      }
    });

    submit.prop('disabled', !isFilled);
  }

  details.on('input change', checkForm);
  checkForm();
});