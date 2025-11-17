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


if(btnNewEvent && eventModal && btnCancel && eventForm) {
    btnNewEvent.addEventListener("click", () => {
    eventModal.classList.remove("hidden");
    delete eventForm.dataset.editingId; // mode ajout
    eventForm.reset();
      // Remettre le bon titre
  eventModal.querySelector(".modal-title").textContent = "Créer un nouvel événement";
  });

  btnCancel.addEventListener("click", () => {
    eventModal.classList.add("hidden");
    eventForm.reset();
    delete eventForm.dataset.editingId;
  });

  eventModal.addEventListener("click", (e) => {
    if (e.target === eventModal) {
      console.log("hi3")
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

  const calendarId = getActiveCalendarIdsLocal()[0];
  const id_rdv = eventForm.dataset.editingId; // si existe → update
  const rdv = {
    name: document.getElementById("eventTitle").value.trim(),
    date_debut: `${document.getElementById("eventDateStart").value}T${ document.getElementById("eventTimeStart").value }`,
    date_fin: `${document.getElementById("eventDateEnd").value}T${ document.getElementById("eventTimeEnd").value}`,
    description: document.getElementById("eventComment").value.trim(),
    calendarId,
  };
  try {
    let res;
    if(id_rdv){
      rdv.id_rdv = id_rdv;
      res = await fetch("http://localhost:3000/UpdateAppointment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rdv),
      });
    }else{
        res = await fetch("http://localhost:3000/appointment", {
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
    console.log("ID récupéré depuis localStorage =", calendarId);

    fetchAppointments(calendarId);
    document.dispatchEvent(new CustomEvent("appointmentsUpdated"));
    eventForm.reset();
    eventModal.classList.add("hidden");
    delete eventForm.dataset.editingId;
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

    // garder SEULEMENT les 5 premiers rdv
    const firstFive = data.slice(0, 5);

    upcomingEvents.innerHTML = "";

    firstFive.forEach((evt) => {
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
                <div class="menu-wrapper">
                  <button class="dots-btn">⋮</button>
                  <div class="menu hidden">
                    <button class="menu-edit btn-icon delete-btn" data-id="${evt._id}">✏️ Modifier</button>
                    <button class="menu-delete btn-icon delete-btn" data-id="${evt._id}">🗑️ Supprimer</button>
                  </div>
                </div>`;

            //<button class="btn-icon delete-btn" title="Supprimer" data-id="${evt._id}">🗑️</button>
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
document.getElementById("upcomingEvents").addEventListener("click", async (e) => {
  //const btnDelete = e.target.closest(".delete-btn");
  const btnDelete = e.target.closest(".menu-delete");
  const eventItem = e.target.closest(".event-item");
  if (!eventItem) return;

  if (btnDelete) {
    // Suppression
    const id_rdv = btnDelete.getAttribute("data-id");
    const confirmed = await showConfirm("Voulez-vous vraiment supprimer ce rendez-vous ?");
    if (!confirmed) return;


    fetch(`http://localhost:3000/deletAppointment`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id_rdv }),
    })
      .then((res) => {
        if (res.ok) {

          // ✔️ Recharge les 5 prochains RDV
          const calendarIds = getActiveCalendarIdsLocal()[0]; // tu l'as déjà
          fetchAppointments(calendarIds);
          showMessage("✅ Rendez-vous supprimé", "success");

        }else {showMessage("Erreur lors de la suppression","error");}
      })
      .catch((err) => {
        console.error(err);
        alert("Erreur lors de la suppression");
      });
    return;
  }

  const btnEdit = e.target.closest(".menu-edit");

    if (btnEdit) {
    const eventItem = btnEdit.closest(".event-item");

const rdv = {
  _id: eventItem.querySelector(".delete-btn").getAttribute("data-id"),
  name: eventItem.querySelector(".event-title").textContent,
  description: eventItem.dataset.description || "",
  date_debut: eventItem.dataset.start,
  date_fin: eventItem.dataset.end,
};
  eventModal.classList.remove("hidden");
  eventForm.dataset.editingId = rdv._id;

  // Modifier le titre DU popup ouvert
  eventModal.querySelector(".modal-title").textContent = "Modifier le RDV";
  const start = new Date(rdv.date_debut);
  const end = new Date(rdv.date_fin);

  document.getElementById("eventTitle").value = rdv.name;
  document.getElementById("eventComment").value = rdv.description;
  document.getElementById("eventDateStart").value = start.toISOString().slice(0, 10);
  document.getElementById("eventTimeStart").value = start.toTimeString().slice(0, 5);
  document.getElementById("eventDateEnd").value = end.toISOString().slice(0, 10);
  document.getElementById("eventTimeEnd").value = end.toTimeString().slice(0, 5);


}
});

const upcoming = document.getElementById("upcomingEvents");

upcoming.addEventListener("mouseover", (e) => {
    const wrapper = e.target.closest(".menu-wrapper");
    if (wrapper) {
        const menu = wrapper.querySelector(".menu");
        menu.classList.remove("hidden");
    }
});

upcoming.addEventListener("mouseout", (e) => {
    const wrapper = e.target.closest(".menu-wrapper");
    if (wrapper && !wrapper.contains(e.relatedTarget)) {
        const menu = wrapper.querySelector(".menu");
        menu.classList.add("hidden");
    }
});
