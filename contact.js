const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = contactForm?.querySelector('button[type="submit"]') || null;

if (contactForm && formMessage) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const requestTitle = document.getElementById("subject")?.value.trim() || "";
    const theme = document.getElementById("theme")?.value.trim() || "";
    const scripture = document.getElementById("scripture")?.value.trim() || "";
    const artistStyle = document.getElementById("artistStyle")?.value.trim() || "";
    const about = document.getElementById("about")?.value.trim() || "";
    const extraMessage = document.getElementById("message")?.value.trim() || "";
    const accessKey = contactForm.querySelector('input[name="accessKey"]')?.value || "";
    const replyToField = contactForm.querySelector('input[name="replyTo"]');

    if (!name || !email || !requestTitle || !theme || !about) {
      showMessage("Please fill out all required fields.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }

    if (!accessKey) {
      showMessage("Form configuration is missing. Please update the StaticForms access key.", "error");
      return;
    }

    if (replyToField) {
      replyToField.value = email;
    }

    setSubmittingState(true);
    showMessage("Sending your song request...", "sending");

    const messageBody = [
      `Request title: ${requestTitle}`,
      `Theme: ${theme}`,
      `Scripture reference: ${scripture || "None provided"}`,
      `Artist / style inspiration: ${artistStyle || "None provided"}`,
      "",
      "About the song:",
      about,
      "",
      "Anything else:",
      extraMessage || "None provided"
    ].join("
");

    const payload = new FormData();
    payload.append("accessKey", accessKey);
    payload.append("name", name);
    payload.append("email", email);
    payload.append("replyTo", email);
    payload.append("subject", `New Song Request: ${requestTitle}`);
    payload.append("message", messageBody);
    payload.append("botcheck", "");

    try {
      const response = await fetch("https://api.staticforms.xyz/submit", {
        method: "POST",
        body: payload,
        headers: {
          Accept: "application/json"
        }
      });

      const result = await response.json().catch(() => null);

      if (response.ok && (!result || result.success !== false)) {
        showMessage("Your song request has been sent successfully.", "success");
        contactForm.reset();
      } else {
        const errorText = result?.message || "There was a problem sending your request. Please try again.";
        showMessage(errorText, "error");
      }
    } catch (error) {
      showMessage("Network error. Please try again.", "error");
    } finally {
      setSubmittingState(false);
    }
  });
}

function setSubmittingState(isSubmitting) {
  if (!submitBtn) return;
  submitBtn.disabled = isSubmitting;
  submitBtn.textContent = isSubmitting ? "Sending..." : "Send Request";
}

function showMessage(text, type) {
  if (!formMessage) return;
  formMessage.textContent = text;
  formMessage.className = "form-message " + type;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
