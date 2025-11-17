let calendar; // variable globale

/**
 * Met à jour le data-attribute avec la liste d'IDs
 */
function setActiveCalendarIdsLocal(ids) {
  if (!Array.isArray(ids)) ids = [ids];
  localStorage.setItem("activeCalendars", JSON.stringify(ids));
}

/**
 * Recupere les id des calendriers actifs
 */
function getActiveCalendarIdsLocal() {
  const data = localStorage.getItem("activeCalendars");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Ajoute un ID à la liste des calendriers actifs
 */
function addActiveCalendarIdLocal(id) {
  const ids = getActiveCalendarIdsLocal();
  if (!ids.includes(id)) ids.push(id);
  setActiveCalendarIdsLocal(ids);
}

/**
 * Supprime un ID de la liste des calendriers actifs
 * S'assure qu'il reste au moins un ID actif
 * *****************************************
 * Sprint 2
 */
function removeActiveCalendarIdLocal(id) {
  let ids = getActiveCalendarIdsLocal();
  ids = ids.filter((i) => i !== id);
  setActiveCalendarIdsLocal(ids);
}

/**
 * Met à jour l'affichage du calendrier avec un nouveau jeu de données
 */
function updateCalendarView(calendarData, calendar) {
  if (!calendarData || !calendar) return;

  try {
    // --- Met à jour le titre du calendrier ---
    const titleDiv = document.querySelector(".calendar-title");
    if (titleDiv) {
      titleDiv.textContent = calendarData.title || "Sans titre";

      // Ajoute ce calendrier à la liste des actifs
      setActiveCalendarIdsLocal([calendarData._id]);
      //Normalement on doit utiliser add mais c pour sprint 2
      //addActiveCalendarIdLocal(calendarData._id);
    }

    // --- Réinitialise les événements actuels ---
    calendar.removeAllEvents();

    // Prépare et ajoute les nouveaux événements
    if (Array.isArray(calendarData.appointments)) {
      const events = calendarData.appointments.map((r) => ({
        id: r._id,
        title: r.name,
        start: r.date_debut,
        end: r.date_fin,
        backgroundColor: calendarData.color,
        borderColor: calendarData.color,
        textColor: "#fff",
        extendedProps: { description: r.description || "" },
        display: "auto",
      }));

      events.forEach((ev) => calendar.addEvent(ev));
    }

    // --- Rendu final ---
    calendar.render();
  } catch (err) {
    showMessage("Erreur lors de la mise à jour du calendrier", "error");
    console.error(err);
  }
}

/**
 * Gère l'affichage des calendriers avec max 4 visibles et un bouton "Afficher plus / moins"
 */
function renderCalendarListUI(calendarListDiv) {
  const MAX_VISIBLE = 4;

  // Récupère tous les items
  const allItems = Array.from(calendarListDiv.querySelectorAll(".event-item2"));

  // Retirer tout hiddenDiv et toggleBtn existants
  const existingHidden = calendarListDiv.querySelector(".hidden-calendars");
  if (existingHidden) {
    // Déplace les enfants vers calendarListDiv pour ne rien perdre
    while (existingHidden.firstChild) {
      calendarListDiv.appendChild(existingHidden.firstChild);
    }
    existingHidden.remove();
  }
  const existingToggle = calendarListDiv.querySelector(".btn-toggle-hidden");
  if (existingToggle) existingToggle.remove();

  // Créer un nouveau hiddenDiv si nécessaire
  const hiddenDiv = document.createElement("div");
  hiddenDiv.classList.add("hidden-calendars");
  hiddenDiv.style.display = "none";

  allItems.forEach((item, index) => {
    if (index >= MAX_VISIBLE) {
      hiddenDiv.appendChild(item);
    }
  });

  // Ajouter le hiddenDiv et le bouton si besoin
  if (allItems.length > MAX_VISIBLE) {
    const toggleBtn = document.createElement("button");
    toggleBtn.classList.add(
      "btn",
      "btn-secondary",
      "btn-full",
      "btn-toggle-hidden"
    );
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

/**
 * Crée un element dans la list des calendriers
 */
function createCalendarElement(cal, calendar) {
  const calendarListDiv = document.querySelector(".calendars-list");
  if (!calendarListDiv) return;

  const calDiv = document.createElement("div");
  calDiv.classList.add("event-item2");
  calDiv.dataset.id = cal._id;

  // Partie gauche
  const leftDiv = document.createElement("div");
  leftDiv.classList.add("event-left2");

  // Création de la checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = false;

  // Écouteur pour la sélection d'un calendrier
  checkbox.addEventListener("change", async (e) => {
    const selectedCheckbox = e.target;
    const calDiv = selectedCheckbox.closest(".event-item2");
    if (!calDiv) return;

    const calendarId = calDiv.dataset.id;

    if (!selectedCheckbox.checked) {
      // Si on décoche, on ne fait rien a part gerer local pour le test (SPRINT 2)
      let activeIds = getActiveCalendarIdsLocal();
      if (activeIds.includes(calendarId)) {
        removeActiveCalendarIdLocal(calendarId);
      }
      return;
    }

    try {
      // Récupère les données du calendrier sélectionné
      const res = await fetch(`/user/agenda/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ calendarId }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(
          data.error || "Erreur lors du chargement du calendrier",
          "error"
        );
        selectedCheckbox.checked = false;
        return;
      }

      // Met à jour l'affichage du calendrier
      updateCalendarView(data.calendar, calendar);
      // Met à jour la liste des IDs actifs
      setActiveCalendarIdsLocal([calendarId]);
      // Met à jour les cases à cocher pour refléter la sélection
      updateCalendarCheckboxes(getActiveCalendarIdsLocal());

      showMessage("Calendrier sélectionné avec succès", "success");
    } catch (err) {
      console.error(err);
      showMessage("Erreur serveur, réessayez plus tard.", "error");
      selectedCheckbox.checked = false;
    }
  });

  // Ajouter la checkbox au DOM
  leftDiv.appendChild(checkbox);

  const colorDiv = document.createElement("div");
  colorDiv.classList.add("calendar-color");
  colorDiv.style.background = cal.color || "#ccc";
  leftDiv.appendChild(colorDiv);

  const titleDiv = document.createElement("div");
  titleDiv.classList.add("event-info2");

  const titleSpan = document.createElement("div");
  titleSpan.classList.add("event-title2");
  titleSpan.textContent = cal.title;
  titleDiv.appendChild(titleSpan);
  leftDiv.appendChild(titleDiv);

  calDiv.appendChild(leftDiv);

  // --- Bouton modifier ---
  const editBtn = document.createElement("button");
  editBtn.classList.add("btn-icon", "edit-btn-cal");
  editBtn.title = "Modifier";
  editBtn.innerHTML = `<i class="fas fa-pen"></i>`;
  calDiv.appendChild(editBtn);

  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn-cal");
    if (!editBtn) return;

    const calDiv = editBtn.closest(".event-item2");
    const calendarId = calDiv?.dataset.id;

    const calendarModal = document.getElementById("calendarModal");
    const calendarForm = document.getElementById("calendarForm");
    const titleInput = document.getElementById("calendarTitle");

    if (!calendarModal || !calendarForm || !titleInput) {
      console.error(
        "Le formulaire ou la modale de calendrier est introuvable."
      );
      return;
    }

    // Afficher la modale
    calendarModal.classList.remove("hidden");

    // Stocker temporairement l'ID dans la modale pour savoir quoi modifier
    calendarForm.dataset.editingId = calendarId;
  });

  // --- Bouton supprimer ---
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("btn-icon", "delete-btn-cal");
  deleteBtn.title = "Supprimer";
  deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i>`;
  calDiv.appendChild(deleteBtn);

  // --- Événement de suppression ---
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const button = e.target.closest("button.delete-btn-cal");
    if (!button) return;

    const calendarId = calDiv.dataset.id;

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

      button.closest(".event-item2").remove();
      renderCalendarListUI(calendarListDiv);
      showMessage(data.message, "success");
    } catch (err) {
      showMessage(data.error, "error");
    }

    // --- Gérer le localStorage ---
    let activeIds = getActiveCalendarIdsLocal();
    if (activeIds.includes(calendarId)) {
      removeActiveCalendarIdLocal(calendarId);
    }

    if (getActiveCalendarIdsLocal().length === 0) {
      // Récupérer le premier calendrier restant dans la liste
      const firstCalendarDiv = document.querySelector(".event-item2");
      if (firstCalendarDiv) {
        const newCalendarId = firstCalendarDiv.dataset.id;
        setActiveCalendarIdsLocal([newCalendarId]);

        // Récupérer les données du nouveau calendrier
        const resNew = await fetch(`/user/agenda/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ calendarId: newCalendarId }),
        });
        const dataNew = await resNew.json();
        if (resNew.ok && dataNew.calendar) {
          updateCalendarView(dataNew.calendar, calendar);
          updateCalendarCheckboxes(getActiveCalendarIdsLocal());
        }
      } else {
        // Aucun calendrier restant → erreur cas impossible
        console.error(
          "Le formulaire ou la modale de calendrier est introuvable."
        );
      }
    }
  });

  calendarListDiv.appendChild(calDiv);
}

/**
 * Met à jour les cases à cocher des calendriers
 * en fonction des IDs stockés dans le localStorage
 */
function updateCalendarCheckboxes() {
  const selectedIds = getActiveCalendarIdsLocal();

  const allCheckboxes = document.querySelectorAll(
    ".event-item2 input[type='checkbox']"
  );

  allCheckboxes.forEach((checkbox) => {
    const parentDiv = checkbox.closest(".event-item2");
    if (!parentDiv) return;

    const calendarId = parentDiv.dataset.id;
    checkbox.checked = selectedIds.includes(calendarId);
  });
}

function openEventDetailsPopup(event) {
  const rdv = {
    _id: event.id,
    name: event.title,
    description: event.extendedProps.description || "",
    date_debut: event.start,
    date_fin: event.end,
  };

  // Elements HTML
  const popup = document.getElementById("eventDetailsModal");
  popup.classList.remove("hidden");

  popup.querySelector(".details-title").textContent = rdv.name;
  popup.querySelector(".details-description").textContent =
    rdv.description || "Aucune description";

  popup.querySelector(".details-date").textContent =
    new Date(rdv.date_debut).toLocaleString() +
    " → " +
    new Date(rdv.date_fin).toLocaleString();

  // Bouton Modifier → ouvre ta popup actuelle
  popup.querySelector(".btn-edit").onclick = () => {
    popup.classList.add("hidden");
    openEditPopup(rdv);
  };

  // Bouton Supprimer
  popup.querySelector(".btn-delete").onclick = async () => {
    popup.classList.add("hidden");

    const ok = await deleteAppointment(rdv._id);

    if (ok) {
      EventSync.deleteUpcomingEvent(rdv._id);
      EventSync.removeFromCalendar(rdv._id);
    }
  };
}

/**  === Initialisation de la page d'accueil avec les données de l'utilisateur ===
 */

document.addEventListener("DOMContentLoaded", async function () {
  // === Initialisation du calendrier ===
  const calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek", // Vue principale : semaine horaire
    allDaySlot: false, // pas de créneaux "toute la journée"
    slotEventOverlap: false, // interdit chevauchement visuel
    eventOverlap: false, // interdit drag & drop sur événements chevauchants
    eventOrder: "start,-duration", // tri par début, puis durée
    locale: "fr",
    themeSystem: "standard",
    nowIndicator: true,
    slotMinTime: "00:00:00",
    slotMaxTime: "24:00:00",
    slotDuration: "00:30:00",
    slotLabelInterval: "01:00",
    slotLabelFormat: { hour: "2-digit", minute: "2-digit", hour12: false },

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },

    navLinks: true,
    selectable: true,
    editable: true,
    dayMaxEvents: true,
    height: "auto",
    contentHeight: "auto",
    expandRows: true,

    eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },

    // Événements dynamiques
    events: [],

    // Tooltip pro avec tippy.js
    eventDidMount: function (info) {
      const isListView = info.view.type.startsWith("list");

      if (isListView) {
        // Garder le background color mais rendre le texte de l'heure noir
        info.el.style.backgroundColor = info.event.backgroundColor;
        info.el.style.borderColor = info.event.borderColor;

        const timeEl = info.el.querySelector(".fc-list-event-time");
        if (timeEl) timeEl.style.color = "#000"; // heure en noir

        const titleEl = info.el.querySelector(".fc-list-event-title");
        if (titleEl) titleEl.style.color = "#fff"; // titre en blanc
      } else {
        // vues grid/time → texte blanc complet
        info.el.style.backgroundColor = info.event.backgroundColor;
        info.el.style.borderColor = info.event.borderColor;
        info.el.style.color = "#fff";
      }

      // Tooltip pro sur hover
      tippy(info.el, {
        content: info.event.extendedProps.description || info.event.title,
        placement: "top",
        theme: "light",
      });
    },

    // Clic sur un événement
    eventClick: function (info) {
      openEventDetailsPopup(info.event);
    },
    // Ajuste la couleur des événements en fonction du calendrier
    eventContent: function (arg) {
      const backgroundColor = arg.event.backgroundColor || "#4f46e5";
      const textColor = "#fff";

      return {
        html: `<div class="fc-event-custom" style="background:${backgroundColor};color:${textColor};padding:2px 5px;border-radius:5px;"> ${arg.event.title} </div>`,
      };
    },
  });
  calendar.render();
  // --- Charger les calendriers de l'utilisateur ---
  const activeIds = getActiveCalendarIdsLocal();
  if (activeIds.length === 0) {
    // On recupere le calendrier par default
    try {
      const res = await fetch("/user/agenda", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          `Erreur récupération calendrier : ${res.status} - ${errText}`
        );
      }

      const data = await res.json();

      if (data.calendar) {
        updateCalendarView(data.calendar, calendar);
        showMessage("Calendrier par default chargé avec succès", "success");
      } else {
        showMessage(data.error || "Aucun calendrier trouvé", "error");
      }
    } catch (err) {
      showMessage(
        "Impossible de charger votre calendrier - Update View",
        "error"
      );
    }
  } else {
    // On recupere les calendriers actifs
    const calendarId = activeIds[0]; // pour l’instant, on affiche que le premier => SPRINT 2
    try {
      const res = await fetch(`/user/agenda`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId }),
      });

      const data = await res.json();
      if (!res.ok) {
        return showMessage(
          data.error || "Impossible de charger votre calendrier actif",
          "error"
        );
      }

      updateCalendarView(data.calendar, calendar);
      updateCalendarCheckboxes(activeIds);
    } catch (err) {
      console.error(err);
      showMessage("Erreur lors du chargement du calendrier actif", "error");
    }
  }
  try {
    // --- Récupération de tous les calendriers ---
    const allRes = await fetch("/user/calendars", {
      method: "GET",
      credentials: "include",
    });
    if (!allRes.ok) {
      showMessage("Erreur récupération des calendriers", "error");
      return;
    }

    const allData = await allRes.json();

    // === La liste des calendriers ===
    const calendarListDiv = document.querySelector(".calendars-list");
    if (calendarListDiv) {
      // Boucle sur tous les calendriers pour créer les éléments
      allData.calendars.forEach((cal) => {
        createCalendarElement(cal, calendar);
      });

      // Appel de la fonction qui gère la limite à 4 et le bouton "Afficher plus / moins"
      updateCalendarCheckboxes(getActiveCalendarIdsLocal());
      renderCalendarListUI(calendarListDiv);
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

      //modif le bouton s'affiche que si 1 seul calendrier est actif a faire apres
      const calendarId =
        calendarForm.dataset.editingId || getActiveCalendarIdsLocal()[0];

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

        if (data._id === getActiveCalendarIdsLocal()[0]) {
          document.querySelector(".calendar-title").textContent = newTitle;
        }
        // Récupère la div parent qui correspond au calendrier
        const parentDiv = document.querySelector(
          `.event-item2[data-id="${calendarId}"]`
        );
        if (parentDiv) {
          const titleSpan = parentDiv.querySelector(".event-title2");
          if (titleSpan) {
            titleSpan.textContent = newTitle;
          }
        }

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

    // Quand on clique sur "Créer"
    newCalendarForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titleInput = document.getElementById("newCalendarTitle");
      const title = titleInput.value.trim();
      if (!title) return showMessage("Veuillez saisir un titre", "error");

      try {
        const res = await fetch("/user/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title }),
        });

        const data = await res.json();
        if (!res.ok) return showMessage(data.error, "error");

        // --- Succès ---
        showMessage(data.message, "success");
        newCalendarModal.classList.add("hidden");
        newCalendarForm.reset();

        const calendarListDiv = document.querySelector(".calendars-list");
        if (!calendarListDiv) return;

        const cal = data.calendar;

        // --- Création du nouvel élément calendrier ---
        createCalendarElement(cal, calendar);
        // --- Mise à jour du bouton "Afficher plus / moins" ---
        renderCalendarListUI(calendarListDiv);
      } catch (err) {
        console.error(err);
        showMessage("Erreur serveur, réessayez plus tard.", "error");
      }
    });
  }
});

document.addEventListener("appointmentsUpdated", async () => {
  const calendarId = getActiveCalendarIdsLocal()[0];
  console.log("appointmentsUpdated → ID utilisé :", calendarId);

  if (!calendarId) {
    console.error("Aucun ID calendrier");
    return;
  }

  const res = await fetch("http://localhost:3000/user/agenda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ calendarId }),
  });

  if (!res.ok) {
    console.error("Erreur backend :", res.status);
    return;
  }

  const data = await res.json();
  updateCalendarView(data.calendar, calendar);
});

// --- Gestion fermeture popup des détails ---
(function () {
  const modal = document.getElementById("eventDetailsModal");
  if (!modal) return;

  const content = modal.querySelector(".modal-content");
  const btnClose = modal.querySelector(".btn-close");

  // Bouton fermer
  if (btnClose) {
    btnClose.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  // Clic extérieur
  modal.addEventListener("click", (e) => {
    // Si on clique directement sur le fond en arrière-plan
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Empêcher fermeture quand on clique dans la fenêtre
  content.addEventListener("click", (e) => {
    e.stopPropagation();
  });
})();
