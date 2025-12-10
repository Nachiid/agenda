//  FONCTION DE RECHARGEMENT DU PROFIL
async function chargerProfil() {
  try {
    const res = await fetch(`http://localhost:3000/user/profile`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json();

    if (res.ok) {
      const user = data.user;
      const email = user.email || "";
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const phone = user.phone || "";
      const timezone = user.timezone || "Europe/Paris";

      const initials = (firstName + " " + lastName)
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0].toUpperCase())
        .join("");

      // --- Mise à jour des champs du formulaire ---
      document.querySelector("#email").value = email;
      document.querySelector("#firstName").value = firstName;
      document.querySelector("#lastName").value = lastName;
      document.querySelector("#phone").value = phone;
      document.querySelector("#timezone").value = timezone;

      // --- Mise à jour de l'affichage du profil ---
      document.querySelector(".profile-email").textContent = email;
      document.querySelector(
        ".profile-name"
      ).textContent = `${firstName} ${lastName}`;
      document.querySelector(".avatar-circle").textContent = initials;

      // --- Mise a jour du select
      const defaultViewSelect = document.querySelector(
        ".preference-item-view select"
      );
      if (defaultViewSelect && user.calendarPreferences) {
        const userDefaultView = user.calendarPreferences.defaultView;

        Array.from(defaultViewSelect.options).forEach((opt) => {
          opt.selected = opt.value === userDefaultView;
        });
      } else {
        showMessage("default vide ou champs nom trouvé", "error");
      }
    } else {
      showMessage(data.error || "Erreur lors du chargement du profil", "error");
    }
  } catch (error) {
    showMessage("Erreur lors de la récupération du profil.", "error");
    console.error(error);
  }
}
// === CONFIRMATION LORS DU CHANGEMENT D'EMAIL + SAUVEGARDE AUTO ===
let oldEmailValue = "";

document.querySelector("#email").addEventListener("focus", function () {
  oldEmailValue = this.value; // Sauvegarde de l'ancien email
});

document.querySelector("#email").addEventListener("change", async function () {
  const newEmail = this.value.trim();

  // Si l'email n'a pas changé, on ne fait rien
  if (newEmail === oldEmailValue) return;

  const confirmed = await showConfirm(
    " Modifier votre email changera votre méthode de connexion.\n\n" +
    "Voulez-vous enregistrer ce changement maintenant ?"
  );

  if (!confirmed) {
    this.value = oldEmailValue; // Restaure l'ancien email si annulation
    return;
  }

  //  Enregistrement auto du profil
  document.querySelector("#profileForm").requestSubmit();
});

// Charger le profil dès que la page est prête
document.addEventListener("DOMContentLoaded", chargerProfil);
/*
 * Gestion de la modification du profil (bouton "Enregistrer les modifications")
 *
 */

