// Initialisation de la page d'accueil avec les données de l'utilisateur
document.addEventListener('DOMContentLoaded', async function () {

    // === Initialisation du calendrier ===
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: { 
            left: 'prev,next today', 
            center: 'title', 
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' 
        },
        navLinks: true,
        selectable: true,
        editable: true,
        events: []
    });
    calendar.render();

    // --- Charger les calendriers de l'utilisateur ---
    try {
        const res = await fetch('/user/agenda', { credentials: 'include' });
        if (!res.ok) throw new Error('Erreur récupération calendrier');
        const data = await res.json();
        const calendarData = data.calendar;

        if (calendarData) {
            const titleDiv = document.querySelector('.calendar-title');
            if (titleDiv) {
                titleDiv.textContent = calendarData.title;
                titleDiv.dataset.calendarId = calendarData._id;
            }

            const events = calendarData.appointments.map(r => ({
                id: r._id,
                title: r.name,
                start: r.date_debut,
                end: r.date_fin,
                color: calendarData.color,
                extendedProps: { description: r.description || '' }
            }));

            events.forEach(ev => calendar.addEvent(ev));
        }

        const allRes = await fetch('/user/calendars', { credentials: 'include' });
        if (!allRes.ok) throw new Error('Erreur récupération des calendriers');
        const allData = await allRes.json();

        const listVisible = document.getElementById('calendarVisible');
        const listHidden = document.getElementById('calendarHidden');
        const wrapperHidden = document.getElementById('calendarHiddenWrapper');

        if (listVisible && listHidden && wrapperHidden) {
            listVisible.innerHTML = '';
            listHidden.innerHTML = '';

            allData.calendars.forEach((cal, i) => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('calendar-item');

                const label = document.createElement('label');
                label.classList.add('calendar-option');
                label.innerHTML = `
                    <input type="checkbox" ${cal._id === calendarData._id ? 'checked' : ''} value="${cal._id}">
                    <span class="calendar-color" style="background:${cal.color}"></span>
                    <span>${cal.title}</span>
                `;

                wrapper.appendChild(label);

                if (allData.calendars.length > 1) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('btn-delete-calendar');
                    deleteBtn.value = cal._id;
                    deleteBtn.title = 'Supprimer';
                    deleteBtn.innerHTML = '🗑️';
                    wrapper.appendChild(deleteBtn);
                }

                if (i < 4) listVisible.appendChild(wrapper);
                else listHidden.appendChild(wrapper);
            });

            if (allData.calendars.length <= 4) wrapperHidden.style.display = 'none';
        }

    } catch (err) {
        console.error(err);
        alert('Impossible de charger votre calendrier');
    }

    // --- Suppression d’un calendrier ---
    const deleteButtons = document.querySelectorAll('.btn-delete-calendar');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const calendarId = e.target.value;
            if (!calendarId) return alert('ID du calendrier manquant !');
            if (!confirm('Voulez-vous vraiment supprimer ce calendrier ?')) return;

            try {
                const res = await fetch(`/user/calendar/${calendarId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await res.json();

                if (res.ok) {
                    const wrapper = document.querySelector(`.calendar-item label input[value="${calendarId}"]`)?.closest('.calendar-item');
                    if (wrapper) wrapper.remove();

                    const remainingCalendars = document.querySelectorAll('.calendar-item');
                    if (remainingCalendars.length === 1) {
                        const lastDeleteBtn = remainingCalendars[0].querySelector('.btn-delete-calendar');
                        if (lastDeleteBtn) lastDeleteBtn.remove();
                    }
                } else {
                    alert(data.error || 'Erreur lors de la suppression');
                }
            } catch (err) {
                console.error(err);
                alert('Erreur serveur, réessayez plus tard');
            }
        });
    });

    // --- (Désactivé) Modification du titre d’un calendrier ---
    // ⚠️ Ce bloc causait une erreur car les éléments .calendar-title-input et .btn-update-title n'existent pas dans le HTML.
    // Tu pourras le réactiver plus tard si tu ajoutes ces éléments.
    /*
    const titleEl = document.querySelector('.calendar-title');
    const inputEl = document.querySelector('.calendar-title-input');
    const btnUpdate = document.querySelector('.btn-update-title');
    const calendarId = titleEl?.dataset?.calendarId;

    if (titleEl && inputEl && btnUpdate) {
        titleEl.addEventListener('click', () => {
            inputEl.style.display = 'inline-block';
            btnUpdate.style.display = 'inline-block';
            inputEl.value = titleEl.textContent.trim();
            inputEl.focus();
        });

        btnUpdate.addEventListener('click', async () => {
            const newTitle = inputEl.value.trim();
            if (!newTitle) return alert('Titre invalide');

            try {
                const res = await fetch('/user/calendar/updateTitle', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ calendarId, newTitle })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'Erreur lors de la mise à jour du titre');
                } else {
                    titleEl.textContent = newTitle;
                    inputEl.style.display = 'none';
                    btnUpdate.style.display = 'none';

                    const labelSpan = document.querySelector(
                        `.calendar-option input[value="${calendarId}"] + .calendar-color + span`
                    );
                    if (labelSpan) labelSpan.textContent = newTitle;
                }
            } catch (err) {
                console.error(err);
                alert('Erreur serveur, réessayez plus tard');
            }
        });
    }
    */

    // === POPUPS ===

    // Popup nouvel événement
    const btnNewEvent = document.getElementById('btnNewEvent');
    const eventModal = document.getElementById('eventModal');
    const btnCancel = document.getElementById('btnCancel');
    const eventForm = document.getElementById('eventForm');

    if (btnNewEvent && eventModal && btnCancel && eventForm) {
        btnNewEvent.addEventListener('click', () => {
            eventModal.classList.remove('hidden');
        });

        btnCancel.addEventListener('click', () => {
            eventModal.classList.add('hidden');
            eventForm.reset();
        });

        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                eventModal.classList.add('hidden');
                eventForm.reset();
            }
        });
    }

    // Popup modifier calendrier
    const btnModCalendar = document.getElementById('btnModCalendar');
    const calendarModal = document.getElementById('calendarModal');
    const calendarForm = document.getElementById('calendarForm');
    const btnCancelCalendar = document.getElementById('btnCancelCalendar');

    if (btnModCalendar && calendarModal && calendarForm && btnCancelCalendar) {
        btnModCalendar.addEventListener('click', () => {
            calendarModal.classList.remove('hidden');
        });

        btnCancelCalendar.addEventListener('click', () => {
            calendarModal.classList.add('hidden');
            calendarForm.reset();
        });

        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) {
                calendarModal.classList.add('hidden');
                calendarForm.reset();
            }
        });
    }

    // Popup nouveau calendrier
    const btnNewCalendar = document.getElementById('btnNewCalendar');
    const newCalendarModal = document.getElementById('newCalendarModal');
    const btnCancelNewCalendar = document.getElementById('btnCancelNewCalendar');

    if (btnNewCalendar && newCalendarModal && btnCancelNewCalendar) {
        btnNewCalendar.addEventListener('click', () => {
            newCalendarModal.classList.remove('hidden');
        });

        btnCancelNewCalendar.addEventListener('click', () => {
            newCalendarModal.classList.add('hidden');
        });

        newCalendarModal.addEventListener('click', (e) => {
            if (e.target === newCalendarModal) {
                newCalendarModal.classList.add('hidden');
            }
        });
    }

});

