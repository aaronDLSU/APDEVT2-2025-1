$(document).ready(function() {
  const confirmDeleteSubmit = $('.submit-delete');
      confirmDeleteSubmit.on("click", function () {
        var confirmModal = new bootstrap.Modal(document.getElementById('confirm-delete'));
        confirmModal.show();

        // When "Yes" is clicked
        $('#confirm-btn').off('click').on("click", function () {
          confirmModal.hide(); // Hide the confirmation modal

          setTimeout(() => {
            var successModal = new bootstrap.Modal(document.getElementById('delete-success'));
            successModal.show();

            $('#delete-success .btn-success').off('click').on("click", function () {
              location.reload();
            });
          }, 500);
        });
      });
});