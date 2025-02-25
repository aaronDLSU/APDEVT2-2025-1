
      $(document).ready(function () {

        function toggleBodyScroll(enable) {
          if (enable) {
            // Save current scroll position and disable scrolling
            const scrollY = window.scrollY;
            document.body.style.top = `-${scrollY}px`;
            document.body.classList.add('body-no-scroll');
            document.body.dataset.scrollY = scrollY; // Store scroll position
          } else {
            // Re-enable scrolling and restore position
            const scrollY = parseInt(document.body.dataset.scrollY || '0');
            document.body.classList.remove('body-no-scroll');
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
            document.body.removeAttribute('data-scroll-y');
          }
        }

        
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

     // Toggle sidebar on hamburger icon click
    $("#hamburger-icon").on("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Toggling hamburger icon');
      $("#extended-sidebar").toggleClass("visible");
      $(".overlay").toggleClass("visible");
      toggleBodyScroll(true);
    });
  
    // Close dropdowns when clicking outside
    $(document).on("click", function () {
    console.log('Closing dropdowns');
    $("#check-profile").removeClass("visible");
    $("#check-account-setting").removeClass("visible");
    $("#extended-sidebar").removeClass("visible");
    $(".overlay").removeClass("visible");
    $("#extended-sidebar").removeClass("visible");
    $(".overlay").removeClass("visible");
    toggleBodyScroll(false);
  });

  // Prevent dropdowns from closing when clicking inside them
  $("#check-profile, #check-account-setting", "#hamburger-icon").on("click", function (e) {
    e.stopPropagation();
  });

  });
