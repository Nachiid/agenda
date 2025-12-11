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
window.getActiveCalendarIdsLocal = getActiveCalendarIdsLocal;

/**
 * Ajoute un ID à la liste des calendriers actifs
 */
function addActiveCalendarIdLocal(id) {
  const ids = getActiveCalendarIdsLocal();
  if (!ids.includes(id)) ids.push(id);
  setActiveCalendarIdsLocal(ids);
}
window.addActiveCalendarIdLocal = addActiveCalendarIdLocal;

function removeNewEvents() {
  if (!calendar) return;

  // Récupérer tous les events
  const events = calendar.getEvents();

  events.forEach((event) => {
    if (event.extendedProps?.isNew === true) {
      event.remove();
    }
  });
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
      addActiveCalendarIdLocal(cal._id);

      // Ajouter chaque rendez-vous du calendrier
      if (Array.isArray(cal.appointments)) {
        cal.appointments.forEach((r) => {
          let eventObj = {
            id: r._id,
            title: r.name,
            backgroundColor: cal.color,
            borderColor: cal.color,
            textColor: "#fff",
            extendedProps: {
              description: r.description || "",
              calendarId: cal._id,
              event_role: cal.role,
              isRecurent: r.isRecurent || [],
              isNew: false,
            },
            display: "auto",
          };

          const startTime = new Date(r.date_debut).getTime();
          const endTime = new Date(r.date_fin).getTime();
          if (endTime - startTime >= 86400000) {
            eventObj.allDay = true;
          }

          if (r.isRecurent && r.isRecurent.length > 0) {
            const recurrence = r.isRecurent[0];

            // Gestion des dates exclues
            const excluded = recurrence.excludedDates || [];

            // On peut passer exdate à rrule
            // FullCalendar rrule plugin expects `exdate` as array of strings or Date objects
            // inside the `rrule` object property? No, extended props or separate property?
            // According to FullCalendar RRule docs, `exdate` is a property of the rrule object provided to the plugin

            eventObj.rrule = {
              freq: recurrence.type,
              dtstart: r.date_debut,
              until: recurrence.date_fin,
            };

            if (excluded.length > 0) {
              // Convertir en format ISO string pour être sûr
              eventObj.exdate = excluded;
              // Note: FullCalendar 6 RRule plugin handles `exdate` at top level of event object or inside rrule?
              // Usually top level `exdate` array.
            }

            const duration = new Date(r.date_fin) - new Date(r.date_debut);
            eventObj.duration = duration;
          } else {
            eventObj.start = r.date_debut;
            eventObj.end = r.date_fin;
          }

          calendar.addEvent(eventObj);
        });
      }
    });
    calendar.render();
  } catch (err) {
    showMessage("Erreur lors de la mise à jour du calendrier", "error");
    console.error(err);
  }
}
window.updateCalendarView = updateCalendarView;

/**updateCalendarView
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
function renderCalendarListUI(listDivs) {
  const VISIBLE_COUNT = 6;

  const divArray = Array.isArray(listDivs) ? listDivs : [listDivs];

  divArray.forEach((div) => {
    if (!div) return;

    const items = Array.from(div.querySelectorAll(".event-item2"));
    if (items.length === 0) return;

    // Hauteur d'un item
    const itemHeight = items[0].offsetHeight;
    const gap = parseFloat(getComputedStyle(div).gap) || 0;

    // Hauteur finale = visible items + gap entre eux
    const visibleHeight =
      itemHeight * Math.min(items.length, VISIBLE_COUNT) +
      gap * (Math.min(items.length, VISIBLE_COUNT) - 1);

    div.style.height = visibleHeight + "px";
    div.style.overflowY = items.length > VISIBLE_COUNT ? "auto" : "hidden";
  });
}
window.renderCalendarListUI = renderCalendarListUI;
/**
 * Crée un element dans la list des calendriers
 */

