const slider = $("#slider"); // design div
const slider1 = $("#slider1"); // form div
const signupBox = $("#signup-box");
const loginBox = $("#login-box");

function showLogin() {
  slider.css("transform", "translateX(-100%)"); // move design to the left
  slider1.css("transform", "translateX(100%)"); // move form to the right
  slider.css("transition", "1.5s");
  slider1.css("transition", "1.5s");
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

function checkInvalidSignup(){
  const email = $("#signup-email").val();
  const password = $("#signup-password").val();
  const Invalid = email === '' || password === '';

  if(Invalid){
    $("#signup-email").css("border-color","red");
    $("#signup-password").css("border-color","red");
    $(".invalid-message").css("opacity", "1");
    $(".signup-warning").addClass("show");
    console.log('invalid');
  }else{
    clearSignUp();
  }
}

function clearSignUp(){
    $("#signup-email").css("border-color","#ccc");
    $("#signup-password").css("border-color","#ccc");
    $(".invalid-message").css("opacity", "0");
    $(".signup-warning").removeClass("show");//unshow warning icons
    $("#signup-email").val('');
    $("#signup-password").val('');
    $("#signup-role").prop("selectedIndex", 0); // makes dropdown choice back to student or default
}

function checkInvalidLogin(){
  const email = $("#email-input").val();
  const password = $("#password-input").val();
  const Invalid = email === '' || password === '';

  if(Invalid){
    $("#email-input").css("border-color","red");
    $("#password-input").css("border-color","red");
    $(".invalid-message").css("opacity", "1");
    $(".login-warning").addClass("show");
    console.log('invalid');
  }else{
    clearLogin();
  }
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
