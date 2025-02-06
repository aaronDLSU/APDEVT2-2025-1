// Function to load external HTML components (Header & Sidebar)
function loadComponent(componentId, filePath) {
    fetch(filePath)
      .then(response => response.text())
      .then(data => {
          document.getElementById(componentId).innerHTML = data;
          initializeProfileDropdown(); // Ensure profile dropdown is initialized
      })
      .catch(error => console.error('Error loading component:', error));
}

// Function to initialize profile dropdown functionality
function initializeProfileDropdown() {
    const profileDropdown = $("#check-profile");
    const accountSettings = $("#check-account-setting");

    document.body.addEventListener("click", (event) => {
        if (event.target.closest(".right-section")) {
            profileDropdown.toggleClass("visible");
            accountSettings.removeClass("visible");
        }

        if (event.target.closest("[data-action='account-settings']")) {
            accountSettings.toggleClass("visible");
            profileDropdown.removeClass("visible");
        }

        if (event.target.closest("[data-action='back-to-profile']")) {
            profileDropdown.toggleClass("visible");
            accountSettings.removeClass("visible");
        }

        if (!event.target.closest("#check-profile, .right-section, #check-account-setting")) {
            profileDropdown.removeClass("visible");
            accountSettings.removeClass("visible");
        }
    });
}

// Automatically load the header and sidebar when the script is included
document.addEventListener("DOMContentLoaded", () => {
    loadComponent('header-sidebar', 'labtech-header.html');
});

loadComponent('header-sidebar', 'labtech-header.html');