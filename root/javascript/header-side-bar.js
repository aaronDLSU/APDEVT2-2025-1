function loadComponent(componentId, filePath, callback) {
    fetch(filePath)
      .then(response => response.text())
      .then(data => {
        $("#" + componentId).html(data);
        if (typeof callback === "function") {
          callback();
        }
      })
      .catch(error => console.error('Error loading component:', error));
  }

loadComponent('header-sidebar', 'labtech-header.html');
