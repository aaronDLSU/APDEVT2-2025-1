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

    function loadAnonymous(){
      let isAnonymous = $("#view-avail").attr("data-anonymous") === "true"
      if(isAnonymous){
        $("#anonymous-checkbox").prop('checked', true);
      }
      else{
        $("#anonymous-checkbox").prop('checked', false);
      }
    }

    edit.on('input change', checkEditForm);
    checkEditForm();
    loadAnonymous();

    $.ajax({
      url: "/check-availability",
      type: "POST",
      data: {building: building, lab: lab, date: date},
      success: function (response) {
        if (response.success) {
          let isAvailable = response.available

          //only let user edit if lab is available
          if (isAvailable) {
            let startTimeDropdown = $("#startTime")
            let endTimeDropdown = $("#endTime")
            let seatDropdown = $("#seat")

            if (!seatDropdown || !startTimeDropdown || !endTimeDropdown) return;

            // Save the currently selected values
            const previousSeat = seatDropdown.val();
            const previousStartTime = startTimeDropdown.val();
            const previousEndTime = endTimeDropdown.val();

            // Clear previous options
            seatDropdown.empty();
            seatDropdown.append(new Option("Select a seat", "")); // Default option

            let seatCapacity = response.capacity;
            // Populate seat dropdown with available seats
            for (let i = 1; i <= seatCapacity; i++) {
              let option = document.createElement("option");
              option.value = i;
              option.textContent = `Seat ${i}`;
              seatDropdown.append(option);
            }

            // Restore previous seat selection if still valid
            if (seatDropdown.find(`option[value="${previousSeat}"]`)) {
              seatDropdown.value = previousSeat;
            }

            // Generate time slots (7:00 AM - 6:00 PM)
            const startHour = 7;
            const endHour = 18;
            const timeSlots = [];

            for (let hour = startHour; hour < endHour; hour++) {
              timeSlots.push(`${hour}:00`, `${hour}:30`);
            }

            // Populate start time dropdown
            timeSlots.forEach(time => {
              let option = document.createElement("option");
              option.value = time;
              option.textContent = time;
              startTimeDropdown.append(option);
            });

            // Restore previous start time selection if still valid
            if (startTimeDropdown.find(`option[value="${previousStartTime}"]`)) {
              startTimeDropdown.value = previousStartTime;
            }

            function updateEndTimeOptions() {
              let selectedIndex = startTimeDropdown.prop("selectedIndex");
              endTimeDropdown.empty().append(new Option("Select end time", ""));

              for (let i = selectedIndex; i < timeSlots.length; i++) {
                endTimeDropdown.append(new Option(timeSlots[i], timeSlots[i]));
              }
              if (endTimeDropdown.find(`option[value="${previousEndTime}"]`).length) {
                endTimeDropdown.val(previousEndTime);
              }
            }

            // Update end time dropdown when start time changes
            startTimeDropdown.on("change", updateEndTimeOptions);

            // Initialize end time options
            updateEndTimeOptions();

            $("#edit-modal").modal("show");
          }
          else { //otherwise show failed message
            $("#failed-modal").modal("show")
          }
        } else {
          console.log("Failed")
        }
      },
      error: function (xhr, status, error) {
        console.log(xhr.responseText);
      }
    })
  });

  $("#confirm-reserve").off('click').on("click", function () {
    event.preventDefault();
    let seat = $("#seat").val()
    let startTime = $("#startTime").val()
    let endTime = $("#endTime").val()
    let lab = $("#lab").val();
    let building = $("#building").val()
    let date = $("#date").val()
    let anonymous = $("#anonymous-checkbox").is(":checked")
    console.log(anonymous)

    const reserveId = $(this).data('id');

    $.ajax({
      url: "/update-reservation",
      type: "POST",
      data: {
        id: reserveId,
        seat: seat,
        startTime: startTime,
        endTime: endTime,
        lab: lab,
        building: building,
        date: date,
        isAnonymous: anonymous
      },
      success: function (response) {
        if (response.success) {
          $("#edit-modal").modal("hide");
          $("#edit-success").modal("show")
          $("#success-ok").off("click").on("click", function () {
            $("#edit-success").modal("hide")
            if(response.labtech)
              window.location.href = "/reservation-list"
            else if (response.student)
              window.location.href = "/profile"
          });
        }
        else {
          console.log(response.cannotEdit)
          if (response.cannotEdit) {
            console.log("click")
            $("#edit-modal").modal("hide");
            $("#cant-edit").modal("show");

            $("#cant-edit-ok").off("click").on("click", function () {
              $("#cant-edit").modal("hide");
              if(response.labtech)
                window.location.href = "/reservation-list"
              else if (response.student)
                window.location.href = "/profile"
            });
          }
          else if(response.overlap){
            $("#edit-modal").modal("hide");
            $("#overlap").modal("show");

            $("#overlap-ok").off("click").on("click", function () {
              $("#overlap").modal("hide");
              $("#edit-modal").modal("show");
            });
          }
        }
      }
    })
  })
});