const { User, Calendar, sharedCalendar } = require("./db");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * Crée un nouvel utilisateur avec un mot de passe hashé et l'enregistre dans la base de données.
 */
exports.register = async function (firstName, lastName, email, password) {
  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashPassword,
  });
  const savedUser = await newUser.save();

  return savedUser;
};

/**
 * Récupère l'ID d'un utilisateur à partir de son email.
 */
exports.getUserIdByEmail = async function (email) {
  const user = await User.findOne({ email }, "_id");
  return user ? user._id : null;
};

/**
 * Authentifie un utilisateur en comparant l'email et le mot de passe.
 * Renvoie l'utilisateur si les identifiants sont corrects, sinon null.
 */
exports.login = async function (email, password) {
  const user = await User.findOne({ email });
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  return user;
};

/**
 * Vérifie si un utilisateur avec un email donné existe dans la base de données.
 * Renvoie l'utilisateur si trouvé, sinon null.
 * Vérifie si un utilisateur existe.
 * @param {Object} filter - Peut contenir un email ou un _id.
 * @returns {Promise<Object|null>} L'utilisateur s'il existe, sinon null.
 */
exports.exists = function (filter) {
  return User.findOne(filter);
};

/**
 * Récupère le profil d'un utilisateur en fonction de son ID.
 */
exports.getProfil = function (id) {
  return User.findById(id);
};

/**
 * Ajoute un rendez-vous à un calendrier.
 * @param {string} calendarId - L'ID du calendrier.
 * @param {Object} appointmentData - Les données du rendez-vous.
 * @param {string} appointmentData.name - Titre du rendez-vous.
 * @param {Date|string} appointmentData.date_debut - Date/heure de début.
 * @param {Date|string} appointmentData.date_fin - Date/heure de fin.
 * @param {string} [appointmentData.description] - Description du rendez-vous.
 * @returns {Promise<Object>} Le calendrier mis à jour.
 */
exports.addAppointment = async function (calendarId, appointmentData) {
  // Récupérer le calendrier
  const calendar = await Calendar.findById(calendarId);
  if (!calendar) throw new Error("Calendrier introuvable");

  // Créer le nouveau rendez-vous
  const newAppointment = {
    name: appointmentData.name,
    date_debut: appointmentData.date_debut,
    date_fin: appointmentData.date_fin,
    description: appointmentData.description || "",
  };

  // Ajouter au calendrier
  calendar.appointments.push(newAppointment);

  // Le rdv inséré est le dernier élément du tableau
  const insertedAppointment =
    calendar.appointments[calendar.appointments.length - 1];

  // Sauvegarder le calendrier
  await calendar.save();

  // Retourner le rendez-vous inséré avec son _id
  return insertedAppointment;
};

/**
 * Supprime un rendez-vous d'un calendrier.
 * */

exports.deleteAppointment = async function (id_rdv) {
  const calendar = await Calendar.findOne({ "appointments._id": id_rdv });
  if (!calendar) return null;

  const index = calendar.appointments.findIndex(
    (a) => a._id.toString() === id_rdv
  );
  if (index === -1) return null;

  const removed = calendar.appointments.splice(index, 1)[0];
  await calendar.save();
  return removed;
};

/**
 * Met à jour un rendez-vous existant dans un calendrier.
 * Modifie les champs titre, dates et description si présents dans les données fournies.
 */
exports.updateAppointment = async function (id_rdv, data) {
  const calendar = await Calendar.findOne({ "appointments._id": id_rdv });
  if (!calendar) return null;

  const index = calendar.appointments.findIndex(
    (a) => a._id.toString() === id_rdv
  );
  if (index === -1) return null;

  const rdv = calendar.appointments[index];
  if (data.name !== undefined) rdv.name = data.name;
  if (data.date_debut !== undefined) rdv.date_debut = new Date(data.date_debut);
  if (data.date_fin !== undefined) rdv.date_fin = new Date(data.date_fin);
  if (data.description !== undefined) rdv.description = data.description;

  await calendar.save();
  return rdv;
};
/**
 * vérifier si le rdv appartien a un utilisateur donneé
 */
exports.getUserAppointment = async function (idUser, idAppointement) {
  const calandar = await Calendar.findOne({
    userId: idUser,
    "appointments._id": idAppointement,
  });
  return calandar ? true : false;
};

