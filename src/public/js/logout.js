function logout() {
    fetch('/user/logout', {
        method: 'GET',
        credentials: 'include' // pour envoyer le cookie au serveur
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.message);  // optionnel : affiche un message
        window.location.href = '/'; // tu choisis quand rediriger
    })
    .catch(err => console.error('Erreur logout:', err));
}
