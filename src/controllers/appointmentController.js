const model = require("../models/model");

exports.rajouteAppointment = async (req, res) => {
  try {
    const { calendarId, name, date_debut, date_fin, description, isRecurent } =
      req.body;
    const userId = await model.getProfilCal(calendarId);

    if (!calendarId || !name || !date_debut || !date_fin) {
      return res
        .status(400)
        .json({ error: "manque d'inforamtion pour créer un rdv" });
    }

    if (name.length > 20) {
      return res.status(400).json({
        error: "Le nom du rendez-vous ne doit pas dépasser 20 caractères.",
      });
    }

    // vérification les date
    const start = new Date(date_debut);
    const end = new Date(date_fin);

    if (start >= end) {
      return res
        .status(400)
        .json({ error: "date de debut doit etre avant la date de fin !" });
    }
    const calendar = await model.getUserCalendar(calendarId, userId);
    if (!calendar) {
      return res
        .status(404)
        .json({ error: "Calendrier introuvable pour cet utilisateur" });
    }

    // Ajouter le rendez-vous
    const insertedAppointment = await model.addAppointment(calendarId, {
      name,
      date_debut,
      date_fin,
      description,
      isRecurent,
    });

    return res.status(200).json({
      message: "Rendez-vous ajouté avec succès",
      rdv: insertedAppointment,
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

exports.deletAppointment = async (req, res) => {
  try {
    const { id_rdv } = req.body;
    const userID = req.user.id;
    const rdv = await model.deleteAppointment(id_rdv, userID);

    if (!rdv) {
      return res.status(404).json({
        error: "Vous n'avez pas le droit de supprimer ce rendez-vous",
      });
    }

    return res.status(200).json({ rdv });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const {
      id_rdv,
      name,
      date_debut,
      date_fin,
      description,
      calendarId,
      isRecurent,
      date_to_exclude,
    } = req.body;
    const userID = req.user.id;
    if (!id_rdv) {
      return res.status(400).json({ error: "L'id du rendez-vous est requis" });
    }

    if (name.length > 20) {
      return res.status(400).json({
        error: "Le nom du rendez-vous ne doit pas dépasser 20 caractères.",
      });
    }

    const updatedRdv = await model.updateAppointment(
      id_rdv,
      {
        name,
        date_debut,
        date_fin,
        description,
        isRecurent,
      },
      userID,
      calendarId,
      date_to_exclude
    );

    if (!updatedRdv) {
      return res
        .status(404)
        .json({ error: "Vous avez pas le droit à effectuer cette action" });
    }
    return res
      .status(200)
      .json({ message: "RDV mis à jour avec succès", rdv: updatedRdv });
  } catch (error) {
    console.error("Erreur updateAppointment:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { calendarIds } = req.body;

    const userID = req.user.id;

    // Récupération de tous les calendriers
    const calendars = await model.getCalendars(calendarIds, userID);

    const now = new Date();

    const allAppointments = calendars
      .flatMap((cal) => {
        // Si cal.appointments est undefined ou vide
        const appointments = Array.isArray(cal.appointments)
          ? cal.appointments
          : [];
        return appointments.map((event) => ({
          ...event,
          calendar_id: cal._id.toString(),
        }));
      })
      .filter((a) => new Date(a.date_debut) >= now)
      .sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));

    const first = allAppointments.slice(0, 10);

    return res.status(200).json(first);
  } catch (err) {
    console.error("Erreur getAppointments:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
exports.searchAppointment = async (req, res) => {
  try {
    const { appointments_name } = req.body;
    const userID = req.user.id;

    if (!appointments_name) {
      return res.status(400).json({ error: "Nom du rendez-vous requis" });
    }
    const results = await model.searchUserAppointments(
      userID,
      appointments_name
    );
    if (!results) {
      return res.status(404).json({ message: "Aucun rendez-vous trouvé" });
    }
    return res.status(200).json({ appointments: results });
  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.shareAppointment = async (req, res) => {
  try {
    const { email, appointment } = req.body;

    if (!email || !appointment) {
      return res.status(400).json({ error: "Données manquantes." });
    }

    // Appel du modèle (logique dans model.js)
    const updatedCalendar = await model.addSharedAppointment(
      email,
      appointment
    );

    return res.json({
      success: true,
      calendar: updatedCalendar,
    });
  } catch (err) {
    console.error("Erreur shareAppointment :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
