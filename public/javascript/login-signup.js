$(document).ready(function() {
  const slider = $("#slider"); // design div
const slider1 = $("#slider1"); // form div
const signupBox = $("#signup-box");
const loginBox = $("#login-box");

function showLogin() {
  console.log("showLogin function called");
  slider.css("transform", "translateX(-100%)"); // move design to the left
  slider1.css("transform", "translateX(100%)"); // move form to the right
  requestAnimationFrame(() => {
    slider.css("transition", "1.5s");
    slider1.css("transition", "1.5s");
  });
  signupBox.hide(); // Hide Sign-Up form
  loginBox.show();  // Show Login form
  loginBox.addClass('fadeAnimation');
  signupBox.removeClass('fadeAnimation');
  clearSignUp();
}

function showSignUp() {
  slider.css("transform", "translateX(0)"); // move design back to the right
  slider1.css("transform", "translateX(0)"); // move form back to the left
  slider.css("transition", "1.5s");
  slider1.css("transition", "1.5s");
  signupBox.show(); // Show Sign-Up form
  loginBox.hide();  // Hide Login form
  signupBox.addClass('fadeAnimation');
  loginBox.removeClass('fadeAnimation');
  clearLogin();
}

function remembered() {
  if ($("#login-checkbox").is(":checked")) {
      $("#login-checkbox").val("remembered");
      console.log("Checkbox is checked. remembered.");
  } else {
      $("#login-checkbox").val("default");
      console.log("Checkbox is unchecked. not remembered.");
  }
}

function validateSignup() {
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const confirmPassword = document.getElementById('confirm-password').value.trim();
  console.log('Validation running');
  // Clear previous errors
  
  if (!email || !password || !confirmPassword) {
    $("#signup-email").css("border-color","red");
    $("#signup-password").css("border-color","red");
    $("#confirm-password").css("border-color","red");
    $(".invalid-message").html("Invalid Email or Password Input!");
    $(".invalid-message").css("opacity", "1");
    $(".signup-warning").addClass("show");
    console.log('invalid');
    return false; // Block form submission
  }

  if (checkPasswordLength(password)) {
    $("#signup-email").css("border-color","red");
    $("#signup-password").css("border-color","red");
    $("#confirm-password").css("border-color","red");
    $(".invalid-message").html("Password Minimum Length is 8 Characters");
    $(".invalid-message").css("opacity", "1");
    $(".signup-warning").addClass("show");
    return false; // Block form submission
  }

  if(!email.includes("@")){
    $("#signup-email").css("border-color","red");
    $("#signup-password").css("border-color","red");
    $("#confirm-password").css("border-color","red");
    $(".invalid-message").html("Invalid Email Input");
    $(".invalid-message").css("opacity", "1");
    $(".signup-warning").addClass("show");
    return false;
  }

  if(email.split('@')[1] != "dlsu.edu.ph"){
    $("#signup-email").css("border-color","red");
    $("#signup-password").css("border-color","red");
    $("#confirm-password").css("border-color","red");
    $(".invalid-message").html("Only DLSU Emails Allowed");
    $(".invalid-message").css("opacity", "1");
    $(".signup-warning").addClass("show");
    return false;
  }

  if (password != confirmPassword) {
    $("#signup-email").css("border-color","red");
    $("#signup-password").css("border-color","red");
    $("#confirm-password").css("border-color","red");
    $(".invalid-message").html("Passwords do not match");
    $(".invalid-message").css("opacity", "1");
    $(".signup-warning").addClass("show");
    return false; // Block form submission
  }

  return true; // Allow form submission
}

document.querySelector('#signup-form').addEventListener('submit', async (e) => {  
  e.preventDefault();
  const formData = new FormData(e.target);
  const response = await fetch('/signup', {
      method: 'POST',
      body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
      alert(result.message || 'Signup successful!');
      window.location.href = '/signup-login';
  } else {
      alert(result.message || 'Signup failed. Please try again.');
      clearSignUp();
  }
});

document.querySelector('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const response = await fetch('/login', {
      method: 'POST',
      body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
      // Show success message and redirect
      alert(result.message || 'Login successful!');
      window.location.href = '/'; // Redirect to home page
  } else {
      // Show error message
      alert(result.message || 'Login failed. Please try again.');
  }
});

function clearSignUp(){
    $("#signup-email").css("border-color","#ccc");
    $("#signup-password").css("border-color","#ccc");
    $(".invalid-message").css("opacity", "0");
    $(".signup-warning").removeClass("show");//unshow warning icons
    $("#signup-email").val('');
    $("#signup-password").val('');
    $("#confirm-password").val('');
    $("#signup-role").prop("selectedIndex", 0); // makes dropdown choice back to student or default
}

function checkPasswordLength(password){
  return password.length < 8;
}

function validateLogin(){
  const email = $("#email-input").val();
  const password = $("#password-input").val();
  const Invalid = email === '' || password === '';

  if(Invalid){
    $("#email-input").css("border-color","red");
    $("#password-input").css("border-color","red");
    $(".invalid-message").html("Invalid email or password input!");
    $(".invalid-message").css("opacity", "1");
    $(".login-warning").addClass("show");
    console.log('invalid');
    return false;
  }else return true;
  
}

function clearLogin(){
  $("#email-input").css("border-color","#ccc");
  $("#password-input").css("border-color","#ccc");
  $(".invalid-message").css("opacity", "0");
  $(".login-warning").removeClass("show");
  $("#email-input").val('');
  $("#password-input").val('');
  $("#login-checkbox").prop("checked", false);
}


let resizeTimeout;

$(window).on("resize", function () {
  // Disable transitions during resize
  slider.css("transition", "none");
  slider1.css("transition", "none");

  // Clear the timeout if it exists
  if (resizeTimeout) clearTimeout(resizeTimeout);

  // Re-enable transitions after a short delay
  resizeTimeout = setTimeout(function () {
    slider.css("transition", "1.5s");
    slider1.css("transition", "1.5s");
  }, 100);
});


  window.showLogin = showLogin;
  window.showSignUp = showSignUp;
  window.validateLogin = validateLogin;
  window.validateSignup = validateSignup;
  window.remembered =remembered;

});

