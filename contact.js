const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

if (contactForm && formMessage) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const subject = document.getElementById("subject")?.value.trim() || "";
    const theme = document.getElementById("theme")?.value.trim() || "";
    const about = document.getElementById("about")?.value.trim() || "";

    if (!name || !email || !subject || !theme || !about) {
      showMessage("Please fill out all required fields.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }

    showMessage("Your song request has been prepared. Add your delivery method when you're ready.", "success");
    contactForm.reset();

    setTimeout(() => {
      formMessage.className = "form-message";
      formMessage.textContent = "";
    }, 4000);
  });
}

function showMessage(text, type) {
  if (!formMessage) return;
  formMessage.textContent = text;
  formMessage.className = "form-message " + type;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