function createCalendarElement(cal, calendar) {
  let calendarListDiv;

  if (cal.mode === "personnel" || cal.mode === "permanent") {
    calendarListDiv = document.getElementById("calendar-list");
  } else if (cal.mode === "entreprise") {
    calendarListDiv = document.getElementById("calendar-list-entrep");
  }

  if (!calendarListDiv) return;

  const calDiv = document.createElement("div");
  calDiv.classList.add("event-item2");
  calDiv.dataset.id = cal._id;
  calDiv.dataset.mode = cal.mode;
  calDiv.dataset.role = cal.role;

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
        removeNewEvents();
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
      removeNewEvents();
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

  dotsBtn.addEventListener("click", () => {
    menu.classList.toggle("show");
    menu.classList.toggle("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu-wrapper")) {
      menu.classList.remove("show");
      menu.classList.add("hidden");
    }
  });

  dotsBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // fermer tous les autres menus
    const allMenus = document.querySelectorAll(".menu.show");
    allMenus.forEach((m) => {
      if (m !== menu) m.classList.remove("show");
    });

    // basculer celui-ci
    menu.classList.toggle("show");
  });

  // Menu déroulant
  const menu = document.createElement("div");
  menu.classList.add("menu", "hidden");

  const editBtn = document.createElement("button");
  const shareBtn = document.createElement("button");
  if (cal.role === "Owner" || cal.role === "Editor") {
    // Bouton modifier

    editBtn.classList.add("menu-edit", "edit-btn-cal");
    editBtn.dataset.id = cal._id;
    editBtn.innerHTML = `<i class="fas fa-pen"></i> Modifier`;
    menu.appendChild(editBtn);

    // Bouton partager
    shareBtn.classList.add("menu-share-cal");
    shareBtn.dataset.id = cal._id;
    shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> Partager`;
    menu.appendChild(shareBtn);

    shareBtn.addEventListener("click", () => {
      openSharePopup(cal._id, cal.mode);
    });
  }

  document.body.appendChild(menu);
  // Bouton Exporter
  const ExpoBtn = document.createElement("Button");
  ExpoBtn.classList.add("menu-expo");
  ExpoBtn.dataset.id = cal._id;
  ExpoBtn.innerHTML = `<i class="fa-solid fa-arrow-up-from-bracket"></i> Exporter`;
  menu.appendChild(ExpoBtn);

  ExpoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const calendarId = e.currentTarget.dataset.id;
    window.location.href = `/user/calendar/export/${calendarId}`;
  });

  if (cal.mode !== "permanent") {
    // Bouton supprimer
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("menu-delete", "delete-btn-cal");
    deleteBtn.dataset.id = cal._id;
    deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Supprimer`;
    menu.appendChild(deleteBtn);

    // --- Gestion suppression existante ---
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const calendarId = calDiv.dataset.id;
      const confirmed = await showConfirm(
        `Voulez-vous vraiment placer ce calendrier dans la corbeille ?`
      );
      if (!confirmed) return;

      try {
        /*const date_to_exclude = new Date();*/
        const res = await fetch(`/delete/calendar/${calendarId}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          /*body: JSON.stringify({ date_to_exclude }),*/
        });

        const data = await res.json();
        if (!res.ok) {
          let errorMessage = data.message || "Erreur lors de la suppression.";
          if (data.error) {
            errorMessage += `: ${data.error}`;
          }
          showMessage(errorMessage, "error");
          return;
        }
        calDiv.remove();

        renderCalendarListUI([
          document.getElementById("calendar-list"),
          document.getElementById("calendar-list-entrep"),
        ]);

        removeCalendarEvents(calendarId, calendar);

        showMessage("Calendrier placé dans la corbeille.", "success");
        if (getActiveCalendarIdsLocal().length === 0) {
          const firstCalendarDiv = document.querySelector(".event-item2");
          if (firstCalendarDiv) {
            const newCalendarId = firstCalendarDiv.dataset.id;
            setActiveCalendarIdsLocal([newCalendarId]);
          }
        }
      } catch (err) {
        showMessage("Erreur serveur", "error");
      }
    });
  }

  calDiv.appendChild(menuWrapper);

  // --- Événement pour ouvrir/fermer le menu ---
  dotsBtn.addEventListener("click", (e) => {
    const rect = dotsBtn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.classList.toggle("show");
  });

  // Fermer tous les menus si clic ailleurs
  document.addEventListener("click", () => {
    document.querySelectorAll(".menu").forEach((m) => {
      m.classList.add("hidden");
      m.classList.remove("show");
    });
  });

  calendarListDiv.appendChild(calDiv);
}

window.createCalendarElement = createCalendarElement;
window.updateCalendarCheckboxes = updateCalendarCheckboxes;
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

function openEventDetailsPopup(event, mode) {
  const editBtn = document.querySelector(".detail-edit");
  const deleteBtn = document.querySelector(".delete-edit");

  if (mode === "update") {
    const rdv = {
      _id: event.id,
      name: event.title,
      description: event.extendedProps.description || "",
      date_debut: event.start,
      date_fin: event.end,
      calendar_id: event.extendedProps.calendarId,
      role: event.extendedProps.event_role,
      isNew: false,
    };

    //renderCalendarField("edit");
    // Cacher les boutons si rôle Viewer
    if (rdv.role === "Viewer") {
      editBtn.style.display = "none";
      deleteBtn.style.display = "none";
    } else {
      editBtn.style.display = "inline-block";
      deleteBtn.style.display = "inline-block";
    }
    const popup = document.getElementById("eventDetailsModal");
    popup.classList.remove("hidden");
    renderCalendarField("edit", rdv.calendar_id);
    popup.querySelector(".details-title").textContent = rdv.name;
    popup.querySelector(".details-description").textContent =
      rdv.description || "Aucune description";

    popup.querySelector(".details-date").textContent =
      new Date(rdv.date_debut).toLocaleString() +
      " → " +
      new Date(rdv.date_fin).toLocaleString();

    const btnDelete = popup.querySelector(".btn-delete");
    btnDelete.dataset.id = rdv._id;
    // Si c'est récurrent, on stocke aussi la date d'instance
    if (
      rdv.role !== "Viewer" &&
      event.extendedProps.isRecurent &&
      event.extendedProps.isRecurent.length > 0
    ) {
      const instanceDate = popup.dataset.instanceDate; // Récupéré depuis eventClick
      if (instanceDate) btnDelete.dataset.instanceDate = instanceDate;
    } else {
      delete btnDelete.dataset.instanceDate;
    }

    // Dispatch custom event au clic
    btnDelete.onclick = () => {
      document.dispatchEvent(
        new CustomEvent("deleteAppointmentFromPopup", {
          detail: { id: rdv._id },
        })
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

      // Si récurrent, on a besoin de la date spécifique de l'instance pour savoir quelle exception créer
      if (popup.dataset.instanceDate) {
        eventForm.dataset.instanceDate = popup.dataset.instanceDate;
      } else {
        delete eventForm.dataset.instanceDate;
      }

      const start = new Date(rdv.date_debut);
      const end = new Date(rdv.date_fin);

      document.getElementById("eventTitle").value = rdv.name;
      document.getElementById("eventComment").value = rdv.description;
      document.getElementById("eventDateStart").value =
        start.getFullYear() +
        "-" +
        String(start.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(start.getDate()).padStart(2, "0");
      document.getElementById("eventTimeStart").value = start
        .toTimeString()
        .slice(0, 5);
      document.getElementById("eventDateEnd").value =
        end.getFullYear() +
        "-" +
        String(end.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(end.getDate()).padStart(2, "0");
      document.getElementById("eventTimeEnd").value = end
        .toTimeString()
        .slice(0, 5);

      // Peupler les champs de récurrence
      const toggleRecurrent = document.getElementById("toggleRecurrent");
      const recurrentOptions = document.getElementById("recurrentOptions");
      const isRecurrentData = event.extendedProps.isRecurent;

      if (isRecurrentData && isRecurrentData.length > 0) {
        toggleRecurrent.checked = true;
        recurrentOptions.classList.remove("hidden");
        document.getElementById("recurrenceFreq").value =
          isRecurrentData[0].type;
        if (isRecurrentData[0].date_fin) {
          document.getElementById("recurrenceEnd").value = new Date(
            isRecurrentData[0].date_fin
          )
            .toISOString()
            .slice(0, 10);
        }
      } else {
        toggleRecurrent.checked = false;
        recurrentOptions.classList.add("hidden");
        document.getElementById("recurrenceFreq").value = "daily"; // default
        document.getElementById("recurrenceEnd").value = "";
      }
    };

    const btnShare = popup.querySelector(".btn-share");
    btnShare.dataset.id = rdv._id;

    document.addEventListener("click", async (e) => {
      const btnShare = e.target.closest(".btn-share");

      if (!btnShare) return;

      document.getElementById("shareAppointmentModal").dataset.id = rdv._id;

      document.getElementById("shareRdvEmailInput").value = "";
      document.getElementById("shareRdvUserResults").innerHTML = "";

      document
        .getElementById("shareAppointmentModal")
        .classList.remove("hidden");
    });

    btnShare.addEventListener("click", async (e) => {
      if (!btnShare) return;

      document.getElementById("shareAppointmentModal").dataset.rdvId =
        btnShare.dataset.id;

      document.getElementById("shareRdvEmailInput").value = "";
      document.getElementById("shareRdvUserResults").innerHTML = "";

      document
        .getElementById("shareAppointmentModal")
        .classList.remove("hidden");
    });
    // ==========================
  } else if (mode === "add") {
    const eventModal = document.getElementById("eventModal");
    renderCalendarField("add");
    eventModal.classList.remove("hidden");

    // Modifier le titre et le bouton
    eventModal.querySelector(".modal-title").textContent = "Ajouter un RDV";
    eventModal.querySelector(".btn.btn-primary").textContent = "Créer";

    // On récupère les dates envoyées depuis dateClick

    const start = new Date(event.start);
    const end = new Date(event.end);

    // Remplissage automatique du popup
    document.getElementById("eventDateStart").value =
      start.getFullYear() +
      "-" +
      String(start.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(start.getDate()).padStart(2, "0");

    document.getElementById("eventTimeStart").value = start
      .toTimeString()
      .slice(0, 5);

    document.getElementById("eventDateEnd").value =
      end.getFullYear() +
      "-" +
      String(end.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(end.getDate()).padStart(2, "0");

    document.getElementById("eventTimeEnd").value = end
      .toTimeString()
      .slice(0, 5);
  }
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

        if (eventData.isRecurent && eventData.isRecurent.length > 0) {
          // Si l'événement devient récurrent ou change de récurrence
          // Le plus simple est souvent de supprimer et recréer pour rrule
          eventToUpdate.remove();
          const recurrence = eventData.isRecurent[0];
          const duration =
            new Date(eventData.date_fin) - new Date(eventData.date_debut);
          calendar.addEvent({
            id: eventData._id,
            title: eventData.name,
            allDay: duration >= 86400000,
            rrule: {
              freq: recurrence.type,
              dtstart: eventData.date_debut,
              until: recurrence.date_fin,
            },
            duration: duration,
            extendedProps: {
              description: eventData.description,
              isRecurent: eventData.isRecurent,
              isNew: false,
            },
          });
        } else {
          // Si ce n'est plus récurrent, on s'assure qu'il est bien set
          // Note: setStart/setEnd might not work well if transitioning from rrule to normal
          // Safer to remove and re-add if structure changes significantly, but let's try basic update
          eventToUpdate.setStart(eventData.date_debut);
          eventToUpdate.setEnd(eventData.date_fin);

          const duration =
            new Date(eventData.date_fin) - new Date(eventData.date_debut);
          eventToUpdate.setAllDay(duration >= 86400000);

          eventToUpdate.setExtendedProp("description", eventData.description);
          eventToUpdate.setExtendedProp(
            "isRecurent",
            eventData.isRecurent || []
          );
        }
      }
      break;

    case "add":
      let newEventObj = {
        id: eventData._id,
        title: eventData.name,
        extendedProps: {
          description: eventData.description,
          isRecurent: eventData.isRecurent || [],
          isNew: true,
        },
        event_role: "Editor",
      };

      const duration =
        new Date(eventData.date_fin) - new Date(eventData.date_debut);
      if (duration >= 86400000) {
        newEventObj.allDay = true;
      }

      if (eventData.isRecurent && eventData.isRecurent.length > 0) {
        const recurrence = eventData.isRecurent[0];
        newEventObj.rrule = {
          freq: recurrence.type,
          dtstart: eventData.date_debut,
          until: recurrence.date_fin,
        };
        newEventObj.duration = duration;
      } else {
        newEventObj.start = eventData.date_debut;
        newEventObj.end = eventData.date_fin;
      }

      calendar.addEvent(newEventObj);

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

/**
 * Initialise le calendrier des jours fériés
 */
function initHolidayCalendar(calendar) {
  const calendarListDiv = document.getElementById("calendar-list");
  if (!calendarListDiv) return;

  const holidayCalId = "french-holidays";

  // Vérifier si déjà présent
  if (calendarListDiv.querySelector(`[data-id="${holidayCalId}"]`)) return;

  const calDiv = document.createElement("div");
  calDiv.classList.add("event-item2");
  calDiv.dataset.id = holidayCalId;
  calDiv.dataset.mode = "personnel";
  calDiv.dataset.role = "Viewer";

  // Partie gauche
  const leftDiv = document.createElement("div");
  leftDiv.classList.add("event-left2");

  // Checkbox
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = false; // Par défaut décoché, ou lire depuis localStorage si vous voulez persister

  // Gestionnaire d'événements pour la checkbox
  checkbox.addEventListener("change", async (e) => {
    const isChecked = e.target.checked;

    if (isChecked) {
      // 1. Vérifier si les événements sont déjà chargés (pour éviter de refetcher inutilement)
      const existingEvents = calendar
        .getEvents()
        .filter((ev) => ev.extendedProps.calendarId === holidayCalId);
      if (existingEvents.length > 0) return; // Déjà là

      try {
        // 2. Fetcher l'API
        const res = await fetch(
          "https://calendrier.api.gouv.fr/jours-feries/metropole.json"
        );
        if (!res.ok) throw new Error("Erreur récupération jours fériés");

        const data = await res.json();

        // 3. Convertir et ajouter au calendrier
        // L'API renvoie un objet : { "2025-01-01": "1er janvier", ... }
        const events = Object.entries(data).map(([date, name]) => ({
          id: `holiday-${date}`,
          title: name,
          start: date,
          allDay: true,
          backgroundColor: "#FF6B81", // Vert pour les jours fériés
          borderColor: "#FF6B81",
          textColor: "#fff",
          display: "block", // ou 'background' si on veut juste colorer la case
          extendedProps: {
            description: "Jour férié en France",
            calendarId: holidayCalId,
            event_role: "Viewer",
          },
          editable: false,
        }));

        events.forEach((ev) => calendar.addEvent(ev));
        showMessage("Jours fériés ajoutés", "success");
      } catch (err) {
        console.error(err);
        showMessage("Impossible de charger les jours fériés", "error");
        e.target.checked = false;
      }
    } else {
      // Supprimer les événements
      removeCalendarEvents(holidayCalId, calendar);
    }
  });

  leftDiv.appendChild(checkbox);

  const colorDiv = document.createElement("div");
  colorDiv.classList.add("calendar-color");
  colorDiv.style.background = "#FF6B81";
  leftDiv.appendChild(colorDiv);

  const titleDiv = document.createElement("div");
  titleDiv.classList.add("event-info2");
  const titleSpan = document.createElement("div");
  titleSpan.classList.add("event-title2");
  titleSpan.textContent = "Jours Fériés FR";
  titleDiv.appendChild(titleSpan);
  leftDiv.appendChild(titleDiv);

  calDiv.appendChild(leftDiv);

  calendarListDiv.appendChild(calDiv);
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
    allDaySlot: true, // pas de créneaux "toute la journée"
    slotEventOverlap: false, // interdit chevauchement visuel
    eventOverlap: false, // interdit drag & drop sur événements chevauchants
    eventOrder: "start,-duration", // tri par début, puis durée
    locale: "fr",
    themeSystem: "standard",
    nowIndicator: true,
    slotMinTime: "00:00:01",
    slotMaxTime: "23:59:59",
    slotDuration: "00:15:00",
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
    // ✅ Modifications pour prendre toute la hauteur
    height: "calc(100vh - 50px)",   // 100% de la fenêtre - hauteur navbar
    contentHeight: "calc(20vh - 10px)",
    expandRows: true,


    eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },

    // Événements dynamiques
    events: [],

    viewDidMount: function (viewInfo) {
      // ne scroller que pour les vues horaires (timeGridDay/timeGridWeek)
      const type = viewInfo.view.type;
      if (type.startsWith("timeGrid") || type === "dayGridDay") {
        setTimeout(() => {
          if (calendar.scrollToTime) {
            calendar.scrollToTime("06:00:00");
          } else {
            // fallback : scroll manuel si ancienne version
            const scroller = viewInfo.el.querySelector(
              ".fc-scroller, .fc-timegrid-slots"
            );
            if (scroller) {
              // calcule position approximative (hauteur par heure)
              const hourHeight = scroller.scrollHeight / 24;
              scroller.scrollTop = Math.floor(6 * hourHeight);
            }
          }
        }, 30);
      }
    },

    windowResize: function () {
      if (window.innerWidth < 500) {
        calendar.changeView("listWeek");
      } else {
        calendar.changeView("timeGridWeek");
      }
    },

    // appelé quand les dates/vues changent (sécurité supplémentaire)
    datesSet: function () {
      setTimeout(() => {
        if (calendar.scrollToTime) calendar.scrollToTime("06:00:00");
      }, 30);
    },

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
      // Stocker la date spécifique de l'instance cliquée
      const popup = document.getElementById("eventDetailsModal");
      if (popup) {
        popup.dataset.instanceDate = info.event.start.toISOString();
      }
      openEventDetailsPopup(info.event, "update");
    },

    selectable: true,
    selectMirror: true,

    select: function (info) {
      const viewType =
        (info.view && info.view.type) ||
        (calendar && calendar.view && calendar.view.type) ||
        "";
      if (viewType.startsWith("timeGrid") || viewType === "dayGridMonth") {
        const clickedDate = new Date(info.start);

        // Start = 00:00:00 du même jour
        const startOfDay = new Date(
          clickedDate.getFullYear(),
          clickedDate.getMonth(),
          clickedDate.getDate(),
          0,
          0,
          0
        );

        // End = 23:59:59 du même jour
        const endOfDay = new Date(
          clickedDate.getFullYear(),
          clickedDate.getMonth(),
          clickedDate.getDate(),
          23,
          59,
          59
        );

        openEventDetailsPopup(
          {
            start: info.start,
            end: info.end,
          },
          "add"
        );
      } else {
        openEventDetailsPopup(
          {
            start: info.start,
            end: info.end,
          },
          "add"
        );
      }
    },

    // Ajuste la couleur des événements en fonction du calendrier
    eventContent: function (arg) {
      const backgroundColor = arg.event.backgroundColor || "#ff9f1c";
      const textColor = "#fff";

      return {
        html: `<div class="fc-event-custom" style="background:${backgroundColor};color:${textColor};padding:2px 5px;border-radius:5px;"> ${arg.event.title} </div>`,
      };
    },
  });
  calendar.render();
  window.calendar = calendar;

  // --- Initialiser le calendrier des jours fériés ---
  initHolidayCalendar(calendar);

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

      // Appliquer le scroll aux deux listes
      renderCalendarListUI([
        document.getElementById("calendar-list"),
        document.getElementById("calendar-list-entrep"),
      ]);
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
          return showMessage(
            data.error || "Failed to import calendar.",
            "error"
          );
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
      const mode = document.getElementById("calendarType").value;
      const title = titleInput.value.trim();

      if (!title) return showMessage("Veuillez saisir un titre", "error");
      if (!mode) return showMessage("Veuillez sélectionner un type", "error");

      try {
        const res = await fetch("/user/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, mode }),
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
        cal.role = "Owner";
        // --- Création du nouvel élément calendrier ---
        createCalendarElement(cal, calendar);

        // Appliquer le scroll aux deux listes
        renderCalendarListUI([
          document.getElementById("calendar-list"),
          document.getElementById("calendar-list-entrep"),
        ]);
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
  const calendarId = editBtn.dataset.id;
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

// --- Menu Créer : ouvrir / fermer ---
const btnCreateMenu = document.getElementById("btnCreateMenu");
const createDropdown = document.getElementById("createDropdown");

btnCreateMenu.addEventListener("click", () => {
  createDropdown.classList.toggle("hidden");
});

// Fermer le menu si on clique à l’extérieur
document.addEventListener("click", (e) => {
  if (!e.target.closest(".create-wrapper")) {
    createDropdown.classList.add("hidden");
  }
});

document.addEventListener("click", (e) => {
  const allMenus = document.querySelectorAll(".menu");

  allMenus.forEach((menu) => {
    if (!e.target.closest(".menu-wrapper")) {
      menu.classList.remove("show");
    }
  });
});

/* ------------------------------------------------------------
    PARTAGE AGENDA
------------------------------------------------------------ */

function openSharePopup(calendarId, mode) {
  const modal = document.getElementById("shareCalendarModal");
  modal.classList.remove("hidden");
  modal.dataset.calendarId = calendarId;

  const modalContent = modal.querySelector(".modal-content");
  document.getElementById("shareEmailInput").value = "";
  document.getElementById("shareUserResults").innerHTML = "";
  const existingSelect = modalContent.querySelector("#shareRoleSelect");
  if (existingSelect) existingSelect.remove();
  if (mode === "entreprise") {
    const roleSelect = document.createElement("select");
    roleSelect.id = "shareRoleSelect";
    roleSelect.innerHTML = `
      <option value="Viewer">Viewer</option>
      <option value="Editor">Editor</option>
    `;
    modalContent.insertBefore(
      roleSelect,
      modal.querySelector("#btnCancelShare")
    );
  }
}

document.getElementById("btnCancelShare").addEventListener("click", () => {
  const modal = document.getElementById("shareCalendarModal");
  modal.classList.add("hidden");

  document.getElementById("shareUserResults").innerHTML = "";
  document.getElementById("shareEmailInput").value = "";
});

/* ------------------------------------------------------------
    AUTOCOMPLETION EMAIL
------------------------------------------------------------ */

const emailInput = document.getElementById("shareEmailInput");
const resultsBox = document.getElementById("shareUserResults");
let searchTimeout = null;

emailInput.addEventListener("input", () => {
  const query = emailInput.value.trim();
  clearTimeout(searchTimeout);

  if (query.length < 1) {
    resultsBox.innerHTML = "";
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        `/search?prefix=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await response.json();

      resultsBox.innerHTML = "";

      if (!data.users || data.users.length === 0) {
        resultsBox.innerHTML = "<p>Aucun utilisateur trouvé.</p>";
        return;
      }

      data.users.forEach((user) => {
        const div = document.createElement("div");
        div.classList.add("share-user-item");
        div.textContent = `${user.email} (${user.firstName} ${user.lastName})`;

        div.addEventListener("click", () => {
          emailInput.value = user.email;
          resultsBox.innerHTML = "";
        });

        resultsBox.appendChild(div);
      });
    } catch (error) {
      console.error("Erreur recherche :", error);
    }
  }, 200);
});

