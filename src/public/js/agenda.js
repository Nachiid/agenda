document.addEventListener('DOMContentLoaded', async function () {
    const calendarEl = document.getElementById('calendar');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
        navLinks: true,
        selectable: true,
        editable: true,
        events: []
    });
    calendar.render();


    // --- Afficher les RDV dans le calendrier ---
    try {
        const res = await fetch('/user/agenda', { credentials: 'include' });
        if (!res.ok) throw new Error('Erreur récupération calendrier');
        const data = await res.json();
        const calendarData = data.calendar;

        if (!calendarData) return;

        const titleDiv = document.querySelector('.calendar-title');
        titleDiv.textContent = calendarData.title;
        
        const events = calendarData.appointments.map(r => ({
            id: r._id,
            title: r.name,
            start: r.date_debut,
            end: r.date_fin,
            color: calendarData.color,
            extendedProps: { description: r.description || '' }
        }));

        events.forEach(ev => calendar.addEvent(ev));
    } catch (err) {
        console.error(err);
        alert('Impossible de charger votre calendrier');
    }
});


