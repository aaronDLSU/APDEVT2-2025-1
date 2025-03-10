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

      // Toggle sidebar on hamburger icon click
    $(".hamburger-icon").on("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Toggling hamburger icon');
      $("#extended-sidebar").toggleClass("visible");
      $(".overlay").toggleClass("visible");
      toggleBodyScroll(true);
    });
        
    // Toggle profile dropdown
    $(".right-section").on("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Toggling profile dropdown');
      $("#check-profile").toggleClass("visible");
      $("#check-account-setting").removeClass("visible");
      toggleBodyScroll(true);
    });
  
    // Toggle account settings dropdown
    $(".js-account-settings").on("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Toggling account settings dropdown');
      $("#check-profile").removeClass("visible");
      $("#check-account-setting").toggleClass("visible");
      toggleBodyScroll(true);
    });
  
    // Handle "Back" button in account settings
    $("[data-action='back-to-profile']").on("click", function (e) {
      e.stopPropagation(); // Prevent event from bubbling up
      console.log('Back to profile');
      $("#check-account-setting").removeClass("visible");
      $("#check-profile").toggleClass("visible");
      toggleBodyScroll(true);
    });
  
    $(document).on("click", function (e) {
      if (!$(e.target).closest('.right-section').length && 
          !$(e.target).closest('#check-profile').length &&
          !$(e.target).closest('#check-account-setting').length) {
        $("#check-profile, #check-account-setting").removeClass("visible");
        toggleBodyScroll(false);
      }
    });

    // Close dropdowns when clicking outside
    $(document).on("click", function (e) {
      if (!$(e.target).closest('#extended-sidebar').length) {
        $("#extended-sidebar, .overlay").removeClass("visible");
      }
      toggleBodyScroll(false);
    });
  
  // Prevent dropdowns from closing when clicking inside them
  $("#check-profile, #check-account-setting", "#hamburger-icon").on("click", function (e) {
    e.stopPropagation();
  });

  const similarResultTemplate = document.getElementById("similar-result-template");
  const similarResultContainer = document.getElementById("similar-result-container");
  const searchUser = document.querySelector("[user-search]");
  const noSimilarResult = document.getElementById("no-similar-result");
  
  let users = [];

  searchUser.addEventListener("input", e => {
    const value = e.target.value.toLowerCase();
    const hasValue = value.length > 0;
    similarResultContainer.classList.toggle("show", hasValue);

    let visibleUsers = 0;

    users.forEach(user => {
      const isVisible = user.name.toLowerCase().includes(value) || 
                       user.email.toLowerCase().includes(value);
      console.log(`User: ${user.name}, Match: ${isVisible}`);
      user.element.classList.toggle("hide", !isVisible);

      if (isVisible) {
        visibleUsers++;
      }
    });
    if (visibleUsers === 0 && hasValue) {
      noSimilarResult.classList.add("show");
    } else {
      noSimilarResult.classList.remove("show");
    }
  });

  fetch("/api/users")
    .then(res => res.json())
    .then (data => {
      users = data.data.map(user => {
        const templateContent = similarResultTemplate.content;
        const card = document.importNode(templateContent, true).firstElementChild;

        const profilePic = card.querySelector("[data-prof-pic]");
        const name = card.querySelector("[data-prof-name]");
        const email = card.querySelector("[data-prof-email]");

        const img = document.createElement("img");
        img.src = `${user.profilePic}`; 
        img.alt = "Profile picture";
        img.classList.add("profile-image");
        img.onerror = () => {  // Handle broken images
        img.src = '/images/default_profile.jpg';
      };

      card.addEventListener("click", () => {
        // Navigate to the user's profile page using their user ID
        window.location.href = `/profile/${user._id}`; // Assuming the profile URL is structured like this
      });

        profilePic.appendChild(img);

        name.textContent = user.name;
        email.textContent = user.email;
        similarResultContainer.appendChild(card);
        return {name: user.name , email: user.email, profilePic: profilePic, element: card}
      });
    });
  });
