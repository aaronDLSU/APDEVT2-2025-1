$(document).ready(function () {
  const details = $('#details');
  const submit = $('#view-avail');
  let seatDropdown = $("#seat")
  let startTimeDropdown = $("#startTime")

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

  submit.off('click').on("click", function () {
    let building = $("#building").val();
    let lab = $("#lab").val();
    let date = $("#date").val();

    if (!building || !lab || !date) {
      alert("Please select a building, lab, and date.");
      return;
    }

    let edit = $("#more-details")
    let save = $("#confirm-reserve")

    function checkEditForm(){
      let isFilled = true;
      edit.find('[required]').each(function () {
        if (!$(this).val() || $(this).val() === "") {
          isFilled = false;
          return false;
        }
      });

      save.prop('disabled', !isFilled);
    }

    edit.on('input change', checkEditForm);
    checkEditForm();

    $.ajax({
      url: "/check-availability",
      type: "POST",
      data: {building: building, lab: lab, date: date},
      success: function (response) {
        if (response.success) {
          let seatCapacity = response.capacity;
          let reservedSeats = response.reservedSeats;

          // Clear previous options
          seatDropdown.empty();
          seatDropdown.append(new Option("Select a seat", "")); // Default option

          // Populate seat dropdown with available seats
          for (let i = 1; i <= seatCapacity; i++) {
              let option = document.createElement("option");
              option.value = i;
              option.textContent = `Seat ${i}`;
              seatDropdown.append(option);
          }

          // Generate time slots (7:00 AM - 6:00 PM)
          const startHour = 7;
          const endHour = 18;
          const timeSlots = [];

          for (let hour = startHour; hour < endHour; hour++) {
            timeSlots.push(`${hour}:00`, `${hour}:30`);
          }

          timeSlots.forEach(time => {
            let option = document.createElement("option");
            option.value = time;
            option.textContent = time;
            startTimeDropdown.append(option);
          });

          $("#edit-modal").modal("show");
        } else {
          console.log("A")
        }
      },
      error: function (xhr, status, error) {
        console.log(xhr.responseText);
      }
    })
  });

  async function populateDropdown(){}
});