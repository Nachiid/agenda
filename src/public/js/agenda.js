document.addEventListener('DOMContentLoaded', async function() {
    const calendarEl = document.getElementById('calendar');

    // === Initialisation du calendrier ===
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

    // === POPUP NOUVEL ÉVÉNEMENT ===
    const btnNewEvent = document.getElementById('btnNewEvent');
    const eventModal = document.getElementById('eventModal');
    const btnCancel = document.getElementById('btnCancel');
    const eventForm = document.getElementById('eventForm');

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

    // === POPUP NOUVEL CALENDRIER ===
    const btnNewCalendar = document.getElementById('btnNewCalendar');
    const calendarModal = document.getElementById('calendarModal');
    const calendarForm = document.getElementById('calendarForm');
    const btnCancelCalendar = document.getElementById('btnCancelCalendar');
    const btnDeleteCalendar = document.getElementById('btnDeleteCalendar');

    btnNewCalendar.addEventListener('click', () => {
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

    
});


