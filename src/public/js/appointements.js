const btnNewEvent = document.getElementById("btnNewEvent");
const eventModal = document.getElementById("eventModal");
const btnCancel = document.getElementById("btnCancel");
const eventForm = document.getElementById("eventForm");

function getEventItemById(rdv_id) {
  const parent = document.getElementById("upcomingEvents");
  if (!parent) return null;

  return parent.querySelector(`.event-item[data-id="${rdv_id}"]`);
}

function renderCalendarField(mode, calendarId = null) {
  const container = document.getElementById("calendarFieldContainer");

  if (!container) {
    console.error("Conteneur calendarFieldContainer introuvable");
    return;
  }

  // reset propre
  container.innerHTML = "";

  // ==== MODE EDIT ======================================================
  if (mode === "edit" && calendarId) {
    // On récupère le titre depuis le DOM
    let titleFound = null;

    const calendarContainers = [
      "#calendar-list",
      ".hidden-calendars",
      ".calendar-list-entrep",
    ];

    // Récupération de tous les éléments event-item2 présents dans ces conteneurs
    let items = [];

    calendarContainers.forEach((selector) => {
      const container = document.querySelector(selector);
      if (container) {
        items.push(...container.querySelectorAll(".event-item2"));
      }
    });
    items.forEach((item) => {
      if (item.dataset.id === calendarId) {
        titleFound = item.querySelector(".event-info2")?.textContent.trim();
      }
    });

    // Si pas trouvé
    if (!titleFound) {
      console.warn("Aucun titre trouvé pour l'id", calendarId);
      titleFound = "(Calendrier inconnu)";
    }

    // Construction du champ READONLY
    const label = document.createElement("label");
    label.textContent = "Calendrier concerné :";

    const text = document.createElement("div");
    text.classList.add("calendar-readonly");
    text.textContent = titleFound;

    // Hidden input pour l'id
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.id = "eventCalendar";
    hidden.value = calendarId;

    container.appendChild(label);
    container.appendChild(text);
    container.appendChild(hidden);

    return;
  }

  // MODE AJOUT ----------------------------------------------------------

  const label = document.createElement("label");
  label.textContent = "Choisir un calendrier";

  const select = document.createElement("select");
  select.id = "eventCalendar";
  select.required = true;

  select.innerHTML = `<option value="">Sélectionnez un calendrier...</option>`;

  container.appendChild(label);
  container.appendChild(select);

  // Récupération des calendriers visibles
  const listVisible = document.getElementById("calendar-list");
  const listVisible_entre = document.querySelector(".calendar-list-entrep");
  const listHidden = document.querySelector(".hidden-calendars");

  // Récupération des items
  const items = [
    ...listVisible.querySelectorAll(".event-item2"),
    ...listVisible_entre.querySelectorAll(".event-item2"),
    ...(listHidden ? listHidden.querySelectorAll(".event-item2") : []),
  ];

  items.forEach((item, index) => {
    const id = item.dataset.id;
    const title = item.querySelector(".event-info2")?.textContent.trim();

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = title;

    select.appendChild(opt);
  });
}

window.renderCalendarField = renderCalendarField;

/**
 * Crée et retourne une division pour un événement
 * @param {Object} evt - L'événement { _id, name, date_debut, date_fin, description }
 * @returns {HTMLDivElement} - La div construite
 */
