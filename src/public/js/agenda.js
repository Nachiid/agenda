document.addEventListener('DOMContentLoaded', async function () {
    const calendarEl = document.getElementById('calendar');
    const listContainer = document.querySelector('.calendars-list'); // la div où afficher les titres

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

        // Vider avant d'ajouter (utile si la page est rechargée)
        listVisible.innerHTML = '';
        listHidden.innerHTML = '';

        allData.calendars.forEach((cal, i) => {
            const label = document.createElement('label');
            label.classList.add('calendar-option');

            const isChecked = cal._id === calendarData._id ? 'checked' : '';

            label.innerHTML = `
        <input type="checkbox" ${isChecked} value="${cal._id}">
        <span class="calendar-color" style="background:${cal.color}"></span>
        <span>${cal.title}</span>
    `;

            if (i < 4) listVisible.appendChild(label);
            else listHidden.appendChild(label);
        });



        if (allData.calendars.length <= 4) {
            wrapperHidden.style.display = 'none';
        }

    } catch (err) {
        console.error(err);
        alert('Impossible de charger votre calendrier');
    }
});