/* ------------------------------------------------------------
    CONFIRMATION DU PARTAGE
------------------------------------------------------------ */

document
  .getElementById("btnConfirmShare")
  .addEventListener("click", async () => {
    const email = emailInput.value;
    let role = "Viewer";
    const shareRoleSelect = document.getElementById("shareRoleSelect");

    if (shareRoleSelect) {
      role = shareRoleSelect.value;
    }

    const calendarId =
      document.getElementById("shareCalendarModal").dataset.calendarId;

    if (!email) {
      showMessage(
        "Veuillez sélectionner un utilisateur dans la liste.",
        "error"
      );
      return;
    }

    try {
      const res = await fetch("/calendar/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ calendarId, email, role }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("Calendrier partagé avec succès !", "success");
        document.getElementById("shareCalendarModal").classList.add("hidden");
      } else {
        showMessage(data.error, "error");
      }
    } catch (err) {
      console.error("Erreur fetch :", err);
      showMessage("Erreur lors du partage", "error");
    }
  });

const triToggle = document.getElementById("triToggle");
const toggleLabel = document.getElementById("toggleLabel");

const persoDiv = document.getElementById("calendar-list");
const entrepDiv = document.getElementById("calendar-list-entrep");
const event = document.querySelector("#evenement_a_venir");

const labels = ["Mes calendriers Personnels", "Mes calendriers Professionels"];

const mode = document.querySelector(".calendar-mode");

triToggle.addEventListener("click", () => {
  let state = parseInt(triToggle.dataset.state);

  state = (state + 1) % 2;
  triToggle.dataset.state = state;
  mode.textContent = labels[state];

  applyCalendarFilter(state);
});

function applyCalendarFilter(state) {
  switch (state) {
    case 0: // Personnel
      persoDiv.style.display = "block";
      entrepDiv.style.display = "none";
      event.style.display = "block";
      break;

    case 1: // Entreprise
      persoDiv.style.display = "none";
      entrepDiv.style.display = "block";
      event.style.display = "block";

      break;
  }
}

const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.getElementById("sidebarToggle");
const main = document.querySelector(".main-content");



const searchArea = document.getElementById('appointments_search');
const searchBtn = document.getElementById('mobileSearchBtn');

searchBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  searchArea.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (!searchArea.contains(e.target) && e.target !== searchBtn) {
    searchArea.classList.remove('active');
  }
});





