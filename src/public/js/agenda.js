


document.addEventListener('DOMContentLoaded', async function() {
    const calendarEl = document.getElementById('calendar');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
        navLinks: true,
        selectable: true,
        editable: true,
        events: [] // on va les ajouter après
    });

    calendar.render();

    // --- Afficher les RDV dans le calendrier ---
   /* const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const res = await fetch(`http://localhost:5000/user/${userId}`);
        const rdvs = await res.json();

        // Transformer les RDV pour FullCalendar
        const events = rdvs.map(r => ({
            id: r._id,
            title: r.titre,
            start: r.dateDebut,
            end: r.dateFin,
            extendedProps: { description: r.comment || '' }
        }));

        // Ajouter les événements au calendrier
        events.forEach(ev => calendar.addEvent(ev));

    } catch (error) {
        console.error('Erreur en récupérant les RDV :', error);
    }*/
});


