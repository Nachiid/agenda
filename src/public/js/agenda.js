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
 */
function removeActiveCalendarIdLocal(id) {
  let ids = getActiveCalendarIdsLocal();
  ids = ids.filter((i) => i && i !== id);
  setActiveCalendarIdsLocal(ids);
}

/**
 * Met à jour l'affichage du calendrier avec un nouveau jeu de données
 */
function updateCalendarView(calendars, calendar) {
  if (!Array.isArray(calendars) || !calendar) return;

  try {
    calendars.forEach((cal) => {
      // Mettre à jour le titre du calendrier affiché (ou afficher "Multi-calendriers")
      //const titleDiv = document.querySelector(".calendar-title");
      //if (titleDiv) {
      //  titleDiv.textContent =
      //    calendars.length === 1 ? cal.title : "Calendriers combinés";
      //}

      addActiveCalendarIdLocal(cal._id);

      // Ajouter chaque rendez-vous du calendrier
      if (Array.isArray(cal.appointments)) {
        cal.appointments.forEach((r) => {
          calendar.addEvent({
            id: r._id,
            title: r.name,
            start: r.date_debut,
            end: r.date_fin,
            backgroundColor: cal.color,
            borderColor: cal.color,
            textColor: "#fff",
            extendedProps: {
              description: r.description || "",
              calendarId: cal._id,
            },
            display: "auto",
          });
        });
      } else {
        console.log(cal.appointments);
      }
    });

    calendar.render();
  } catch (err) {
    showMessage("Erreur lors de la mise à jour du calendrier", "error");
    console.error(err);
  }
}

/**
 * supprimer les événements d’un calendrier spécifique
 */

