const model = require("../models/model");

exports.showFirstCalendar = async (req, res) => {
  try {
    const userID = req.user.id;

    const calendar = await model.getFirstCalendar(userID);
    return res.status(200).json({ calendar: calendar });
  } catch (error) {
    console.error("Erreur showCalendar:", error);
    return res.status(500).json({ error });
  }
};

exports.showCalendar = async (req, res) => {
  try {
    const { calendarIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(calendarIds) || calendarIds.length === 0) {
      return res.status(400).json({ error: "Aucun calendrier demandé." });
    }

    const calendars = [];
    for (const id of calendarIds) {
      //apres
      const cal = await model.getUserCalendar(id, userId);
      if (cal) calendars.push(cal);
    }

    return res.status(200).json({ calendars });
  } catch (error) {
    console.error("Erreur showCalendar:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

exports.getAllCalendarsIdsTitles = async (req, res) => {
  try {
    const userID = req.user.id;
    //envoie du mode dans body ( actif ou pas actif)
    const calendars = await model.getAllCalendarsIdsTitles(userID); // + argument actif ou pas 0/1 test
    return res.status(200).json({ calendars });
  } catch (error) {
    console.error("Erreur getAllCalendars:", error);
    return res.status(500).json({
      error: "Erreur serveur lors de la récupération des calendriers",
    });
  }
};

exports.deleteCalendar = async (req, res) => {
  try {
    const userID = req.user.id;
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "calendarId est requis" });
    }

    const userCalendars = await model.getAllCalendarsIdsTitles(userID);

    if (userCalendars.length <= 1) {
      return res
        .status(400)
        .json({ error: "Impossible de supprimer le dernier calendrier" });
    }

    const deleted = await model.deleteCalendar(userID, id);

    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Calendrier introuvable ou non autorisé" });
    }

    return res.status(200).json({ message: "Calendrier supprimé avec succès" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression du calendrier" });
  }
};

/**
 * Met à jour le titre d'un calendrier pour l'utilisateur connecté
 */
exports.updateCalendarTitle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { calendarId, newTitle } = req.body;

    if (!calendarId || !newTitle) {
      return res
        .status(400)
        .json({ error: "calendarId et newTitle sont requis" });
    }

    const updatedCalendarId = await model.updateCalendarTitle(
      userId,
      calendarId,
      newTitle
    );

    if (!updatedCalendarId) {
      return res
        .status(404)
        .json({ error: "Calendrier introuvable ou non autorisé" });
    }

    return res.status(200).json({
      message: "Titre mis à jour avec succès",
      calendarId: updatedCalendarId,
    });
  } catch (error) {
    console.error("Erreur updateCalendarTitle:", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la mise à jour du calendrier" });
  }
};

/**
 * Crée un nouveau calendrier pour l'utilisateur connecté.
 */
exports.addCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, mode } = req.body;

    if (!title || !mode) {
      return res
        .status(400)
        .json({ error: "Le titre et le type du calendrier sont requis" });
    }

    const newCalendar = await model.createCalendar(userId, title, mode, []);

    return res.status(201).json({
      message: title + "a été créé ",
      calendar: newCalendar,
    });
  } catch (error) {
    console.error("Erreur addCalendar:", error);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors de la création du calendrier" });
  }
};

//==========================================================================================
// PARTAGE AGENDA
// Recherche des utilisateurs (email prefix)
exports.searchUsers = async (req, res) => {
  try {
    const { prefix } = req.query;
    if (!prefix) return res.status(400).json({ error: "Préfixe requis" });

    const users = await model.searchUsersByEmailPrefix(prefix);
    return res.status(200).json({ users });
  } catch (err) {
    console.error("searchUsers error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

// Partager un calendrier
exports.shareCalendar = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { calendarId, email } = req.body;

    if (!calendarId || !email) {
      return res.status(400).json({ error: "Données invalides" });
    }

    const result = await model.shareCalendar(calendarId, ownerId, email);

    if (!result)
      return res
        .status(404)
        .json({ error: "Calendrier introuvable ou non autorisé" });

    return res.status(200).json({ message: "Calendrier partagé avec succès" });
  } catch (error) {
    console.error("shareCalendar error:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