function createEventItemDiv(evt) {
  const start = new Date(evt.date_debut);
  const end = new Date(evt.date_fin || evt.date_debut);

  const day = start.getDate().toString().padStart(2, "0");
  const month = start.toLocaleString("fr-FR", { month: "short" });
  const timeStart = start.toTimeString().slice(0, 5);
  const timeEnd = end.toTimeString().slice(0, 5);

  const div = document.createElement("div");
  div.className = "event-item hidden";
  div.dataset.id = evt._id;
  div.dataset.start = evt.date_debut;
  div.dataset.end = evt.date_fin || evt.date_debut;
  div.dataset.description = evt.description || "";
  div.dataset.calendarId = evt.calendar_id;

  div.innerHTML = `
    <div class="event-left">
      <div class="event-date">${day} ${month}</div>
      <div class="event-info">
        <div class="event-title">${evt.name}</div>
        <div class="event-time">${timeStart} – ${timeEnd}</div>
      </div>
    </div>
  `;

  const menu = document.createElement("div");
  menu.classList.add("menu", "hidden");

  const editBtn = document.createElement("button");
  editBtn.innerHTML = `<i class="fas fa-pen"></i> Modifier`;
  menu.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Supprimer`;
  menu.appendChild(deleteBtn);

  document.body.appendChild(menu);

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

  // Menu déroulant
  menu.classList.add("menu", "hidden");

  // Bouton modifier
  editBtn.classList.add("menu-edit");
  editBtn.dataset.id = evt._id;
  editBtn.innerHTML = `<i class="fas fa-pen"></i> Modifier`;
  menu.appendChild(editBtn);

  // Bouton supprimer
  deleteBtn.classList.add("menu-delete");
  deleteBtn.dataset.id = evt._id;
  deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Supprimer`;
  menu.appendChild(deleteBtn);

  // Bouton partager
  const shareBtn = document.createElement("button");
  shareBtn.classList.add("menu-share");
  shareBtn.dataset.id = evt._id;
  shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> Partager`;
  menu.appendChild(shareBtn);

  div.appendChild(menuWrapper);

  return div;
}

/**
 * Affiche les 5 premiers événements et cache le reste
 * @param {HTMLElement} [container] - Conteneur des événements. Par défaut #upcomingEvents
 */
function renderUpcomingEvents(
  container = document.getElementById("upcomingEvents")
) {
  if (!container) return;

  // Récupère tous les événements
  const events = Array.from(container.querySelectorAll(".event-item"));

  // Trie par date de début
  events.sort((a, b) => new Date(a.dataset.start) - new Date(b.dataset.start));

  // Affiche les 5 premiers, cache les autres
  events.forEach((evt, index) => {
    if (index < 5) {
      evt.classList.remove("hidden");
      container.appendChild(evt); // remet dans le bon ordre dans le DOM
    } else {
      evt.classList.add("hidden");
    }
  });
}

/**
 * Met à jour la liste des événements à l'écran après une action
 */
async function updateEventList({ type, eventData }) {
  const upcomingEvents = document.getElementById("upcomingEvents");
  if (!upcomingEvents) return;

  switch (type) {
    case "delete":
      if (!eventData?._id) return;

      const eventDiv = upcomingEvents.querySelector(
        `.event-item[data-id='${eventData._id}']`
      );
      if (eventDiv) {
        eventDiv.remove();
        // Remonte un événement caché si existant
        const hiddenEvent = upcomingEvents.querySelector(".event-item.hidden");
        if (hiddenEvent) hiddenEvent.classList.remove("hidden");
        else await fetchAppointments(window.getActiveCalendarIdsLocal());
      }
      break;

    case "update":
      if (!eventData) return;

      const rdv = eventData;
      const eventDivToUpdate = upcomingEvents.querySelector(
        `.event-item[data-id='${rdv._id}']`
      );
      if (eventDivToUpdate) {
        const start = new Date(rdv.date_debut);
        const end = new Date(rdv.date_fin || rdv.date_debut);

        const day = start.getDate().toString().padStart(2, "0");
        const month = start.toLocaleString("fr-FR", { month: "short" });
        const timeStart = start.toTimeString().slice(0, 5);
        const timeEnd = end.toTimeString().slice(0, 5);

        // Met à jour uniquement les champs existants
        const titleEl = eventDivToUpdate.querySelector(".event-title");
        const dateEl = eventDivToUpdate.querySelector(".event-date");
        const timeEl = eventDivToUpdate.querySelector(".event-time");

        if (titleEl) titleEl.textContent = rdv.name || titleEl.textContent;
        if (dateEl) dateEl.textContent = `${day} ${month}`;
        if (timeEl) timeEl.textContent = `${timeStart} – ${timeEnd}`;
      }
      break;

    case "add":
      if (!eventData) return;
      const newRdv = eventData;
      const newDate = new Date(newRdv.date_debut);

      // Récupère tous les événements (visibles + cachés)
      const allEvents = Array.from(
        upcomingEvents.querySelectorAll(".event-item")
      );

      if (allEvents.length > 0) {
        const dates = allEvents.map((evt) => new Date(evt.dataset.start));

        const maxDate = new Date(Math.max(...dates));

        // Si la date ne rentre pas dans l'intervalle → on ne l'ajoute pas
        const now = new Date();
        if (newDate < now || newDate > maxDate) {
          return;
        }
      }

      // Création du nouvel élément
      const div = createEventItemDiv(newRdv);
      div.classList.remove("hidden");

      // Insérer au bon endroit chronologiquement
      let inserted = false;
      for (let evt of allEvents) {
        const evtDate = new Date(evt.dataset.start);

        if (newDate < evtDate) {
          upcomingEvents.insertBefore(div, evt);
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        upcomingEvents.appendChild(div);
      }
      break;

    default:
      console.warn("Type d'action inconnu pour updateEventList");
  }

  // Trie et rend visible les 5 premiers
  renderUpcomingEvents();
}

// ==========================
// Popup nouvel événement
// ==========================

if (btnNewEvent && eventModal && btnCancel && eventForm) {
  btnNewEvent.addEventListener("click", () => {
    eventModal.classList.remove("hidden");
    renderCalendarField("add");
    eventModal.classList.remove("hidden");
    delete eventForm.dataset.editingId; // mode ajout
    eventForm.reset();
    // Remettre le bon titre
    eventModal.querySelector(".modal-title").textContent =
      "Créer un nouvel événement";
    eventModal.querySelector(".btn.btn-primary").textContent = "Créer";
  });
  eventModal.querySelector(".btn.btn-primary").classList.add("menu-edit");

  btnCancel.addEventListener("click", () => {
    eventModal.classList.add("hidden");
    eventForm.reset();
    delete eventForm.dataset.editingId;
  });

  eventModal.addEventListener("click", (e) => {
    if (e.target === eventModal) {
      eventModal.classList.add("hidden");
      eventForm.reset();
      delete eventForm.dataset.editingId;
    }
  });
}

// ==========================
// Ajout / Update RDV
// ==========================
eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const calendarId =
    document.getElementById("eventCalendar")?.value ||
    document.getElementById("eventCalendar")?.value ||
    null;
  console.log("cal ia envoyer : " + calendarId);
  const id_rdv = eventForm.dataset.editingId; // si existe → update
  
  // Si on édite une instance spécifique d'une récurrence
  const instanceDate = eventForm.dataset.instanceDate;

  // Récupération des données de récurrence
  const isRecurrent = document.getElementById("toggleRecurrent").checked;
  let recurrenceData = [];
  if (isRecurrent) {
    recurrenceData = [{
      type: document.getElementById("recurrenceFreq").value,
      date_fin: document.getElementById("recurrenceEnd").value || null
    }];
  }

  const rdv = {
    name: document.getElementById("eventTitle").value.trim(),
    date_debut: `${document.getElementById("eventDateStart").value}T${
      document.getElementById("eventTimeStart").value
    }`,
    date_fin: `${document.getElementById("eventDateEnd").value}T${
      document.getElementById("eventTimeEnd").value
    }`,
    description: document.getElementById("eventComment").value.trim(),
    calendarId: calendarId,
    isRecurent: recurrenceData,
    date_to_exclude: instanceDate || null // Envoi de la date originale pour exclusion si nécessaire
  };
  if (id_rdv) {
    try {
      rdv.id_rdv = id_rdv;
      const res = await fetch("/UpdateAppointment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rdv),
      });

      const updatedData = await res.json();
      console.log(updatedData);

      if (!res.ok)
        throw new Error(updatedData.message || "Erreur lors de l’opération");

      // Mise à jour de la liste et du calendrier
      if (instanceDate) {
          // Si on a créé une exception, il faut recharger le calendrier complet
          // pour voir l'ancien event (avec date exclue) ET le nouveau
          const activeIds = window.getActiveCalendarIdsLocal();
          const calRes = await fetch(`/user/agenda`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ calendarIds: activeIds }),
          });
          const calData = await calRes.json();
          window.updateCalendarView(calData.calendars, window.calendar);
          // Aussi rafraichir la liste latérale
          window.fetchAppointments(activeIds);
      } else {
          updateEventList({
            type: "update",
            eventData: updatedData.rdv,
          });

          window.updateCalendar({
            type: "update",
            eventData: updatedData.rdv,
          });
      }

      showMessage("Rendez-vous modifié avec succès", "success");
      eventModal.classList.add("hidden");
      delete eventForm.dataset.editingId;
      delete eventForm.dataset.instanceDate;
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Erreur lors de l’opération", "error");
    }
  } else {
    // Cas ajout
    const res = await fetch("http://localhost:3000/appointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(rdv),
    });

    // Si erreur serveur
    if (!res.ok) {
      const error = await res.json();
      showMessage(
        error.error || "Erreur lors de l'ajout du rendez-vous",
        "error"
      );
      return;
    }

    // Récupération de la réponse
    const insertedAppointment = await res.json();
    // Vérifier que le rdv existe dans la réponse
    if (!insertedAppointment || !insertedAppointment.rdv) {
      showMessage("Réponse du serveur invalide", "error");
      return;
    }

    const newRdv = insertedAppointment.rdv;
    newRdv.calendar_id = calendarId;

    // Mise à jour de la liste des rendez-vous
    updateEventList({
      type: "add",
      eventData: newRdv,
    });
    // add cal_id active fetch

    // Mise à jour du calendrier
    window.updateCalendar({
      type: "add",
      eventData: newRdv,
    });

    showMessage("Rendez-vous ajouté avec succès", "success");
    eventModal.classList.add("hidden");
    delete eventForm.dataset.editingId;
  }
});

// Gestion de l'affichage des options de récurrence
const toggleRecurrent = document.getElementById("toggleRecurrent");
const recurrentOptions = document.getElementById("recurrentOptions");
if (toggleRecurrent && recurrentOptions) {
  toggleRecurrent.addEventListener("change", () => {
    if (toggleRecurrent.checked) {
      recurrentOptions.classList.remove("hidden");
    } else {
      recurrentOptions.classList.add("hidden");
    }
  });
}

// ==========================
// Liste RDV
// ==========================

async function fetchAppointments(calendarIds) {
  const upcomingEvents = document.getElementById("upcomingEvents");
  if (!upcomingEvents) return;

  try {
    const res = await fetch("/appointments/multiple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ calendarIds }),
    });

    upcomingEvents.innerHTML = "";
    const data = await res.json();

    // Vérification si null ou vide
    if (!data || (Array.isArray(data) && data.length === 0)) {
    } else {
    }
    console.log("data : " + data);
    data.forEach((evt) => {
      const div = createEventItemDiv(evt);
      upcomingEvents.appendChild(div);
    });

    // Affiche les 5 premiers événements
    renderUpcomingEvents();
  } catch (err) {
    console.error(err);
    upcomingEvents.innerHTML = "<p>Erreur de chargement des rendez-vous.</p>";
  }
}

// Rendre la fonction accessible depuis appointments.js etc
window.fetchAppointments = fetchAppointments;

// ==========================
// Popup édition + suppression
// ==========================
document.addEventListener("click", async (e) => {
  const btnDelete = e.target.closest(".menu-delete");

    if (btnDelete) {
      const id_rdv = btnDelete.dataset.id;
      const confirmed = await showConfirm(
        "Voulez-vous vraiment placer ce rendez-vous dans la corbeille ?"
      );
      if (!confirmed) return;
      try {
        const res = await fetch(`/delete/appointment/${id_rdv}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          showMessage(errorData.message || "Erreur lors de la suppression", "error");
          return;
        }
        // Met à jour la liste des événements côté frontend
        updateEventList({ type: "delete", eventData: { _id: id_rdv } });
        // Pour la suppression
        updateCalendar({ type: "delete", eventData: { _id: id_rdv } });
        showMessage("Rendez-vous placé dans la corbeille.", "success");
      } catch (err) {
        console.error(err);
        showMessage("Erreur lors de la suppression", "error");
        return;
      }
  }

  const btnEdit = e.target.closest(".menu-edit");
  if (btnEdit) {
    const eventItem = getEventItemById(btnEdit.dataset.id);
    if (!eventItem) return;

    const rdvId = eventItem.dataset.id;
    const rdv = {
      _id: rdvId,
      name: eventItem.querySelector(".event-title").textContent,
      description: eventItem.dataset.description || "",
      date_debut: eventItem.dataset.start,
      date_fin: eventItem.dataset.end,
      calendar_id: eventItem.dataset.calendarId,
    };

    renderCalendarField("edit", rdv.calendar_id);
    eventModal.classList.remove("hidden");
    eventForm.dataset.editingId = rdv._id;
    eventForm.dataset.cal_id = rdv.calendar_id;
    console.log( "cal id " + rdv.calendar_id);
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
  }
});