function removeCalendarEvents(calendarId, calendar) {
  if (!calendar || !calendarId) return;

  const events = calendar.getEvents();

  events.forEach((ev) => {
    if (ev.extendedProps?.calendarId === calendarId) {
      ev.remove();
    }
  });
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

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = false;

  checkbox.addEventListener("change", async (e) => {
    const selectedCheckbox = e.target;
    const calDiv = selectedCheckbox.closest(".event-item2");
    if (!calDiv) return;
    const calendarId = calDiv.dataset.id;

    if (!selectedCheckbox.checked) {
      let activeIds = getActiveCalendarIdsLocal();
      if (activeIds.length === 1) {
        selectedCheckbox.checked = true;
        showMessage("Vous devez garder au moins un calendrier actif.", "error");
        return;
      }
      if (activeIds.includes(calendarId)) {
        removeActiveCalendarIdLocal(calendarId);
        removeCalendarEvents(calendarId, calendar);
      }
      return;
    }

    try {
      const res = await fetch(`/user/agenda/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ calendarIds: [calendarId] }),
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
      updateCalendarView(data.calendars, calendar);
      updateCalendarCheckboxes(getActiveCalendarIdsLocal());
      await window.fetchAppointments(getActiveCalendarIdsLocal());
    } catch (err) {
      console.error(err);
      showMessage("Erreur serveur, réessayez plus tard.", "error");
      selectedCheckbox.checked = false;
    }
  });

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

  // --- Menu wrapper pour boutons ---
  const menuWrapper = document.createElement("div");
  menuWrapper.classList.add("menu-wrapper");

  // Bouton menu
  const dotsBtn = document.createElement("button");
  dotsBtn.classList.add("dots-btn");
  dotsBtn.innerHTML = `<i class="fas fa-ellipsis-v"></i>`;
  menuWrapper.appendChild(dotsBtn);

  // Menu déroulant
  const menu = document.createElement("div");
  menu.classList.add("menu", "hidden");

  // Bouton modifier
  const editBtn = document.createElement("button");
  editBtn.classList.add("menu-edit", "edit-btn-cal");
  editBtn.dataset.id = cal._id;
  editBtn.innerHTML = `<i class="fas fa-pen"></i> Modifier`;
  menu.appendChild(editBtn);

  // Bouton supprimer
  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("menu-delete", "delete-btn-cal");
  deleteBtn.dataset.id = cal._id;
  deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Supprimer`;
  menu.appendChild(deleteBtn);

  // Bouton partager
  const shareBtn = document.createElement("button");
  shareBtn.classList.add("menu-share-cal");
  shareBtn.dataset.id = cal._id;
  shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> Partager`;
  menu.appendChild(shareBtn);

  // Bouton Exporter
  const ExpoBtn = document.createElement("Button");
  ExpoBtn.classList.add("menu-expo");
  ExpoBtn.dataset.id = cal._id;
  ExpoBtn.innerHTML = `<i class="fas fa-expo-alt"></i> Exporter`;
  menu.appendChild(ExpoBtn); 

  ExpoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const calendarId = e.currentTarget.dataset.id;
    window.location.href = `/user/calendar/export/${calendarId}`;
  });

  menuWrapper.appendChild(menu);
  calDiv.appendChild(menuWrapper);

  // --- Événement pour ouvrir/fermer le menu ---
  dotsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
    menu.classList.toggle("show");
  });

  // Fermer tous les menus si clic ailleurs
  document.addEventListener("click", () => {
    document.querySelectorAll(".menu").forEach((m) => {
      m.classList.add("hidden");
      m.classList.remove("show");
    });
  });

  // --- Gestion suppression existante ---
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const calendarId = calDiv.dataset.id;
     if (getActiveCalendarIdsLocal().length === 1) {
     showMessage("Vous devez garder au moins un calendrier.", "error");
    return;
     }
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
      calDiv.remove();
      renderCalendarListUI(calendarListDiv);
      showMessage(data.message, "success");
      if (getActiveCalendarIdsLocal().length === 0) {
        const firstCalendarDiv = document.querySelector(".event-item2");
        if (firstCalendarDiv) {
          const newCalendarId = firstCalendarDiv.dataset.id;
          console.log("test suppression : " + newCalendarId);
          setActiveCalendarIdsLocal([newCalendarId]);
        }
      }
    } catch (err) {
      showMessage("Erreur serveur", "error");
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

  const popup = document.getElementById("eventDetailsModal");
  popup.classList.remove("hidden");

  popup.querySelector(".details-title").textContent = rdv.name;
  popup.querySelector(".details-description").textContent =
    rdv.description || "Aucune description";

  popup.querySelector(".details-date").textContent =
    new Date(rdv.date_debut).toLocaleString() +
    " → " +
    new Date(rdv.date_fin).toLocaleString();

  const btnDelete = popup.querySelector(".btn-delete");
  btnDelete.dataset.id = rdv._id;

  // Dispatch custom event au clic
  btnDelete.onclick = () => {
    document.dispatchEvent(
      new CustomEvent("deleteAppointmentFromPopup", { detail: { id: rdv._id } })
    );
    popup.classList.add("hidden");
  };

  // Bouton Modifier
  popup.querySelector(".btn-edit").onclick = () => {
    popup.classList.add("hidden");
    const eventModal = document.getElementById("eventModal");
    eventModal.classList.remove("hidden");
    eventForm.dataset.editingId = rdv._id;
    // Modifier le titre DU popup ouvert
    eventModal.querySelector(".modal-title").textContent = "Modifier le RDV";
    eventModal.querySelector(".btn.btn-primary").textContent = "Modifier";
    const start = new Date(rdv.date_debut);
    const end = new Date(rdv.date_fin);

    document.getElementById("eventTitle").value = rdv.name;
    document.getElementById("eventComment").value = rdv.description;
    document.getElementById("eventDateStart").value = start
      .toISOString()
      .slice(0, 10);
    document.getElementById("eventTimeStart").value = start
      .toTimeString()
      .slice(0, 5);
    document.getElementById("eventDateEnd").value = end
      .toISOString()
      .slice(0, 10);
    document.getElementById("eventTimeEnd").value = end
      .toTimeString()
      .slice(0, 5);
  };
}

// Fonction pour gérer les mises à jour du calendrier
function updateCalendar({ type, eventData }) {
  switch (type) {
    case "delete":
      const event = calendar.getEventById(eventData._id);
      if (event) event.remove();
      break;

    case "update":
      const eventToUpdate = calendar.getEventById(eventData._id);
      if (eventToUpdate) {
        eventToUpdate.setProp("title", eventData.name);
        eventToUpdate.setStart(eventData.date_debut);
        eventToUpdate.setEnd(eventData.date_fin);
        eventToUpdate.setExtendedProp("description", eventData.description);
      }
      break;

    case "add":
      calendar.addEvent({
        id: eventData._id,
        title: eventData.name,
        start: eventData.date_debut,
        end: eventData.date_fin,
        description: eventData.description,
      });
      break;
  }
}

// Rendre la fonction accessible depuis appointments.js etc
window.updateCalendar = updateCalendar;

async function getUserPreference() {
  try {
    const res = await fetch(`http://localhost:3000/user/preference`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok) return data.userPreference;
    throw new Error(data.error || "Erreur lors du chargement du profil");
  } catch (err) {
    showMessage(err.message, "error");
    return null;
  }
}

// Fonction de mapping
function mapDefaultView(viewFromDb) {
  switch (viewFromDb) {
    case "Semaine":
      return "timeGridWeek";
    case "Mois":
      return "dayGridMonth";
    case "Jour":
      return "timeGridDay";
    case "Liste":
      return "listWeek";
    default:
      return "timeGridWeek"; // fallback
  }
}

/**  === Initialisation de la page d'accueil avec les données de l'utilisateur ===
 */

document.addEventListener("DOMContentLoaded", async function () {
  // === Initialisation du calendrier ===
  const calendarEl = document.getElementById("calendar");
  const userPreference = await getUserPreference();
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: mapDefaultView(userPreference?.defaultView || "Semaine"), // Vue principale : semaine horaire
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

    // Tooltip
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

      // Tooltip sur hover
      info.el.removeAttribute("title");

      // Active Tippy seulement si une description existe
      const desc = info.event.extendedProps.description;
      if (desc && desc.trim() !== "") {
        tippy(info.el, {
          content: desc,
          placement: "top",
          theme: "light",
        });
      }
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
        updateCalendarView([data.calendar], calendar);
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
    const calendarIds = activeIds;
    try {
      const res = await fetch(`/user/agenda`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        return showMessage(
          data.error || "Impossible de charger votre calendrier actif",
          "error"
        );
      }

      updateCalendarView(data.calendars, calendar);
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
      await window.fetchAppointments(getActiveCalendarIdsLocal());
    }
  } catch (err) {
    showMessage("Impossible de charger votre calendrier", "error");
  }
  // --- Gestion des Popups ---
  //
  //
  //
  const btnImporter = document.getElementById("btnImporter");
  const importModal = document.getElementById("importModal");
  const importForm = document.getElementById("importForm");
  const btnCancelImport = document.getElementById("btnCancelImport");

  if (btnImporter && importModal && importForm && btnCancelImport) {
    // Ouvrir le popup
    btnImporter.addEventListener("click", () => {
      importModal.classList.remove("hidden");
    });

    // Fermer le popup
    btnCancelImport.addEventListener("click", () => {
      importModal.classList.add("hidden");
      importForm.reset();
    });

    // Fermer si clic à l’extérieur
    importModal.addEventListener("click", (e) => {
      if (e.target === importModal) {
        importModal.classList.add("hidden");
        importForm.reset();
      }
    });

    importForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("importFile");
      const file = fileInput.files[0];

      if (!file) {
        return showMessage("Please select a file to import.", "error");
      }

      const formData = new FormData();
      formData.append("importFile", file);

      try {
        const res = await fetch("/user/calendar/import", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          return showMessage(data.error || "Failed to import calendar.", "error");
        }

        showMessage(data.message, "success");
        importModal.classList.add("hidden");
        importForm.reset();
        location.reload();
      } catch (err) {
        console.error(err);
        showMessage("Server error, please try again later.", "error");
      }
    });
  }
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
      //maj le bouton modif est supprimer ! mais faut adapter pour que modifier dans menu fonctionne
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

// Gestion globale pour tous les boutons modifier
document.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".edit-btn-cal");
  if (!editBtn) return;
  const calDiv = editBtn.closest(".event-item2");
  const calendarId = calDiv?.dataset.id;
  const calendarModal = document.getElementById("calendarModal");
  const calendarForm = document.getElementById("calendarForm");
  const titleInput = document.getElementById("calendarTitle");
  if (!calendarModal || !calendarForm || !titleInput) {
    console.error("Le formulaire ou la modale de calendrier est introuvable.");
    return;
  }
  calendarModal.classList.remove("hidden");
  calendarForm.dataset.editingId = calendarId;
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

// --- Réinitialise les événements actuels ---
//calendar.removeAllEvents();
/*


document.addEventListener("appointmentsUpdated", async () => {
  const calendarId = getActiveCalendarIdsLocal()[0];

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
*/
