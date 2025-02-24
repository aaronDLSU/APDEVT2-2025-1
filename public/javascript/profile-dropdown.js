
      $(document).ready(function () {
    // Toggle profile dropdown
    $(".right-section").on("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Toggling profile dropdown');
      $("#check-profile").toggleClass("visible");
      $("#check-account-setting").removeClass("visible");
    });
  
    // Toggle account settings dropdown
    $(".js-account-settings").on("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Toggling account settings dropdown');
      $("#check-profile").removeClass("visible");
      $("#check-account-setting").toggleClass("visible");
    });
  
    // Handle "Back" button in account settings
    $("[data-action='back-to-profile']").on("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Back to profile');
      $("#check-account-setting").removeClass("visible");
      $("#check-profile").toggleClass("visible");
    });
  
    // Close dropdowns when clicking outside
    $(document).on("click", function () {
    console.log('Closing dropdowns');
    $("#check-profile").removeClass("visible");
    $("#check-account-setting").removeClass("visible");
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