function findCalendarOfAppointment(rdvId) {
  if (!window.allUserCalendars) return null;

  for (const cal of window.allUserCalendars) {
    if (Array.isArray(cal.appointments)) {
      const match = cal.appointments.find((a) => a._id === rdvId);
      if (match) {
        return cal._id; // retourne l'ID du calendrier qui contient ce rdv
      }
    }
  }

  return null;
}

document.addEventListener("deleteAppointmentFromPopup", async (e) => {
  const id_rdv = e.detail.id;
  const btnDelete = document.querySelector(`.btn-delete[data-id="${id_rdv}"]`);
  const instanceDate = btnDelete ? btnDelete.dataset.instanceDate : null;

  // Si instanceDate existe, c'est une récurrence
  if (instanceDate) {
      // Afficher le modal de choix
      const recurModal = document.getElementById("recurrenceDeleteModal");
      recurModal.classList.remove("hidden");
      
      const btnOne = document.getElementById("btnDeleteOne");
      const btnSeries = document.getElementById("btnDeleteSeries");
      const btnCancel = document.getElementById("btnCancelRecurDelete");
      
      // Clean previous listeners to avoid duplicates (crude but effective for now)
      const newBtnOne = btnOne.cloneNode(true);
      btnOne.parentNode.replaceChild(newBtnOne, btnOne);
      const newBtnSeries = btnSeries.cloneNode(true);
      btnSeries.parentNode.replaceChild(newBtnSeries, btnSeries);
      const newBtnCancel = btnCancel.cloneNode(true);
      btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
      
      newBtnCancel.addEventListener("click", () => recurModal.classList.add("hidden"));
      
      // Supprimer juste l'occurrence
      newBtnOne.addEventListener("click", () => {
          recurModal.classList.add("hidden");
          performDelete(id_rdv, instanceDate);
      });
      
      // Supprimer toute la série
      newBtnSeries.addEventListener("click", () => {
          recurModal.classList.add("hidden");
          performDelete(id_rdv, null); // null = série complète
      });
      
      return;
  }

  // Comportement normal
  const confirmed = await showConfirm(
    "Voulez-vous vraiment placer ce rendez-vous dans la corbeille ?"
  );
  if (!confirmed) return;
  
  performDelete(id_rdv, null);
});

