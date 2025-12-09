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
    isRecurent: appointmentData.isRecurent || [],
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
exports.softDeleteAppointment = async function (
  id_rdv,
  userId,
  date_to_exclude = null
) {
  // Récupération du calendrier contenant le rendez-vous
  const calendar = await Calendar.findOne({ "appointments._id": id_rdv });
  if (!calendar) return false;

  // Vérifier si l'utilisateur est propriétaire
  const isOwner = calendar.userId.toString() === userId.toString();
  let isEditor = false;

  // Si pas propriétaire : vérifier dans SharedCalendar
  if (!isOwner) {
    const shared = await sharedCalendar.findOne({
      calendarId: calendar._id,
      userId: userId,
      role: "Editor",
    });

    if (shared) isEditor = true;

    // Si ni owner ni Editor (ex: Viewer), on ne fait rien
    if (!isEditor) return false;
  }

  // Si une date spécifique est fournie pour une exclusion (récurrence)
  if (date_to_exclude) {
    const excludeDateObj = new Date(date_to_exclude);

    // On trouve le rdv
    const appointment = calendar.appointments.find(
      (a) => a._id.toString() === id_rdv
    );

    if (
      appointment &&
      appointment.isRecurent &&
      appointment.isRecurent.length > 0
    ) {
      // On ajoute la date aux exclusions
      appointment.isRecurent[0].excludedDates.push(excludeDateObj);
      await calendar.save();
      return { _id: id_rdv, excluded: true };
    }
  }

  // Soft delete du rendez-vous (suppression totale)
  const result = await Calendar.updateOne(
    { "appointments._id": id_rdv },
    {
      $set: {
        "appointments.$[elem].actif": false,
        "appointments.$[elem].date_supp": new Date(),
      },
    },
    { arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(id_rdv) }] }
  );

  return result.modifiedCount > 0 ? { _id: id_rdv } : false;
};

/**
 * Restaure un rendez-vous qui était en corbeille en utilisant une mise à jour atomique.
 */
exports.restoreAppointment = async function (id_rdv) {
  const result = await Calendar.updateOne(
    { "appointments._id": id_rdv, "appointments.actif": false },
    {
      $set: {
        "appointments.$[elem].actif": true,
        "appointments.$[elem].date_supp": null,
      },
    },
    { arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(id_rdv) }] }
  );
  const calendar = await Calendar.findOne(
    { "appointments._id": id_rdv },
    { "appointments.$": 1 }
  ).lean();
  return calendar?.appointments[0] || null;
};

/**
 * Met à jour un rendez-vous existant dans un calendrier.
 * Modifie les champs titre, dates et description si présents dans les données fournies.
 */
