const jwt = require("jsonwebtoken");
const model = require("../models/model");

// Verification des donnees tous formulaire
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "il ya une erreur " });
  }

  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return res.status(400).json({
      error: "Le prénom et le nom doivent contenir uniquement des lettres.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Adresse email invalide." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Les mot de passe sont differents" });
  }
  const userExists = await model.exists({ email });

  if (userExists !== null) {
    return res.status(400).json({ error: "Email déjà utilisé" });
  }

  try {
    const NewUser = await model.register(firstName, lastName, email, password);
    const userId = await model.getUserIdByEmail(email);
    await model.createCalendar(userId, "Rendez-vous partagés", "permanent", [], true);
    await model.createCalendar(userId, "Mon agenda", "personnel", []);
    return res
      .status(201)
      .json({ message: "Utilisateur ajouté", user: NewUser });
  } catch (err) {
    return res.status(500).json({ error: "Erreur lors de l’inscription" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifications basiques
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Veuillez remplir tous les champs." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Adresse email invalide." });
    }

    const user = await model.login(email, password);
    if (!user) {
      return res
        .status(401)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    // Génération du token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: "1w" }
    );

    // Stocke le token dans un cookie httpOnly
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 semaine
    });

    return res.status(200).json({
      message: "Connexion réussie",
      user,
    });
  } catch (err) {
    console.error("Erreur login:", err);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

exports.getuser = async (req, res) => {
  const id = req.user.id;

  try {
    const profil = await model.getProfil(id);

    if (!profil) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const { password, ...profilSansMdp } = profil.toObject();
    return res.status(200).json({ user: profilSansMdp });
  } catch (error) {
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// Contrôleur pour mettre à jour la vue par défaut du calendrier
exports.getuserPreference = async (req, res) => {
  const id = req.user.id;
  try {
    const profil_inforamation = await model.getProfil(id);
    return res
      .status(200)
      .json({ userPreference: profil_inforamation.calendarPreferences });
  } catch (error) {
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Met à jour les informations de profil de l'utilisateur.
 */
exports.modifierProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email, phone, timezone } = req.body;

  // Validation de base
  if (!firstName || !lastName || !email) {
    return res
      .status(400)
      .json({ error: "Le prénom, le nom et l'email sont requis." });
  }

  // Validation des noms
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return res.status(400).json({
      error: "Le prénom et le nom doivent contenir uniquement des lettres.",
    });
  }

  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Adresse email invalide." });
  }

  // Vérification d'email déjà existant (autre utilisateur)
  const userExists = await model.exists({ email, _id: { $ne: userId } });
  if (userExists) {
    return res
      .status(400)
      .json({ error: "Email déjà utilisé par un autre utilisateur." });
  }
  //{ _id: { $ne: userId } } signifie  dont l’ID est différent de celui de l’utilisateur actuel.

  // Validation téléphone
  const phoneRegex = /^\+?\d+$/;
  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ error: "Numéro de téléphone invalide." });
  }

  try {
    const updatePayload = { firstName, lastName, email, phone, timezone };
    const updatedUser = await model.modifierProfile(userId, updatePayload);
    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    return res
      .status(200)
      .json({ message: "Profil mis à jour avec succès.", user: updatedUser });
  } catch (error) {
    console.error("Erreur lors de la modification du profil:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res
      .status(400)
      .json({ error: "Veuillez remplir tous les champs de mot de passe." });
  }

  if (newPassword !== confirmNewPassword) {
    return res
      .status(400)
      .json({ error: "Les nouveaux mots de passe ne correspondent pas." });
  }

  try {
    const result = await model.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    if (result === "not_found") {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    if (result === "invalid_password") {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    return res
      .status(200)
      .json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

/**
 * Supprime le profil de l'utilisateur et tous ses agendas.
 */
exports.supprimerProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const deletedUser = await model.supprimerProfile(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    return res
      .status(200)
      .json({ message: "Profil et agendas associés supprimés avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du profil:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// Contrôleur pour mettre à jour la vue par défaut du calendrier
exports.updatePreference = async (req, res) => {
  const userId = req.user.id;
  const { defaultView } = req.body;

  if (!defaultView || !["Mois", "Semaine", "Jour", "Liste"].includes(defaultView)) {
    return res
      .status(400)
      .json({ error: "Valeur de vue par défaut invalide." });
  }

  try {
    // Appel de la fonction du modèle pour mettre à jour la préférence
    const updatedUser = await model.updateUserPreference(userId, defaultView);

    return res.status(200).json({
      message: "Préférence mise à jour avec succès.",
      defaultView: updatedUser.defaultView,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};