exports.searchUserAppointments = async function (userId, name) {
  // Chercher tous les calendriers du user
  const calendars = await Calendar.find({ userId });

  if (!calendars || calendars.length === 0) return [];

  const results = [];

  calendars.forEach((calendar) => {
    calendar.appointments.forEach((app) => {
      if (app.name && app.name.toLowerCase().includes(name.toLowerCase())) {
        results.push({
          calendarId: calendar._id,
          calendarTitle: calendar.title,
          appointment: app,
        });
      }
    });
  });

  return results;
};

// plusieur calandars

/**
 * 
 * 
 * 

              changelent de getCalendars 


 */
/*
exports.getCalendars = async function (ids) {
  return await Calendar.find({ _id: { $in: ids } }).lean();
};
*/
exports.getCalendars = async function (ids, userId) {
  // 1. Calendriers dont l'utilisateur est propriétaire
  const ownedCalendars = await Calendar.find({ _id: { $in: ids } }).lean();

  // 2. IDs des calendriers partagés
  const sharedRows = await sharedCalendar.find({ userId }).lean();
  const sharedIds = sharedRows.map((s) => s.calendarId);

  // 3. Récupérer les calendriers partagés QUI SONT dans ids
  const sharedCalendars = await Calendar.find({
    _id: { $in: sharedIds.filter((id) => ids.includes(id.toString())) },
  }).lean();

  // 4. Fusionner les résultats (sans doublons)
  const all = [...ownedCalendars, ...sharedCalendars];

  // suppression des doublons par _id
  const map = new Map();
  all.forEach((cal) => map.set(cal._id.toString(), cal));

  return Array.from(map.values());
};

/**
 * Récupère l'ID de l'utilisateur associé à un calendrier donné.
 */
exports.getProfilCal = async function (id_cal) {
  const calendar = await Calendar.findById(id_cal);
  if (!calendar) return null;
  return calendar.userId;
};

/**
 * Vérifie si un calendrier appartient à un utilisateur spécifique.
 * Renvoie le calendrier si trouvé, sinon null.
 */

exports.getUserCalendar = async function (calendarId, userId) {
  let calendar = await Calendar.findOne({ _id: calendarId, userId });
  if (calendar) return calendar;
  const isShared = await sharedCalendar.findOne({
    calendarId: calendarId,
    userId: userId,
  });
  if (isShared) {
    return await Calendar.findById(calendarId);
  }
  return null;
};

/**
 * Renvoie le premier calendrier de user.
 */
exports.getFirstCalendar = async function (userId) {
  const calendar = await Calendar.findOne({ userId: userId });
  return calendar;
};

/**
 * Renvoie les id, titres et couleurs de tous les calendriers d'un utilisateur
 */
/*=========================================================================================changement dans 





            changement dans getAllCalendarsIdsTitles : on affiche les calidriers crées et partagés 





*/
exports.getAllCalendarsIdsTitles = async function (userId) {
  const ownedCalendars = await Calendar.find({ userId })
    .select("_id title color")
    .lean();
  const sharedIds = await sharedCalendar
    .find({ userId })
    .distinct("calendarId");

  const sharedCalendars = await Calendar.find({
    _id: { $in: sharedIds },
  })
    .select("_id title color")
    .lean();

  const all = [...ownedCalendars, ...sharedCalendars];

  const map = new Map();
  all.forEach((cal) => map.set(cal._id.toString(), cal));

  return Array.from(map.values());
};

exports.getCalandar = async function (id_cal) {
  return await Calendar.findById(id_cal);
};

exports.getCalendarById = async function (calendarId) {
  return await Calendar.findById(calendarId).populate("appointments");
};

/**
 * Crée un calendrier pour un utilisateur donné.
 */
exports.createCalendar = async function (
  userId,
  title,
  appointments = [],
  isShared = false
) {
  const colorPalette = [
    "#3498db", // Bleu
    "#2ecc71", // Vert
    "#e74c3c", // Rouge
    "#f1c40f", // Jaune
    "#9b59b6", // Violet
    "#1abc9c", // Turquoise
    "#e67e22", // Orange
    "#34495e", // Gris foncé
    "#ff6b6b", // Rose
    "#16a085", // Vert foncé
  ];

  const userCalendars = await Calendar.find({ userId });
  const usedColors = userCalendars.map((c) => c.color);

  const availableColors = colorPalette.filter((c) => !usedColors.includes(c));
  const color =
    availableColors.length > 0
      ? availableColors[0]
      : colorPalette[Math.floor(Math.random() * colorPalette.length)];

  const newCalendar = new Calendar({
    title,
    color,
    userId,
    appointments,
    isShared,
  });
  return await newCalendar.save();
};

