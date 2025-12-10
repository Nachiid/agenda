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

    // Gère les clics pour restaurer ou supprimer définitivement les éléments
    trashContent.addEventListener('click', async (event) => {
        const button = event.target;
        const id = button.dataset.id;
        const type = button.dataset.type;

        if (button.classList.contains('btn-restore')) {
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
                    if (type === "calendar") {
                        window.createCalendarElement(result.item, window.calendar);
                        window.addActiveCalendarIdLocal(result.item._id);
                        window.updateCalendarCheckboxes();
                        window.updateCalendarView([result.item], window.calendar);
                        window.fetchAppointments(window.getActiveCalendarIdsLocal());
                    } else if (type === 'appointment'){
                        // Mise à jour du calendrier
                        window.updateCalendar({
                            type: "add",
                            eventData: result.item,
                        });
                        window.fetchAppointments(window.getActiveCalendarIdsLocal());
                    }

                } else {
                    throw new Error(result.message || "Erreur lors de la restauration.");
                }
            } catch (error) {
                console.error('Erreur de restauration:', error);
                alert(error.message);
            }
        } else if (button.classList.contains('btn-delete-permanent')) {
            try {
                const response = await fetch(`/delete/permanent/${type}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    loadTrashContent();
                } else {
                    throw new Error(result.message || "Erreur lors de la suppression définitive.");
                }
            } catch (error) {
                console.error('Erreur de suppression:', error);
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
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-restore" data-id="${cal._id}" data-type="calendar">Restaurer</button>
                            <button class="btn-delete-permanent" 
                                    style="background: #ef4444; color: white; border: none; padding: 0.4rem 0.9rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(239, 68, 68, 0.3);"
                                    onmouseover="this.style.background='#dc2626'; this.style.transform='translateY(-1px)';"
                                    onmouseout="this.style.background='#ef4444'; this.style.transform='translateY(0)';"
                                    data-id="${cal._id}" data-type="calendar">Supprimer</button>
                        </div>
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
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-restore" data-id="${app._id}" data-type="appointment">Restaurer</button>
                            <button class="btn-delete-permanent" 
                                    style="background: #ef4444; color: white; border: none; padding: 0.4rem 0.9rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(239, 68, 68, 0.3);"
                                    onmouseover="this.style.background='#dc2626'; this.style.transform='translateY(-1px)';"
                                    onmouseout="this.style.background='#ef4444'; this.style.transform='translateY(0)';"
                                    data-id="${app._id}" data-type="appointment">Supprimer</button>
                        </div>
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
