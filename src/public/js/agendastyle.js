document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const main = document.querySelector(".main-content");
  const toggleBtn = document.getElementById("sidebarToggle");
  const icon = toggleBtn.querySelector("i");
  const container = document.querySelector(".dashboard-container");

  // Eviter le bug d'affichage initial
  container.classList.remove("collapsed-init");

  // Appliquer l'état enregistré de la sidebar
  const collapsed = localStorage.getItem("sidebarCollapsed") === "true";
  if (collapsed) {
    sidebar.classList.add("collapsed");
    main.classList.add("expanded");
    icon.classList.remove("fa-bars");
    icon.classList.add("fa-arrow-right");
  } else {
    sidebar.classList.remove("collapsed");
    main.classList.remove("expanded");
    icon.classList.remove("fa-arrow-right");
    icon.classList.add("fa-bars");
  }

  // Gestion du clic sur le bouton toggle
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    main.classList.toggle("expanded");

    const isCollapsed = sidebar.classList.contains("collapsed");

    // Changer l'icône
    if (isCollapsed) {
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-arrow-right");
      localStorage.setItem("sidebarCollapsed", "true");
    } else {
      icon.classList.remove("fa-arrow-right");
      icon.classList.add("fa-bars");
      localStorage.setItem("sidebarCollapsed", "false");
    }

    // Mettre à jour FullCalendar si existant
    if (window.calendar && typeof window.calendar.updateSize === "function") {
      setTimeout(() => window.calendar.updateSize(), 310); // correspond à la transition CSS
    }
  });
});
