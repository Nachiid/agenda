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

// ==========================
// Observer pour récupérer le calendarId
// ==========================
const observer = new MutationObserver((mutations, obs) => {
  const calendarTitle = document.querySelector(".calendar-title");
  if (calendarTitle) {
    const calendarId = getActiveCalendarIdsLocal()[0];
    console.log("✅ calendarId récupéré dynamiquement :", calendarId);
    fetchAppointments(calendarId);
    obs.disconnect();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

document.addEventListener("DOMContentLoaded", () => {
  const interval = setInterval(() => {
    const calendarTitle = document.querySelector(".calendar-title");
    if (calendarTitle) {
      fetchAppointments(getActiveCalendarIdsLocal()[0]);
      clearInterval(interval);
    }
  }, 100);
});

// ==========================
// Popup nouvel événement
// ==========================
const btnNewEvent = document.getElementById("btnNewEvent");
const eventModal = document.getElementById("eventModal");
const btnCancel = document.getElementById("btnCancel");
const eventForm = document.getElementById("eventForm");

if (btnNewEvent && eventModal && btnCancel && eventForm) {
  btnNewEvent.addEventListener("click", () => {
    eventModal.classList.remove("hidden");
    delete eventForm.dataset.editingId; // mode ajout
    eventForm.reset();
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
// Ajout / Update RDV
// ==========================
// ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const calendarId = getActiveCalendarIdsLocal()[0];
  if (!calendarId) {
    alert(
      "Impossible d’ajouter le rendez-vous : aucun calendrier sélectionné."
    );
    return;
  }

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

  try {
    let res;
    if (id_rdv) {
      rdv.id_rdv = id_rdv;
      res = await fetch("http://localhost:5000/UpdateAppointment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rdv),
      });
    } else {
      // erreur cas impossible -> return; ? avoir apres le merge
      res = await fetch("http://localhost:5000/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rdv),
      });
    }
    const data = await res.json();
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Erreur lors de l’opération");
    }

    //a revoir apres merge pour les afficher dans full calendar avec ecouteur agendas - apres merge

    // Pas besoin de faire un fetch, data doit contenir le nouveau rdv et ses données -> insertion direct dans les divisions

    //affichage max 5 evenement a gerer apres le merge ( j'ai deja le code de ca ) - - apres merge

    alert(calendarId);
    fetchAppointments(calendarId);
    eventForm.reset();
    eventModal.classList.add("hidden");
    delete eventForm.dataset.editingId;

    window.location.reload();

    showMessage(id_rdv, "succes");
  } catch (err) {
    showMessage("Erreur lors de l’opération", "error");
    
  }
});

// ==========================
// Liste RDV
// ==========================


async function fetchAppointments(calendarIds) {
  const upcomingEvents = document.getElementById("upcomingEvents");
  try {
    const res = await fetch('/appointments/multiple', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ calendarIds })
    });
    const data = await res.json();
    upcomingEvents.innerHTML = "";

    data.forEach((evt) => {
      const start = new Date(evt.date_debut);
      const end = new Date(evt.date_fin || evt.date_debut);

      const day = start.getDate().toString().padStart(2, "0");
      const month = start.toLocaleString("fr-FR", { month: "short" });
      const timeStart = start.toTimeString().slice(0, 5);
      const timeEnd = end.toTimeString().slice(0, 5);
      const div = document.createElement("div");
      div.className = "event-item";
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
                <button class="btn-icon delete-btn" title="Supprimer" data-id="${evt._id}">🗑️</button>
            `;
      upcomingEvents.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    upcomingEvents.innerHTML = "<p>Erreur de chargement des rendez-vous.</p>";
  }
}

// ==========================
// Popup édition + suppression
// ==========================
document.getElementById("upcomingEvents").addEventListener("click", (e) => {
  const btnDelete = e.target.closest(".delete-btn");
  const eventItem = e.target.closest(".event-item");
  if (!eventItem) return;

  if (btnDelete) {
    // Suppression
    const id_rdv = btnDelete.getAttribute("data-id");
    if (!confirm("Voulez-vous vraiment supprimer ce rendez-vous ?")) return;

    fetch(`http://localhost:5000/deletAppointment`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_rdv }),
    })
      .then((res) => {
        if (res.ok) {
          btnDelete.closest(".event-item").remove();
          // alert 
          showToast("✅ Rendez-vous supprimé", "success");
          showMessage("✅ Rendez-vous supprimé", "success");

        } else alert("Erreur lors de la suppression");
      })
      .catch((err) => {
        console.error(err);
        alert("Erreur lors de la suppression");
      });
    window.location.reload();
    return;
  }

  // Edition
  const rdv = {
    _id: eventItem.querySelector(".delete-btn").getAttribute("data-id"),
    name: eventItem.querySelector(".event-title").textContent,
    description: eventItem.dataset.description || "",
    date_debut: eventItem.dataset.start,
    date_fin: eventItem.dataset.end,
  };

  // Ouvrir le popup
  eventModal.classList.remove("hidden");
  eventForm.dataset.editingId = rdv._id;

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
});
