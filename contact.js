const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

contactForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const theme = document.getElementById("theme").value.trim();
  const about = document.getElementById("about").value.trim();

  if (!name || !email || !subject || !theme || !about) {
    showMessage("Please fill out all required fields.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  showMessage("Your song request has been sent.", "success");
  contactForm.reset();

  setTimeout(() => {
    formMessage.className = "form-message";
    formMessage.textContent = "";
  }, 4000);
});

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = "form-message " + type;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}