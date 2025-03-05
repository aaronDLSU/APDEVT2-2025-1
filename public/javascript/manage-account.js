$(document).ready(function () {
  $('#v-pills-tab a').on('click', function (e) {
    e.preventDefault();
    //switches tabs by deactivating & activating tabs
    $('#v-pills-tab .nav-link').removeClass('active');
    $(this).addClass('active');
    new bootstrap.Tab(this).show();

    //to reset the forms when switching tabs
    $('#v-pills-tabContent form').each(function () {
      this.reset();
      $(this).removeClass('was-validated');
    });
    $('#v-pills-tabContent form .form-control').removeClass('is-invalid is-valid');
  });

  const pass_form = $('#pass-info');
  const newPass = $('#new-password');
  const confirmPass = $('#confirm-password');
  const submitBtn = $('#submit-pass');
  const confirmModalSubmit = $('#confirm-btn');

  const deleteForm = $('#delete-acc-details');
  const submit = $('#submit-delete');
  const checkbox = $('#delete-acc-check');

  //button availability for Delete Account
  function checkForm() {
    let isFilled = true;
    deleteForm.find('[required]').each(function () {
      if ($(this).val().trim() === "") {
        isFilled = false;
      }
    });

    submit.prop('disabled', !(isFilled && checkbox.prop('checked')));
  }
  checkForm();

  deleteForm.on('input change', checkForm);

  //validate password input
  function validatePasswords() {
    //new password must be at least 8 chars
    if (newPass.val().length >= 8) {
      newPass.removeClass("is-invalid").addClass("is-valid");
    } else {
      newPass.removeClass("is-valid").addClass("is-invalid");
    }

    //new pass and confirm pass must be the same
    if (confirmPass.val() === newPass.val() && confirmPass.val().length >= 6) {
      confirmPass.removeClass("is-invalid").addClass("is-valid");
      submitBtn.prop("disabled", false);
    } else {
      confirmPass.removeClass("is-valid").addClass("is-invalid");
      submitBtn.prop("disabled", true);
    }
  }

  newPass.on("input", validatePasswords);
  confirmPass.on("input", validatePasswords);

  //change password modal from confirmation to success
  confirmModalSubmit.on("click", function () {
    var confirmModal = bootstrap.Modal.getInstance($('#confirm-change')[0]);
    confirmModal.hide();

    setTimeout(() => {
      var successModal = new bootstrap.Modal($('#change-success')[0]);
      successModal.show();

      pass_form[0].reset();

      newPass.removeClass("is-valid is-invalid");
      confirmPass.removeClass("is-valid is-invalid");
      submitBtn.prop("disabled", true);
    }, 500);
  });

  //this is to show "password changed successfully" modal
  pass_form.on("submit", function (event) {
    event.preventDefault();
    return false;
  });

  const deleteYes = $('#delete-yes');

  //to not refresh page when submitting "yes" in account deletion
  deleteForm.on("submit", function (event) {
    event.preventDefault();
    return false;
  });

  //redirects to home page upon deleting account
  deleteYes.on("click", function () {
    alert("Account deleted successfully.");
    window.location.href = "signup-homepage.html";
  });

  //enable/disable checkboxes in privacy settings based on "show reservations" option
  $("#show-reserves").on("change", function () {
    const checkboxes = $(".reserve-checkbox");

    checkboxes.each(function () {
      if (!$('#show-reserves').prop("checked")) {
        $(this).prop("checked", false);
      }
      $(this).prop("disabled", !$('#show-reserves').prop("checked"));
    });
  });

});
