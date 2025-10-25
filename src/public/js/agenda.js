// Initialisé la page d'acceuil avec les données de l'utilisateur


document.addEventListener('DOMContentLoaded', async function () {

    // Charger le calendrier de full Calendar
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

    try {
        // --- Charger le calendrier principal (par défaut) ---
        const res = await fetch('/user/agenda', { credentials: 'include' });
        if (!res.ok) throw new Error('Erreur récupération calendrier');
        const data = await res.json();
        const calendarData = data.calendar;

        if (calendarData) {
            const titleDiv = document.querySelector('.calendar-title');
            if (titleDiv) titleDiv.textContent = calendarData.title;

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

        // --- Charger la liste de tous les calendriers ---
        const allRes = await fetch('/user/calendars', { credentials: 'include' });
        if (!allRes.ok) throw new Error('Erreur récupération des calendriers');
        const allData = await allRes.json();

        const listVisible = document.getElementById('calendarVisible');
        const listHidden = document.getElementById('calendarHidden');
        const wrapperHidden = document.getElementById('calendarHiddenWrapper');

        // Vider avant d'ajouter
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

            // Ajouter le bouton poubelle uniquement si plus d'un calendrier
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

        if (allData.calendars.length <= 4) {
            wrapperHidden.style.display = 'none';
        }

    } catch (err) {
        console.error(err);
        alert('Impossible de charger votre calendrier');
    }

    // --- Écouteur pour le bouton "Supprimer un calendrier" 
    const deleteButtons = document.querySelectorAll('.btn-delete-calendar');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const calendarId = e.target.value;
            if (!calendarId) return alert('ID du calendrier manquant !');
            if (!confirm('Voulez-vous vraiment supprimer ce calendrier ?')) return;

            try {
                const res = await fetch(`/calendar/${calendarId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await res.json();

                if (res.ok) {
                    alert('Calendrier supprimé avec succès');

                    // Supprime le wrapper complet (label + bouton)
                    const wrapper = document.querySelector(`.calendar-item label input[value="${calendarId}"]`)?.closest('.calendar-item');
                    if (wrapper) wrapper.remove();

                    // Vérifie combien de calendriers restent
                    const remainingCalendars = document.querySelectorAll('.calendar-item');
                    if (remainingCalendars.length === 1) {
                        // Supprime le bouton poubelle du dernier calendrier
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

});