document.querySelector("#profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.querySelector("#firstName").value.trim();
  const lastName = document.querySelector("#lastName").value.trim();
  const email = document.querySelector("#email").value.trim();
  const phone = document.querySelector("#phone").value.trim();
  const timezone = document.querySelector("#timezone").value.trim();

  try {
    const res = await fetch(`http://localhost:3000/user/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ firstName, lastName, email, phone, timezone }),
    });

    const data = await res.json();
    if (res.ok) {
      await chargerProfil();
      showMessage("Profil mis à jour avec succès.", "success");
    } else {
      showMessage("Erreur: " + data.error);
    }
  } catch (err) {
    showMessage("Erreur réseau lors de la mise à jour du profil.");
  }
});

// Gestion du changement de mot de passe (bouton "Changer le mot de passe")
// === GESTION MODAL MOT DE PASSE ===
const btnChangePassword = document.getElementById("btnChangePassword");
const passwordModal = document.getElementById("passwordModal");
const closeModal = document.getElementById("closeModal");
const passwordForm = document.getElementById("passwordForm");

// Ouvrir le modal
btnChangePassword.addEventListener("click", () => {
  passwordModal.classList.remove("hidden");
});

// Fermer le modal
closeModal.addEventListener("click", () => {
  passwordModal.classList.add("hidden");
  passwordForm.reset();
});

// Soumission du formulaire
passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword =
    document.getElementById("confirmNewPassword").value;

  try {
    const res = await fetch("http://localhost:3000/user/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmNewPassword,
      }),
      credentials: "include",
    });

    const data = await res.json();

    if (res.ok) {
      showMessage("Mot de passe mis à jour avec succès !", "success");
      passwordModal.classList.add("hidden");
      passwordForm.reset();
    } else {
      showMessage("Erreur : " + data.error);
    }
  } catch (err) {
    showMessage("Erreur de connexion au serveur.");
    console.error(err);
  }
});

// === AFFICHER / MASQUER LES MOTS DE PASSE ===
document.getElementById("showPasswords").addEventListener("change", (e) => {
  const show = e.target.checked;
  const fields = [
    document.getElementById("currentPassword"),
    document.getElementById("newPassword"),
    document.getElementById("confirmNewPassword"),
  ];

  fields.forEach((field) => {
    field.type = show ? "text" : "password";
  });
});

// === FERMER LA MODALE ===
document.getElementById("closeModal").addEventListener("click", () => {
  const modal = document.getElementById("passwordModal");
  modal.classList.add("hidden");

  //  Réinitialiser la checkbox et les champs mot de passe
  const showPasswords = document.getElementById("showPasswords");
  showPasswords.checked = false;

  const fields = [
    document.getElementById("currentPassword"),
    document.getElementById("newPassword"),
    document.getElementById("confirmNewPassword"),
  ];

  fields.forEach((field) => (field.type = "password"));

  document.getElementById("passwordForm").reset();
});

// Gestion de la suppression du profil (bouton "Supprimer le compte")
document
  .querySelector("#btnDeleteAccount")
  .addEventListener("click", async (e) => {
    e.preventDefault();

    const confirmed = await showConfirm(
      `Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:3000/user/profile`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        /*on vas faire un fetch vers deconnexion au lieu de / - a faire apres le merge
         *
         *
         * *
         */
        fetch("/user/logout", {
          method: "GET",
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => {
            localStorage.clear();
            window.location.href = "/";
          })
          .catch((err) => showMessage(err, "error"));
      } else {
        showMessage("Erreur: " + data.error);
      }
    } catch (err) {
      showMessage("Erreur réseau lors de la suppression du compte.");
    }
  });

// === SUPPRESSION DU COMPTE AVEC MODALE ===
const deleteModal = document.getElementById("deleteConfirmModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");




// Fermer la modale
cancelDelete.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
});

// Confirmer la suppression
confirmDelete.addEventListener("click", async () => {
  deleteModal.classList.add("hidden");

  const confirmed = await showConfirm(
    `Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est
          irréversible.`
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`http://localhost:3000/user/profile`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();
    if (res.ok) {
      showMessage("Compte supprimé avec succès.", "success");
      setTimeout(() => (window.location.href = "/"), 500);
    } else {
      showMessage("Erreur: " + data.error, "error");
    }
  } catch (err) {
    showMessage("Erreur réseau lors de la suppression du compte.", "error");
    console.error(err);
  }
});

// Sélection des preferences
const defaultViewSelect = document.querySelector(
  ".preference-item-view select"
);

if (defaultViewSelect) {
  defaultViewSelect.addEventListener("change", async (e) => {
    const selectedView = e.target.value;

    try {
      const res = await fetch("/user/preferences/defaultView", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ defaultView: selectedView }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(
          data.error || "Erreur lors de la sauvegarde des préférences",
          "error"
        );
        return;
      }

      showMessage("Préférence sauvegardée avec succès", "success");
    } catch (err) {
      console.error(err);
      showMessage("Erreur serveur, réessayez plus tard", "error");
    }
  });
}
