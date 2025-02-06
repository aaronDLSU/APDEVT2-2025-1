// Function to load a component dynamically
function loadComponent(componentId, filePath) {
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            document.getElementById(componentId).innerHTML = data;
        })
        .catch(error => console.error('Error loading component:', error));
}

// Load the header and sidebar from the same file as homepage
document.addEventListener("DOMContentLoaded", function () {
    loadComponent('header-sidebar', 'header-sidebar.html');
});
