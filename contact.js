document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contactForm");
  const formMessage = document.getElementById("formMessage");

  if (!contactForm || !formMessage) return;

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    formMessage.textContent = "Sending request...";
    formMessage.className = "form-message";

    const formData = new FormData(contactForm);

    try {
      const response = await fetch("https://api.staticforms.xyz/submit", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        formMessage.textContent = "Your song request has been sent!";
        formMessage.className = "form-message success";
        contactForm.reset();
      } else {
        formMessage.textContent = "There was a problem sending your request.";
        formMessage.className = "form-message error";
      }
    } catch (error) {
      formMessage.textContent = "Network error. Please try again.";
      formMessage.className = "form-message error";
    }
  });
});