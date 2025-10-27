document.addEventListener('DOMContentLoaded', async () => {


    try {
        const res = await fetch(`http://localhost:5000/user/profile`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await res.json();
        if (res.ok) {
            const email = data.user.email || '';
            const firstName = data.user.firstName || '';
            const lastName = data.user.lastName || '';
            const phone = data.user.phone || '';
            const timezone = data.user.timezone || 'Europe/Paris';

            console.log(email);
            console.log(firstName);
            console.log(lastName);

            const initials = (firstName + ' ' + lastName)
                .split(' ')                // sépare par espace
                .filter(Boolean)           // retire les espaces vides
                .map(n => n[0].toUpperCase()) // prend la première lettre en maj
                .join('');

            // --- Mise à jour des champs ---
            document.querySelector('#email').value = email;
            document.querySelector('#firstName').value = firstName;
            document.querySelector('#lastName').value = lastName;
            document.querySelector('#phone').value = phone;
            document.querySelector('#timezone').value = timezone;
            // --- Mise à jour de l'affichage ---
            document.querySelector('.profile-email').textContent = email;
            document.querySelector('.profile-name').textContent = firstName + ' ' + lastName;
            document.querySelector('.avatar-circle').textContent = initials; // <
        }else{
            showMessage(data.error || 'Erreur lors du chargement du profil', 'error');
        }
    } catch (error) {
        showMessage("Il y a une erreur lors de la récupération du profil", 'error');
        
    }
})

// Gestion de la modification du profil (bouton "Enregistrer les modifications")
document.querySelector('#profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.querySelector('#firstName').value.trim();
    const lastName = document.querySelector('#lastName').value.trim();
    const email = document.querySelector('#email').value.trim();
    const phone = document.querySelector('#phone').value.trim();
    const timezone = document.querySelector('#timezone').value.trim();

    try {
        const res = await fetch(`http://localhost:5000/user/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ firstName, lastName, email, phone, timezone })
        });

        const data = await res.json();
        if (res.ok) {
            alert('Profil mis à jour avec succès.');
            window.location.reload();
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (err) {
        alert('Erreur réseau lors de la mise à jour du profil.');
    }
});


// Gestion du changement de mot de passe (bouton "Changer le mot de passe")
// === GESTION MODAL MOT DE PASSE ===
const btnChangePassword = document.getElementById('btnChangePassword');
const passwordModal = document.getElementById('passwordModal');
const closeModal = document.getElementById('closeModal');
const passwordForm = document.getElementById('passwordForm');

// Ouvrir le modal
btnChangePassword.addEventListener('click', () => {
  passwordModal.classList.remove('hidden');
});

// Fermer le modal
closeModal.addEventListener('click', () => {
  passwordModal.classList.add('hidden');
  passwordForm.reset();
});

// Soumission du formulaire
passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  try {
    const res = await fetch('http://localhost:5000/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      credentials: 'include'
    });

    const data = await res.json();

    if (res.ok) {
      alert("Mot de passe mis à jour avec succès !");
      passwordModal.classList.add('hidden');
      passwordForm.reset();
    } else {
      alert("Erreur : " + data.error);
    }
  } catch (err) {
    alert("Erreur de connexion au serveur.");
    console.error(err);
  }
});

// === AFFICHER / MASQUER LES MOTS DE PASSE ===
document.getElementById('showPasswords').addEventListener('change', (e) => {
  const show = e.target.checked;
  const fields = [
    document.getElementById('currentPassword'),
    document.getElementById('newPassword'),
    document.getElementById('confirmNewPassword')
  ];

  fields.forEach(field => {
    field.type = show ? 'text' : 'password';
  });
});


// Gestion de la suppression du profil (bouton "Supprimer le compte")
document.querySelector('#btnDeleteAccount').addEventListener('click', async (e) => {
    e.preventDefault();

    if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ?")) return;

    try {
        const res = await fetch(`http://localhost:5000/user/profile`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await res.json();
        if (res.ok) {
            window.location.href = '/';

        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (err) {
        alert('Erreur réseau lors de la suppression du compte.');
    }
});