async function performDelete(id_rdv, date_to_exclude) {
  try {
    const body = {};
    if (date_to_exclude) body.date_to_exclude = date_to_exclude;
    
    const res = await fetch(`/delete/appointment/${id_rdv}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        showMessage(data.message || "Erreur lors de la suppression", "error");
        return;
    }

    updateEventList({
      type: "delete",
      eventData: { _id: id_rdv },
    });
    // Pour la suppression
    // Si exclusion, on doit re-fetch car le RDV n'est pas vraiment supprimé, juste caché une date
    if (date_to_exclude) {
         // Recharger le calendrier pour voir la disparition de l'occurrence
         // C'est le plus simple pour rrule
         window.fetchAppointments(window.getActiveCalendarIdsLocal());
         // Rafraichir view fullcalendar
         // On peut juste re-fetcher tout
         const activeIds = window.getActiveCalendarIdsLocal();
          const calRes = await fetch(`/user/agenda`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ calendarIds: activeIds }),
          });
          const calData = await calRes.json();
          window.updateCalendarView(calData.calendars, window.calendar);

    } else {
        updateCalendar({
          type: "delete",
          eventData: { _id: id_rdv },
        });
    }

    showMessage("Rendez-vous placé dans la corbeille.", "success");
    
  } catch (err) {
    console.error(err);
    showMessage("Erreur lors de la suppression", "error");
  }
}

// ======================chercher un rdv ================

const input = document.getElementById("appointments_name");
const resultsList = document.getElementById("appointments_results");

let timeout = null;

// 🔍 Recherche quand on tape
input.addEventListener("input", () => {
  const text = input.value.trim();

  // vider si trop court
  if (text.length < 2) {
    resultsList.innerHTML = "";
    return;
  }

  // anti-spam requêtes
  clearTimeout(timeout);
  timeout = setTimeout(() => searchAppointments(text), 300);
});

// 📡 Appel API
async function searchAppointments(query) {
  try {
    const response = await fetch("http://localhost:3000/searchAppointment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appointments_name: query }),
    });

    const data = await response.json();

    if (!data.appointments) {
      resultsList.innerHTML = "";
      return;
    }

    displayResults(data.appointments);
  } catch (err) {}
}

// 📝 Affichage des suggestions
function displayResults(appointments) {
  resultsList.innerHTML = "";

  appointments.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.appointment.name;
    li.classList.add("suggestion-item");

    li.addEventListener("click", () => {
      const rdv = item.appointment;
      // 🔥 Ouvrir ton popup
      eventModal.classList.remove("hidden");
      eventForm.dataset.editingId = rdv._id;
      // Modifier le titre
      eventModal.querySelector(".modal-title").textContent =
        "inforamtion du RDV";
      eventModal
        .querySelector(".btn.btn-primary")
        .classList.add("modifier1", "hidden");
      //eventModal.querySelector(".btn.btn-primary").textContent = "Modifier";
      // Convertir les dates
      const start = new Date(rdv.date_debut);
      const end = new Date(rdv.date_fin);

      // Remplir les champs
      document.getElementById("eventTitle").value = rdv.name || "";
      document.getElementById("eventComment").value = rdv.description || "";
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
      // fermer la liste des suggestions
      resultsList.innerHTML = "";
    });
    resultsList.appendChild(li);
  });
}

// ==========================
// PARTAGE RDV — OUVERTURE POPUP
// ==========================
document.addEventListener("click", async (e) => {
  const btnShare = e.target.closest(".menu-share");
  if (!btnShare) return;

  document.getElementById("shareAppointmentModal").dataset.rdvId =
    btnShare.dataset.id;

  document.getElementById("shareRdvEmailInput").value = "";
  document.getElementById("shareRdvUserResults").innerHTML = "";

  document.getElementById("shareAppointmentModal").classList.remove("hidden");
});
// ==========================
// PARTAGE RDV — SUGGESTION EMAIL
// ==========================
const shareRdvEmailInput = document.getElementById("shareRdvEmailInput");
const shareRdvResults = document.getElementById("shareRdvUserResults");
let rdvSearchTimeout = null;

shareRdvEmailInput.addEventListener("input", () => {
  const query = shareRdvEmailInput.value.trim();
  clearTimeout(rdvSearchTimeout);

  if (query.length < 1) {
    shareRdvResults.innerHTML = "";
    return;
  }

  rdvSearchTimeout = setTimeout(async () => {
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

      shareRdvResults.innerHTML = "";

      if (!data.users || data.users.length === 0) {
        shareRdvResults.innerHTML = "<p>Aucun utilisateur trouvé.</p>";
        return;
      }

      data.users.forEach((user) => {
        const div = document.createElement("div");
        div.classList.add("share-user-item");
        div.textContent = `${user.email} (${user.firstName} ${user.lastName})`;

        div.addEventListener("click", () => {
          shareRdvEmailInput.value = user.email;
          shareRdvResults.innerHTML = "";
        });

        shareRdvResults.appendChild(div);
      });
    } catch (error) {
      console.error("Erreur recherche RDV :", error);
    }
  }, 200);
});

// ==========================
// PARTAGE RDV — ENVOI
// ==========================
document
  .getElementById("btnSendShareRdv")
  .addEventListener("click", async () => {
    const email = shareRdvEmailInput.value;
    const rdvId = document.getElementById("shareAppointmentModal").dataset
      .rdvId;

    if (!email) {
      showMessage("Choisissez un utilisateur dans la liste", "error");
      return;
    }

    // Récupération directe via FullCalendar
    const fcEvent = calendar.getEventById(rdvId);

    if (!fcEvent) {
      showMessage("Rendez-vous introuvable", "error");
      return;
    }

    // Construction de l’objet rendez-vous
    const appointment = {
      _id: rdvId,
      name: fcEvent.title,
      date_debut: fcEvent.start.toISOString(),
      date_fin: fcEvent.end ? fcEvent.end.toISOString() : null,
      description: fcEvent.extendedProps.description || "",
    };

    const res = await fetch("/shareAppointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, appointment }),
    });

    const data = await res.json();

    if (data.success) {
      showMessage("Rendez-vous partagé !", "success");
      document.getElementById("shareAppointmentModal").classList.add("hidden");
    } else {
      showMessage("Erreur lors du partage", "error");
    }
  });

document.getElementById("btnCancelShareRdv").addEventListener("click", () => {
  document.getElementById("shareAppointmentModal").classList.add("hidden");
});