exports.updateAppointment = async function (
  id_rdv,
  data,
  userId,
  calendarId,
  date_to_exclude = null
) {
  // Vérifier d'abord si ce calendrier existe
  const calendar = await Calendar.findById(calendarId);
  if (!calendar) {
    return false;
  }
  // Vérifier si l'utilisateur est propriétaire
  const isOwner = calendar.userId.toString() === userId.toString();

  let isEditor = false;

  // Si pas propriétaire vérifier le rôle dans SharedCalendar
  if (!isOwner) {
    const shared = await sharedCalendar.findOne({
      calendarId: calendarId,
      userId: userId,
      role: "Editor",
    });

    if (shared) isEditor = true;

    // Si ni Owner ni Editor → accès refusé
    if (!isEditor) return false;
  }

  // Localiser le rendez-vous dans le calendrier
  const index = calendar.appointments.findIndex(
    (a) => a._id.toString() === id_rdv
  );
  if (index === -1) return false;

  const rdv = calendar.appointments[index];

  // Cas spécial : modification d'une occurrence spécifique d'une récurrence
  if (date_to_exclude && rdv.isRecurent && rdv.isRecurent.length > 0) {
    // 1. Exclure la date de l'original
    rdv.isRecurent[0].excludedDates.push(new Date(date_to_exclude));

    // 2. Créer un nouveau RDV avec les nouvelles données
    const newAppointment = {
      name: data.name || rdv.name,
      date_debut: data.date_debut || new Date(date_to_exclude), // Si date changée, ok, sinon date de l'occurrence
      date_fin: data.date_fin, // Doit être calculée correctement par le front
      description:
        data.description !== undefined ? data.description : rdv.description,
      isRecurent: [], // Le nouveau n'est pas récurrent par défaut (sauf si l'user le demande, mais ici on gère l'exception simple)
      actif: true,
    };

    // Si l'utilisateur a redéfini une récurrence pour cette exception (split series), ce serait plus complexe
    // Ici on suppose qu'on détache l'occurrence pour en faire un event unique.
    if (data.isRecurent) {
      newAppointment.isRecurent = data.isRecurent;
    }

    calendar.appointments.push(newAppointment);
    await calendar.save();

    // On retourne le NOUVEAU rdv pour affichage
    return calendar.appointments[calendar.appointments.length - 1];
  }

  // Mise à jour des champs modifiés (cas normal ou série entière)
  if (data.name !== undefined) rdv.name = data.name;
  if (data.date_debut !== undefined) rdv.date_debut = new Date(data.date_debut);
  if (data.date_fin !== undefined) rdv.date_fin = new Date(data.date_fin);
  if (data.description !== undefined) rdv.description = data.description;
  if (data.isRecurent !== undefined) rdv.isRecurent = data.isRecurent;

  // Sauvegarde
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
  // Chercher tous les calendriers actifs du user
  const calendars = await Calendar.find({ userId, actif: true });

  if (!calendars || calendars.length === 0) return [];

  const results = [];

  calendars.forEach((calendar) => {
    calendar.appointments.forEach((app) => {
      // On ne cherche que dans les rdv actifs
      if (
        app.actif &&
        app.name &&
        app.name.toLowerCase().includes(name.toLowerCase())
      ) {
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
exports.getCalendars = async function (ids, userId) {
  // 1. Calendriers dont l'utilisateur est propriétaire
  const ownedCalendars = await Calendar.find({
    _id: { $in: ids },
    userId: userId,
    actif: true,
  }).lean();

  // 2. IDs des calendriers partagés
  const sharedRows = await sharedCalendar.find({ userId }).lean();
  const sharedIds = sharedRows.map((s) => s.calendarId);

  // 3. Récupérer les calendriers partagés QUI SONT dans ids
  const sharedCalendars = await Calendar.find({
    _id: { $in: sharedIds.filter((id) => ids.includes(id.toString())) },
    actif: true,
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
  // Vérifier si l'utilisateur est propriétaire
  let calendar = await Calendar.findOne(
    { _id: calendarId, userId, actif: true },
    {
      appointments: 1,
      title: 1,
      color: 1,
      userId: 1,
      isShared: 1,
      mode: 1,
      actif: 1,
      date_supp: 1,
    }
  ).lean();

  if (calendar) {
    // Filtrer les rendez-vous actifs
    calendar.appointments = calendar.appointments.filter(
      (a) => a.actif !== false
    );
    return { ...calendar, role: "owner" };
  }

  // Vérifier si le calendrier est partagé avec l'utilisateur
  const sharedEntry = await sharedCalendar
    .findOne({
      calendarId: calendarId,
      userId: userId,
    })
    .lean();

  if (sharedEntry) {
    const sharedCalendarData = await Calendar.findOne({
      _id: calendarId,
      actif: true,
    }).lean();

    if (!sharedCalendarData) return null;

    // Filtrer les rendez-vous actifs
    sharedCalendarData.appointments = sharedCalendarData.appointments.filter(
      (a) => a.actif !== false
    );

    return { ...sharedCalendarData, role: sharedEntry.role || "viewer" };
  }

  // Aucun accès
  return null;
};

/**
 * Renvoie le premier calendrier de user.
 */
exports.getFirstCalendar = async function (userId) {
  const calendar = await Calendar.findOne({
    userId: userId,
    actif: true,
  }).lean();
  if (calendar && calendar.appointments) {
    calendar.appointments = calendar.appointments.filter((app) => app.actif);
  }
  return calendar;
};

/**
 * Renvoie les id, titres et couleurs de tous les calendriers d'un utilisateur
 */
exports.getAllCalendarsIdsTitles = async function (userId) {
  //  Calendriers possédés actifs
  const ownedCalendars = await Calendar.find({ userId, actif: true })
    .select("_id title color mode")
    .lean();

  const ownedWithRole = ownedCalendars.map((cal) => ({
    ...cal,
    role: "Owner",
  }));

  //  Calendriers partagés
  const sharedEntries = await sharedCalendar
    .find({ userId })
    .select("calendarId role")
    .lean();

  const sharedIds = sharedEntries.map((e) => e.calendarId);

  const sharedCalendars = await Calendar.find({
    _id: { $in: sharedIds },
    actif: true,
  })
    .select("_id title color mode")
    .lean();

  const sharedWithRole = sharedCalendars.map((cal) => {
    const entry = sharedEntries.find(
      (e) => e.calendarId.toString() === cal._id.toString()
    );
    return { ...cal, role: entry?.role || "viewer" };
  });

  // Combiner et retirer doublons éventuels
  const all = [...ownedWithRole, ...sharedWithRole];
  const map = new Map();
  all.forEach((cal) => map.set(cal._id.toString(), cal));

  return Array.from(map.values());
};

exports.getCalandar = async function (id_cal) {
  return await Calendar.findOne({ _id: id_cal, actif: true });
};

exports.getCalendarById = async function (calendarId) {
  const calendar = await Calendar.findOne({
    _id: calendarId,
    actif: true,
  }).lean();
  if (calendar && calendar.appointments) {
    calendar.appointments = calendar.appointments.filter((app) => app.actif);
  }
  return calendar;
};

/**
 * Crée un calendrier pour un utilisateur donné.
 */
exports.createCalendar = async function (
  userId,
  title,
  mode,
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
    mode,
    appointments,
    isShared,
  });
  return await newCalendar.save();
};

/**
 * Marque un calendrier comme inactif (suppression réversible).
 */

exports.softDeleteCalendar = async function (userId, calendarId) {
  // Vérifier si le user est propriétaire
  const calendar = await Calendar.findOne({ _id: calendarId, userId: userId });

  if (calendar) {
    // Owner → soft delete
    await Calendar.findOneAndUpdate(
      { _id: calendarId, userId: userId },
      { $set: { actif: false, date_supp: new Date() } }
    );

    // Supprimer toutes les entrées de partage associées
    await sharedCalendar.deleteMany({ calendarId: calendarId });

    return true;
  }

  // Si pas owner, supprimer seulement l'entrée sharedCalendar si existante
  const sharedEntry = await sharedCalendar.findOne({
    calendarId: calendarId,
    userId: userId,
  });

  if (!sharedEntry) {
    return false;
  }

  // Editor ou Viewer → suppression de l'entrée shared seulement
  await sharedCalendar.deleteOne({ calendarId: calendarId, userId: userId });

  return true;
};

/**
 * Restaure un calendrier qui était en corbeille.
 */
exports.restoreCalendar = async function (userId, calendarId) {
  return await Calendar.findOneAndUpdate(
    { _id: calendarId, userId: userId, actif: false },
    { $set: { actif: true, date_supp: null } },
    { new: true }
  );
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
 */
exports.supprimerProfile = async function (userId) {
  const ownedCalendars = await Calendar.find({ userId }).select("_id").lean();

  const ownedIds = ownedCalendars.map((c) => c._id);

  if (ownedIds.length > 0) {
    await sharedCalendar.deleteMany({
      calendarId: { $in: ownedIds },
    });

    await Calendar.deleteMany({
      _id: { $in: ownedIds },
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
exports.shareCalendar = async function (
  calendarId,
  ownerId,
  email,
  role = "viewer"
) {
  const receiver = await User.findOne({ email: email });
  if (!receiver) return null; // ou throw new Error("Utilisateur introuvable");

  const calendar = await Calendar.findOne({
    _id: calendarId,
    userId: ownerId,
  });
  if (!calendar) return null; // ou throw new Error("Unauthorized");

  // Vérifie si déjà partagé et récupère le rôle existant
  const shared = await sharedCalendar.findOneAndUpdate(
    { calendarId: calendarId, userId: receiver._id }, // clé unique
    { $setOnInsert: { role: role } }, // insertion seulement si nouveau
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
  const receiverId = await User.findOne({ email: email });
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

//===================================================================================
// GESTION DE LA CORBEILLE

/**
 * Récupère tous les éléments (calendriers et rdv) supprimés par un utilisateur
 * il y a moins de 30 jours.
 */
exports.getTrash = async function (userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Récupérer les calendriers inactifs
  const deletedCalendars = await Calendar.find({
    userId,
    actif: false,
    date_supp: { $gte: thirtyDaysAgo },
  }).lean();

  // 2. Récupérer les rendez-vous inactifs dans tous les calendriers de l'utilisateur
  const calendarsWithDeletedAppointments = await Calendar.find({
    userId,
    "appointments.actif": false,
    "appointments.date_supp": { $gte: thirtyDaysAgo },
  }).lean();

  const deletedAppointments = calendarsWithDeletedAppointments.flatMap((cal) =>
    cal.appointments
      .filter((app) => !app.actif && new Date(app.date_supp) >= thirtyDaysAgo)
      .map((app) => ({ ...app, calendarTitle: cal.title, calendarId: cal._id }))
  );

  // 3. Ajouter les rendez-vous inactifs des calendriers partagés où user est Editor
  const sharedCalendars = await sharedCalendar
    .find({
      userId,
      role: "Editor",
    })
    .lean();

  if (sharedCalendars.length > 0) {
    const sharedCalendarIds = sharedCalendars.map((sc) => sc.calendarId);

    const sharedCalendarsWithDeletedAppointments = await Calendar.find({
      _id: { $in: sharedCalendarIds },
      "appointments.actif": false,
      "appointments.date_supp": { $gte: thirtyDaysAgo },
    }).lean();

    const deletedSharedAppointments =
      sharedCalendarsWithDeletedAppointments.flatMap((cal) =>
        cal.appointments
          .filter(
            (app) => !app.actif && new Date(app.date_supp) >= thirtyDaysAgo
          )
          .map((app) => ({
            ...app,
            calendarTitle: cal.title,
            calendarId: cal._id,
          }))
      );

    deletedAppointments.push(...deletedSharedAppointments);
  }

  return {
    calendars: deletedCalendars,
    appointments: deletedAppointments,
  };
};

/**
 * Supprime définitivement les éléments en corbeille depuis plus de 30 jours.
 * Ceci est destiné à être exécuté périodiquement (ex: via une tâche cron).
 */
exports.purgeOldItems = async function () {
  const limitDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Supprimer définitivement les vieux calendriers inactifs
  await Calendar.deleteMany({
    actif: false,
    date_supp: { $lte: limitDate },
  });

  // 2. Supprimer définitivement les vieux rdv inactifs dans les calendriers actifs
  await Calendar.updateMany(
    {
      "appointments.actif": false,
      "appointments.date_supp": { $lte: limitDate },
    },
    {
      $pull: { appointments: { actif: false, date_supp: { $lte: limitDate } } },
    }
  );
};
