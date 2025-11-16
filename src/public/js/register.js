const signupForm = document.querySelector("#signupForm");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const firstName = document.querySelector("#firstname").value.trim();
  const lastName = document.querySelector("#lastname").value.trim();
  const email = document.querySelector("#email").value.trim();
  const password = document.querySelector("#password").value;
  const confirmPassword = document.querySelector("#confirmPassword").value;
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const res = await fetch("http://localhost:3000/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email: normalizedEmail,
        password,
        confirmPassword,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      showMessage(" compte cree avec succée ", "succes");

      window.location.href = "login";
    } else {
      showMessage(data.error || "Erreur de l'inscription ", "error");
    }
  } catch (error) {
    showMessage("Erreur serveur, réessaye plus tard.", "error");
  }
});
