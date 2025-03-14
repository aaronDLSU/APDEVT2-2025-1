$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);

  $("#lab").val(urlParams.get("lab") || "");
  $("#date").val(urlParams.get("date") || "");

  $("#details").on("submit", function (event) {
    event.preventDefault();

    const building = $("#building").val();
    const lab = $("#lab").val();
    const date = $("#date").val();
    window.location.href = `?building=${building}&lab=${lab}&date=${date}`;
  }).trigger("reset");

  const confirmDelete = $('.submit-delete')
  confirmDelete.on("click", function () {
    const reserveId = $(this).data('id');
    const confirmModal = new bootstrap.Modal($('#confirm-delete'));
    console.log("click")

    confirmModal.show();

    // When "Yes" is clicked
    $('#confirm-btn').off('click').on("click", function () {
      $.ajax({
        url: "/delete-reservation",
        type: "POST",
        data: {id: reserveId},
        success: function (response) {
          confirmModal.hide();
          if (response.success) {
            setTimeout(() => {
              const successModal = new bootstrap.Modal($('#delete-success'));
              successModal.show();

              $('#delete-success .btn-success').off('click').on("click", function () {
                location.reload();
              });
            }, 500);
          } else {
            const failModal = new bootstrap.Modal($('#delete-fail'));
            failModal.show();
          }
        },
        error: function (xhr, status, error) {
          console.log(xhr.responseText);
        }
      })
    });
  });

});