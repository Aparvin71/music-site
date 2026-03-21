document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contactForm");
  const formMessage = document.getElementById("formMessage");
  const toastRegion = document.getElementById("toastRegion");

  function showToast(message, type = "info") {
    if (!toastRegion || !message) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon" aria-hidden="true">${type === "success" ? "✓" : type === "error" ? "⚠" : "•"}</div>
      <div class="toast-body">${message}</div>
      <button class="toast-close" type="button" aria-label="Dismiss notification">✕</button>
      <div class="toast-progress"></div>
    `;

    const dismiss = () => {
      toast.classList.add("leaving");
      setTimeout(() => toast.remove(), 220);
    };

    toast.querySelector(".toast-close")?.addEventListener("click", dismiss);
    toastRegion.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(dismiss, 2800);
  }

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
        showToast("Your song request has been sent!", "success");
        contactForm.reset();
      } else {
        formMessage.textContent = "There was a problem sending your request.";
        formMessage.className = "form-message error";
        showToast("There was a problem sending your request.", "error");
      }
    } catch (error) {
      formMessage.textContent = "Network error. Please try again.";
      formMessage.className = "form-message error";
      showToast("Network error. Please try again.", "error");
    }
  });
});
