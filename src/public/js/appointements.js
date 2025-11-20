const btnNewEvent = document.getElementById("btnNewEvent");
const eventModal = document.getElementById("eventModal");
const btnCancel = document.getElementById("btnCancel");
const eventForm = document.getElementById("eventForm");

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

  div.innerHTML = `
    <div class="event-left">
      <div class="event-date">${day} ${month}</div>
      <div class="event-info">
        <div class="event-title">${evt.name}</div>
        <div class="event-time">${timeStart} – ${timeEnd}</div>
      </div>
    </div>
    <div class="menu-wrapper">
      <button class="dots-btn"><i class="fas fa-ellipsis-vertical"></i></button>
      <div class="menu">
        <button class="menu-edit" data-id="${evt._id}"><i class="fas fa-pen"></i> Modifier</button>
        <button class="menu-delete" data-id="${evt._id}"><i class="fas fa-trash"></i> Supprimer</button>
        <button class="menu-share" data-id="${evt._id}"><i class="fas fa-share-alt"></i> Partager</button>
      </div>
    </div>
  `;

  // Gestion du clic pour afficher / cacher le menu
  const dotsBtn = div.querySelector(".dots-btn");
  const menu = div.querySelector(".menu");
  dotsBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // évite la fermeture immédiate
    menu.classList.toggle("show");
  });

  // Fermer le menu si clic ailleurs
  document.addEventListener("click", () => {
    menu.classList.remove("show");
  });

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
        else await fetchAppointments(getActiveCalendarIdsLocal());
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
    delete eventForm.dataset.editingId; // mode ajout
    eventForm.reset();
    // Remettre le bon titre
    eventModal.querySelector(".modal-title").textContent =
      "Créer un nouvel événement";
    eventModal.querySelector(".btn.btn-primary").textContent = "Créer";
  });

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
// Ajout / Update / partage RDV
// ==========================
eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const calendarId = getActiveCalendarIdsLocal()[0];
  const id_rdv = eventForm.dataset.editingId; // si existe → update
  const rdv = {
    name: document.getElementById("eventTitle").value.trim(),
    date_debut: `${document.getElementById("eventDateStart").value}T${
      document.getElementById("eventTimeStart").value
    }`,
    date_fin: `${document.getElementById("eventDateEnd").value}T${
      document.getElementById("eventTimeEnd").value
    }`,
    description: document.getElementById("eventComment").value.trim(),
    calendarId,
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
      if (!res.ok)
        throw new Error(updatedData.message || "Erreur lors de l’opération");

      // Mise à jour de la liste et du calendrier
      updateEventList({
        type: "update",
        eventData: updatedData.rdv,
      });

      window.updateCalendar({
        type: "update",
        eventData: updatedData.rdv,
      });

      showMessage("Rendez-vous modifié avec succès", "success");
      eventModal.classList.add("hidden");
      delete eventForm.dataset.editingId;
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

    // Mise à jour de la liste des rendez-vous
    updateEventList({
      type: "add",
      eventData: newRdv,
    });

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
    const data = await res.json();

    upcomingEvents.innerHTML = "";

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
document
  .getElementById("upcomingEvents")
  .addEventListener("click", async (e) => {
    const btnDelete = e.target.closest(".menu-delete");
    const eventItem = e.target.closest(".event-item");
    if (!eventItem) return;

    if (btnDelete) {
      const id_rdv = btnDelete.dataset.id;
      const confirmed = await showConfirm(
        "Voulez-vous vraiment supprimer ce rendez-vous ?"
      );
      if (!confirmed) return;

      try {
        const res = await fetch(`http://localhost:3000/deletAppointment`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id_rdv }),
        });

        if (!res.ok) {
          showMessage("Erreur lors de la suppression", "error");
          return;
        }

        // Met à jour la liste des événements côté frontend
        updateEventList({
          type: "delete",
          eventData: { _id: id_rdv },
        });
        // Pour la suppression
        updateCalendar({
          type: "delete",
          eventData: { _id: id_rdv }, // juste l'ID suffit pour trouver l'événement
        });

        showMessage("Rendez-vous supprimé", "success");
      } catch (err) {
        console.error(err);
        showMessage("Erreur lors de la suppression", "error");
      }
    }

    const btnEdit = e.target.closest(".menu-edit");
    if (btnEdit) {
      const eventItem = btnEdit.closest(".event-item");

      const rdv = {
        _id: eventItem.querySelector(".menu-edit").getAttribute("data-id"),
        name: eventItem.querySelector(".event-title").textContent,
        description: eventItem.dataset.description || "",
        date_debut: eventItem.dataset.start,
        date_fin: eventItem.dataset.end,
      };
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
    }
  });

document.addEventListener("deleteAppointmentFromPopup", async (e) => {
  const id_rdv = e.detail.id;

  const confirmed = await showConfirm(
    "Voulez-vous vraiment supprimer ce rendez-vous ?"
  );
  if (!confirmed) return;

  try {
    const res = await fetch("/deletAppointment", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_rdv }),
    });

    if (!res.ok) {
      showMessage("Erreur lors de la suppression", "error");
      return;
    }

    updateEventList({
      type: "delete",
      eventData: { _id: id_rdv },
    });
    // Pour la suppression
    updateCalendar({
      type: "delete",
      eventData: { _id: id_rdv },
    });

    showMessage("Rendez-vous supprimé", "success");
  } catch (err) {
    console.error(err);
    showMessage("Erreur lors de la suppression", "error");
  }
});
// ==========================
// PARTAGE RDV — OUVERTURE POPUP
// ==========================
document.getElementById("upcomingEvents").addEventListener("click", (e) => {
  const btnShare = e.target.closest(".menu-share");
  if (!btnShare) return;

  const rdvId = btnShare.dataset.id;
  document.getElementById("shareAppointmentModal").dataset.rdvId = rdvId;

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
        div.dataset.userId = user._id;

        div.addEventListener("click", () => {
          shareRdvEmailInput.value = user.email;
          shareRdvEmailInput.dataset.userId = user._id;
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
    const receiverId = shareRdvEmailInput.dataset.userId;
    const rdvId = document.getElementById("shareAppointmentModal").dataset
      .rdvId;

    if (!receiverId) {
      showMessage("Choisissez un utilisateur dans la liste", "error");
      return;
    }

    const rdvDiv = document.querySelector(`.event-item[data-id='${rdvId}']`);
    const appointment = {
      _id: rdvId,
      name: rdvDiv.querySelector(".event-title").textContent,
      date_debut: rdvDiv.dataset.start,
      date_fin: rdvDiv.dataset.end,
      description: rdvDiv.dataset.description,
    };

    const res = await fetch("/shareAppointment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId,
        appointment,
      }),
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
