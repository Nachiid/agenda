// showMessage.js — fonction globale pour afficher des messages (succès / erreur)

(function() {
  // Crée le conteneur global s’il n’existe pas déjà
  if (!document.getElementById('globalMessageBox')) {
    const box = document.createElement('div');
    box.id = 'globalMessageBox';
    box.className = 'message-box';
    document.body.appendChild(box);
  }

  // Fonction globale accessible partout
  window.showMessage = function(message, type = 'error') {
    const messageBox = document.getElementById('globalMessageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';
    messageBox.style.opacity = '1';
    messageBox.style.transform = 'translateY(0)';

    // Disparaît automatiquement après 4 secondes
    setTimeout(() => {
      messageBox.style.opacity = '0';
      messageBox.style.transform = 'translateY(-20px)';
      setTimeout(() => (messageBox.style.display = 'none'), 300);
    }, 4000);
  };
})();
