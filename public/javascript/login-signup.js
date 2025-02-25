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
  

  console.log('Validation running');
  // Clear previous errors
  
  if (!email || !password) {
    $("#signup-email").css("border-color","red");
    $("#signup-password").css("border-color","red");
    $(".invalid-message").html("Invalid email or password input!");
    $(".invalid-message").css("opacity", "1");
    $(".signup-warning").addClass("show");
    console.log('invalid');
    return false; // Block form submission
  }

  if (password.length < 8) {
    $("#signup-email").css("border-color","red");
    $("#signup-password").css("border-color","red");
    $(".invalid-message").html("password minimum length is 8 characters");
    $(".invalid-message").css("opacity", "1");
    $(".signup-warning").addClass("show");
    return false; // Block form submission
  }
  alert('Account Successfully Added!');
  return true; // Allow form submission
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

function checkPasswordLength(password){
  if(password.length < 8 ){
    return true;
  }else return false;
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
  }else if(checkPasswordLength(password)){  
    $("#email-input").css("border-color","red");
    $("#password-input").css("border-color","red");
    $(".invalid-message").html("password minimum length is 8 characters");
    $(".invalid-message").css("opacity", "1");
    $(".login-warning").addClass("show");
    return false;
  }else{
    for(let i=0; i<user.length;i++){
      if(user[i].email === email && user[i].password === password){
        user[i].rememberPeriod =3;
        console.log(`User: ${user[i].email}, Password: ${user[i].password}, Role: ${user[i].role}, Remember Period: ${user[i].rememberPeriod}`);
        console.log('login successful');
        
      }
    }
    return true;
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


  window.showLogin = showLogin;
  window.showSignUp = showSignUp;
  window.validateLogin = validateLogin;
  window.validateSignup = validateSignup;
  window.remembered =remembered;

});

