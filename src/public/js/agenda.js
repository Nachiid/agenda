// === Initialisation de la page d'accueil avec les données de l'utilisateur ===
//
//
//

document.addEventListener("DOMContentLoaded", async function () {
  // === Initialisation du calendrier ===
  const calendarEl = document.getElementById("calendar");
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "fr",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },
    navLinks: true,
    selectable: true,
    editable: true,
    events: [],
  });
  calendar.render();

  // --- Charger les calendriers de l'utilisateur ---
  try {
    const res = await fetch("/user/agenda", { credentials: "include" });
    if (!res.ok) throw new Error("Erreur récupération calendrier");
    const data = await res.json();
    const calendarData = data.calendar;

    // --- Affiche le titre du calendrier ---
    if (calendarData) {
      const titleDiv = document.querySelector(".calendar-title");
      if (titleDiv) {
        titleDiv.textContent = calendarData.title;
        titleDiv.dataset.calendarId = calendarData._id;
      }

      // --- Affiche les événements du calendrier ---
      const events = calendarData.appointments.map((r) => ({
        id: r._id,
        title: r.name,
        start: r.date_debut,
        end: r.date_fin,
        color: calendarData.color,
        extendedProps: { description: r.description || "" },
      }));

      events.forEach((ev) => calendar.addEvent(ev));
    }

    // --- Récupération de tous les calendriers ---
    const allRes = await fetch("/user/calendars", { credentials: "include" });
    if (!allRes.ok) throw new Error("Erreur récupération des calendriers");
    const allData = await allRes.json();

    // === La liste des calendriers ===
    const calendarListDiv = document.querySelector(".calendars-list");
    if (calendarListDiv) {
      const MAX_VISIBLE = 4; // Nombre de calendriers visibles
      const hiddenDiv = document.createElement("div");
      hiddenDiv.classList.add("hidden-calendars");
      hiddenDiv.style.display = "none"; // Caché par défaut

      allData.calendars.forEach((cal, index) => {
        const calDiv = document.createElement("div");
        calDiv.classList.add("event-item");
        calDiv.dataset.id = cal._id;

        // Partie gauche : checkbox + couleur + titre
        const leftDiv = document.createElement("div");
        leftDiv.classList.add("event-left");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = cal._id === calendarData._id;
        checkbox.value = cal._id;

        const colorDiv = document.createElement("div");
        colorDiv.classList.add("calendar-color");
        colorDiv.style.background = cal.color;

        const titleDiv = document.createElement("div");
        titleDiv.classList.add("event-info");
        const titleSpan = document.createElement("div");
        titleSpan.classList.add("event-title");
        titleSpan.textContent = cal.title;
        titleSpan.dataset.calendarId = cal._id;
        const timeSpan = document.createElement("div");
        timeSpan.classList.add("event-time");

        titleDiv.appendChild(titleSpan);
        titleDiv.appendChild(timeSpan);
        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(colorDiv);
        leftDiv.appendChild(titleDiv);

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("btn-icon", "delete-btn");
        deleteBtn.dataset.id = cal._id;
        deleteBtn.title = "Supprimer";
        deleteBtn.innerHTML = `
            <i class="fas fa-trash-alt"></i>

        `;

        calDiv.appendChild(leftDiv);
        calDiv.appendChild(deleteBtn);

        // Ajouter dans la liste visible ou cachée
        if (index < MAX_VISIBLE) {
          calendarListDiv.appendChild(calDiv);
        } else {
          hiddenDiv.appendChild(calDiv);
        }
      });

      // Si il y a plus de MAX_VISIBLE calendriers, ajout du bouton "Afficher plus"
      if (allData.calendars.length > MAX_VISIBLE) {
        const toggleBtn = document.createElement("button");
        toggleBtn.classList.add("btn", "btn-secondary", "btn-full");
        toggleBtn.textContent = "Afficher plus";

        toggleBtn.addEventListener("click", () => {
          if (hiddenDiv.style.display === "none") {
            hiddenDiv.style.display = "block";
            toggleBtn.textContent = "Afficher moins";
          } else {
            hiddenDiv.style.display = "none";
            toggleBtn.textContent = "Afficher plus";
          }
        });

        calendarListDiv.appendChild(hiddenDiv);
        calendarListDiv.appendChild(toggleBtn);
      }
    }
  } catch (err) {
    showMessage("Impossible de charger votre calendrier", "error");
  }

  // === Gestion des Popups ===
  //
  //
  //

  const newCalendarModal = document.getElementById("newCalendarModal");
  const newCalendarForm = document.getElementById("newCalendarForm");
  const btnNewCalendar = document.getElementById("btnNewCalendar");
  const btnCancelNewCalendar = document.getElementById("btnCancelNewCalendar");

  if (
    btnNewCalendar &&
    newCalendarModal &&
    btnCancelNewCalendar &&
    newCalendarForm
  ) {
    // Ouvrir le popup
    btnNewCalendar.addEventListener("click", () => {
      newCalendarModal.classList.remove("hidden");
    });

    // Fermer le popup
    btnCancelNewCalendar.addEventListener("click", () => {
      newCalendarModal.classList.add("hidden");
      newCalendarForm.reset();
    });

    // Fermer si clic à l’extérieur
    newCalendarModal.addEventListener("click", (e) => {
      if (e.target === newCalendarModal) {
        newCalendarModal.classList.add("hidden");
        newCalendarForm.reset();
      }
    });
  }

  // --- Popup Modifier Calendrier ---
  const btnModCalendar = document.getElementById("btnModCalendar");
  const calendarModal = document.getElementById("calendarModal");
  const calendarForm = document.getElementById("calendarForm");
  const btnCancelCalendar = document.getElementById("btnCancelCalendar");

  if (btnModCalendar && calendarModal && calendarForm && btnCancelCalendar) {
    btnModCalendar.addEventListener("click", () =>
      calendarModal.classList.remove("hidden")
    );
    btnCancelCalendar.addEventListener("click", () => {
      calendarModal.classList.add("hidden");
      calendarForm.reset();
    });
    calendarModal.addEventListener("click", (e) => {
      if (e.target === calendarModal) {
        calendarModal.classList.add("hidden");
        calendarForm.reset();
      }
    });

    // === Écouteur pour modifier le titre d’un calendrier ===
    calendarForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newTitle = document.getElementById("calendarTitle").value.trim();

      const calendarId =
        document.querySelector(".calendar-title").dataset.calendarId;

      const confirmed = await showConfirm(
        `Confirmer le changement du titre en "${newTitle}" ?`
      );
      if (!confirmed) return;

      try {
        const res = await fetch("/user/calendar/updateTitle", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ calendarId, newTitle }),
        });

        const data = await res.json();

        if (!res.ok) {
          showMessage(data.error || "Erreur lors de la modification", "error");
          return;
        }

        // Met à jour le titre dans le DOM
        document.querySelector(".calendar-title").textContent = newTitle;
        document.querySelector(".calendar-title").textContent = newTitle;
        const titleSpan = document.querySelector(
          `.event-title[data-calendar-id="${calendarId}"]`
        );
        titleSpan.textContent = newTitle;

        const newCalendarModal = document.getElementById("newCalendarModal");
        const CalendarForm = document.getElementById("newCalendarForm");
        if (newCalendarModal && newCalendarForm) {
          calendarModal.classList.add("hidden");
          CalendarForm.reset();
        }

        showMessage(data.message || "Titre modifié avec succès", "success");
      } catch (err) {
        console.error(err);
        showMessage("Erreur serveur, réessayez plus tard", "error");
      }
    });

    // === Écouteur de suppression d'un calendrier===
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const button = e.target.closest("button.delete-btn");
        if (!button) return;

        const calendarId = button.dataset.id;

        const confirmed = await showConfirm(
          `Voulez-vous vraiment supprimer ce calendrier ?`
        );
        if (!confirmed) return;

        try {
          const res = await fetch(`/user/calendar/delete/${calendarId}`, {
            method: "DELETE",
            credentials: "include",
          });
          const data = await res.json();
          if (!res.ok) {
            showMessage(data.error, "error");
            return;
          }

          button.closest(".event-item").remove();
          showMessage(data.message, "success");
        } catch (err) {
          showMessage(data.error, "error");
        }
      });
    });

    // Quand on clique sur "Créer"
    newCalendarForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titleInput = document.getElementById("newCalendarTitle");
      const title = titleInput.value.trim();

      try {
        const res = await fetch("/user/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title }),
        });

        const data = await res.json();

        if (!res.ok) {
          showMessage(data.error, "error");
          return;
        }

        // Succès on peut fermer le modal et actualiser la liste
        newCalendarModal.classList.add("hidden");
        newCalendarForm.reset();
        showMessage(data.message, "success");
        // Rafraîchit la page ou recharge la liste des calendriers
        location.reload();
      } catch (err) {
        console.error(err);
        showMessage("Erreur serveur, réessayez plus tard.", "error");
      }
    });
  }

  // --- Popup Nouvel Événement ---
  const btnNewEvent = document.getElementById("btnNewEvent");
  const eventModal = document.getElementById("eventModal");
  const btnCancel = document.getElementById("btnCancel");
  const eventForm = document.getElementById("eventForm");

  if (btnNewEvent && eventModal && btnCancel && eventForm) {
    btnNewEvent.addEventListener("click", () =>
      eventModal.classList.remove("hidden")
    );
    btnCancel.addEventListener("click", () => {
      eventModal.classList.add("hidden");
      eventForm.reset();
    });
    eventModal.addEventListener("click", (e) => {
      if (e.target === eventModal) {
        eventModal.classList.add("hidden");
        eventForm.reset();
      }
    });
  }
});
