const html = document.documentElement;

// appliquer préférence enregistrée
if (localStorage.theme === "dark") html.classList.add("dark");

// gestion du clic
document.getElementById("theme-toggle").addEventListener("click", () => {
  html.classList.toggle("dark");
  localStorage.theme = html.classList.contains("dark") ? "dark" : "light";
});
