// Message de mise a jour
(function () {
  window.showMessage = function (message, type = "error") {
    let box = document.getElementById("globalMessageBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "globalMessageBox";
      box.className = "message-box";
      document.body.appendChild(box);
    }

    box.textContent = message;
    box.className = `message-box ${type}`;
    box.style.display = "block";
    box.style.opacity = "1";
    box.style.transform = "translateY(0)";

    setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform = "translateY(-20px)";
      setTimeout(() => (box.style.display = "none"), 300);
    }, 4000);
  };
})();

//  Confirmation des suppressions
(function () {
  // Crée le conteneur global s’il n’existe pas déjà
  if (!document.getElementById("globalConfirmBox")) {
    const box = document.createElement("div");
    box.id = "globalConfirmBox";
    box.className = "confirm-box hidden";
    box.innerHTML = `
      <div class="confirm-overlay"></div>
      <div class="confirm-content">
        <p class="confirm-message"></p>
        <div class="confirm-actions">
          <button class="confirm-cancel btn btn-secondary">Annuler</button>
          <button class="confirm-ok btn btn-primary">Confirmer</button>
        </div>
      </div>
    `;
    document.body.appendChild(box);

    // CSS rapide inline
    const style = document.createElement("style");
    document.head.appendChild(style);
  }

  window.showConfirm = function (message) {
    return new Promise((resolve) => {
      const box = document.getElementById("globalConfirmBox");
      const messageEl = box.querySelector(".confirm-message");
      const okBtn = box.querySelector(".confirm-ok");
      const cancelBtn = box.querySelector(".confirm-cancel");
      const overlay = box.querySelector(".confirm-overlay");

      messageEl.textContent = message;
      box.classList.remove("hidden");

      const cleanup = () => {
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        overlay.removeEventListener("click", onCancel);
      };

      const onOk = () => {
        cleanup();
        box.classList.add("hidden");
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        box.classList.add("hidden");
        resolve(false);
      };

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      overlay.addEventListener("click", onCancel);
    });
  };
})();
