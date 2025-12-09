document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const icon = document.getElementById("theme-icon");

  // Appliquer préférence enregistrée
  if (localStorage.theme === "dark") {
    html.classList.add("dark");
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  }

  // Gestion du clic
  toggleBtn.addEventListener("click", () => {
    html.classList.toggle("dark");

    if (html.classList.contains("dark")) {
      localStorage.theme = "dark";
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    } else {
      localStorage.theme = "light";
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }
  });
});

