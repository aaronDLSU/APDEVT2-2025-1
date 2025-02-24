$(document).ready(function () {
  // Close dropdowns when clicking outside
  $(document).on("click", function () {
    console.log('Closing dropdowns');
    $("#extended-sidebar").removeClass("visible");
    $(".overlay").removeClass("visible");
  });

  // Prevent dropdowns from closing when clicking inside them
  $("#check-profile, #check-account-setting").on("click", function (e) {
    e.stopPropagation();
  });

 // Toggle sidebar on hamburger icon click
 $("#hamburger-icon").on("click", function (e) {
    e.stopPropagation(); // Prevent event from bubbling up
    console.log('Toggling hamburger icon');
    $("#extended-sidebar").toggleClass("visible");
    $(".overlay").toggleClass("visible");
  });


});