/**
 * Supprime un calendrier pour un utilisateur donné.
 */
exports.deleteCalendar = async function (userId, calendarId) {
  const deletedCalendar = await Calendar.findOneAndDelete({
    _id: calendarId,
    userId: userId,
  });

  return deletedCalendar ? true : false;
};

/**
 * Modifie le titre d'un calendrier pour un utilisateur donné.
 */
exports.updateCalendarTitle = async function (userId, calendarId, newTitle) {
  const updatedCalendar = await Calendar.findOneAndUpdate(
    { _id: calendarId, userId },
    { $set: { title: newTitle } },
    { new: true }
  );
  return updatedCalendar._id;
};

/**
 * Met à jour les informations de profil d'un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur à modifier.
 * @param {Object} data - Les données du profil à mettre à jour.
 * @returns {Promise<Object>} L'utilisateur mis à jour.
 */
exports.modifierProfile = async function (userId, data) {
  const updateData = {};

  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updatedUser;
};

/**
 * Modifie le mot de passe d’un utilisateur après vérification du mot de passe actuel.
 * @param {string} userId - L’ID de l’utilisateur.
 * @param {string} currentPassword - Le mot de passe actuel fourni.
 * @param {string} newPassword - Le nouveau mot de passe à enregistrer.
 * @returns {Promise<string>} - "not_found" | "invalid_password" | "success"
 */

exports.changePassword = async function (userId, currentPassword, newPassword) {
  // Vérifier si l'utilisateur existe via exists()
  const user = await exports.exists({ _id: userId });
  if (!user) return "not_found";

  // Vérifier l'ancien mot de passe
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return "invalid_password";

  // Hasher et mettre à jour le mot de passe
  const hashPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashPassword;
  await user.save();

  return "success";
};

/**
 * Supprime un utilisateur et tous ses calendriers associés.
 * @param {string} userId - L'ID de l'utilisateur à supprimer.
 * @returns {Promise<Object|null>} L'utilisateur supprimé.
 */
exports.supprimerProfile = async function (userId) {
  
    const ownedCalendars = await Calendar.find({ userId })
      .select("_id")
      .lean();

    const ownedIds = ownedCalendars.map(c => c._id);


    if (ownedIds.length > 0) {
      await sharedCalendar.deleteMany({
        calendarId: { $in: ownedIds }
      });

      await Calendar.deleteMany({
        _id: { $in: ownedIds }
      });
    }
    const deletedUser = await User.findByIdAndDelete(userId);

    return deletedUser;

};


// mettre à jour la vue par défaut du calendrier d'un utilisateur
exports.updateUserPreference = async function (userId, defaultView) {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { "calendarPreferences.defaultView": defaultView },
    { new: true, runValidators: true }
  );
  return updatedUser;
};

//==========================================================================================
// PARTAGE AGENDA

// Recherche par début d'email
exports.searchUsersByEmailPrefix = async function (prefix) {
  return User.find(
    { email: { $regex: "^" + prefix, $options: "i" } },
    "_id email firstName lastName"
  );
};

// Partager un calendrier
exports.shareCalendar = async function (calendarId, ownerId, email) {

  receiverId = await User.findOne({email : email});


  const calendar = await Calendar.findOne({
    _id: calendarId,
    userId: ownerId,
  });

  if (!calendar) {
    return null; // ou throw new Error("Unauthorized");
  }

  // 2. Ajouter l'entrée dans sharedCalendar (évite doublons)
  const shared = await sharedCalendar.findOneAndUpdate(
    { calendarId: calendarId, userId: receiverId }, // clé unique
    { $setOnInsert: { role: "viewer" } }, // ajouté seulement si nouveau
    { upsert: true, new: true }
  );

  return shared;
};

// Vérifier que l'utilisateur peut voir le calendrier
exports.getUserCalendarSharedOrOwned = async function (calendarId, userId) {
  return Calendar.findOne({
    _id: calendarId,
    userId: userId,
  });
};

exports.addSharedAppointment = async function (email, appointmentData) {

  const receiverId = await User.findOne({email : email});
  // trouver l’agenda fantôme du receveur RDV partagés
  let sharedCal = await Calendar.findOne({
    userId: receiverId,
    isShared: true,
  });

  // ajouter le rendez-vous
  sharedCal.appointments.push(appointmentData);

  // sauvegarder
  const saved = await sharedCal.save();
  return saved;
};
