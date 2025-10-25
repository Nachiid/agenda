loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.querySelector('#email').value.trim();
    const password = document.querySelector('#password').value;

    try {
        const res = await fetch('http://localhost:5000/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data = await res.json();

        if (res.ok) {
            loginForm.reset();
            window.location.href = 'agenda';

        } else {
            alert(data.error || 'Erreur de login');
        }

    } catch (error) {
        alert('Erreur serveur, réessaye plus tard.');
    }
});
