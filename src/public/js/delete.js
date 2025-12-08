document.addEventListener('DOMContentLoaded', function () {
    const trashModal = document.getElementById('trashModal');
    const btnTrash = document.getElementById('btnTrash');
    const btnCloseTrash = document.getElementById('btnCloseTrash');
    const trashContent = document.getElementById('trashContent');

    // Ouvre la modale de la corbeille
    btnTrash.addEventListener('click', () => {
        trashModal.classList.remove('hidden');
        loadTrashContent();
    });

    // Ferme la modale de la corbeille
    btnCloseTrash.addEventListener('click', () => {
        trashModal.classList.add('hidden');
    });

    // Gère les clics pour restaurer les éléments
    trashContent.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-restore')) {
            const button = event.target;
            const id = button.dataset.id;
            const type = button.dataset.type;

            try {
                const response = await fetch(`/restore/${type}/${id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    // Recharge le contenu de la corbeille pour refléter la suppression
                    loadTrashContent();
                    // Rafraîchir la vue principale sans recharger la page
                    if(type === "calendar"){
                         window.createCalendarElement(result.item, window.calendar);
                    }
                    
                } else {
                    throw new Error(result.message || "Erreur lors de la restauration.");
                }
            } catch (error) {
                console.error('Erreur de restauration:', error);
                alert(error.message);
            }
        }
    });

    /**
     * Charge et affiche le contenu de la corbeille
     */
    async function loadTrashContent() {
        try {
            const response = await fetch('/trash');
            if (!response.ok) {
                throw new Error('Impossible de charger la corbeille.');
            }
            const data = await response.json();

            trashContent.innerHTML = ''; // Vide le contenu précédent

            if (data.calendars.length === 0 && data.appointments.length === 0) {
                trashContent.innerHTML = '<p>La corbeille est vide.</p>';
                return;
            }

            // Affiche les calendriers supprimés
            if (data.calendars.length > 0) {
                const calendarsTitle = document.createElement('h4');
                calendarsTitle.textContent = 'Calendriers';
                trashContent.appendChild(calendarsTitle);
                const calendarsList = document.createElement('ul');
                data.calendars.forEach(cal => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${cal.title} (Calendrier)</span>
                        <button class="btn-restore" data-id="${cal._id}" data-type="calendar">Restaurer</button>
                    `;
                    calendarsList.appendChild(li);
                });
                trashContent.appendChild(calendarsList);
            }

            // Affiche les rendez-vous supprimés
            if (data.appointments.length > 0) {
                const appointmentsTitle = document.createElement('h4');
                appointmentsTitle.textContent = 'Rendez-vous';
                trashContent.appendChild(appointmentsTitle);
                const appointmentsList = document.createElement('ul');
                data.appointments.forEach(app => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${app.name} (Rendez-vous du calendrier "${app.calendarTitle}")</span>
                        <button class="btn-restore" data-id="${app._id}" data-type="appointment">Restaurer</button>
                    `;
                    appointmentsList.appendChild(li);
                });
                trashContent.appendChild(appointmentsList);
            }

        } catch (error) {
            console.error('Erreur:', error);
            trashContent.innerHTML = `<p>${error.message}</p>`;
        }
    }
});