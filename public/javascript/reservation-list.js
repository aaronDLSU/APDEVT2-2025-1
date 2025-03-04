const confirmDeleteSubmit = $('#submit-delete');

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
$(document).ready(function () {
  /*add more labs if needed. these are all computer labs*/
  var labs = {
    Velasco: ["V205", "V206", "V208A", "V208B", "V301", "V310", "V505"],
    Gokongwei: ["G211", "G302A", "G302B", "G304A", "G304B", "G306A", "G306B", "G404A", "G404B"],
    Andrew: ["A1706", "A1904"],
    Miguel: [],
    LS: ["L212", "L229", "L320", "L335"],
    Yuchengco: ["Y602"]
  }

  const urlParams = new URLSearchParams(window.location.search);
  $("#building").val(urlParams.get("building") || "").change(function () {
    //to dynamically change the dropdown
    let building = $(this).val();
    let $itemsDropdown = $("#lab");

    if (building && labs[building]) {
      $itemsDropdown.empty();
      $.each(labs[building], function (index, item) {
        $itemsDropdown.append($('<option>', { value: item, text: item }));
      });
      $itemsDropdown.prop("disabled", false);
    } else {
      //disable if no building selected
      $itemsDropdown.prop("disabled", true);
    }
  });

  $("#lab").val(urlParams.get("lab") || "");
  $("#date").val(urlParams.get("date") || "");

  $("#details").on("submit", function (event) {
    event.preventDefault();

    const building = $("#building").val();
    const lab = $("#lab").val();
    const date = $("#date").val();
    window.location.href = `?building=${building}&lab=${lab}&date=${date}`;
  });
});