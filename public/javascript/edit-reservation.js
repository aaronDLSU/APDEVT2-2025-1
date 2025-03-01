//for button availability
$(document).ready(function () {
const details = document.getElementById('details');
const submit = document.getElementById('view-avail');

function checkForm(){
  const required = details.querySelectorAll('[required]');
  let isFilled = true;
  required.forEach((field) => {
    if (!field.value || field.value === "Choose...") {
      isFilled = false;
    }
  });

  submit.disabled = !isFilled;
}

  details.addEventListener('input', checkForm);
  details.addEventListener('change', checkForm);

  checkForm();
  //for lab tech/student view
const accountType = "labtech"; //set to lab tech for now
  const studentView = document.getElementById('student-view');
  const labtechView = document.getElementById('labtech-view');

  if(accountType === "labtech"){
    labtechView.classList.remove('hidden');
  }
  else if(accountType === "student"){
    studentView.classList.remove('hidden');
  }
  else {
    console.log("account not found");
  }

});