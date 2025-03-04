$(document).ready(function () {
  var labs = {
    Velasco: ["V205", "V206", "V208A", "V208B", "V301", "V310", "V505"],
    Gokongwei: ["G211", "G302A", "G302B", "G304A", "G304B", "G306A", "G306B", "G404A", "G404B"],
    Andrew: ["A1706", "A1904"],
    Miguel: [],
    LS: ["L212", "L229", "L320", "L335"],
    Yuchengco: ["Y602"]
  }
  $("#building").change(function () {
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