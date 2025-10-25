document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    console.log(token);
    console.log(userId);

    if (!token || !userId) {
        return;
    }

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
            document.querySelector('.profile-email').textContent = email;
            document.querySelector('.profile-name').textContent = firstName + ' ' + lastName;
            document.querySelector('.avatar-circle').textContent = initials; // <
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert("il y a une erreur 2 ");

    }
})