const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

contactForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const contactType = document.getElementById("contactType").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !subject || !contactType || !message) {
    showMessage("Please fill out all required fields.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  showMessage("Your message has been sent successfully.", "success");
  contactForm.reset();
});

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = "form-message " + type;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = "form-message " + type;

  setTimeout(() => {
    formMessage.className = "form-message";
    formMessage.textContent = "";
  }, 4000);
}