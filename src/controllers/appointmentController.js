const model = require("../models/model");

exports.rajouteAppointment = async (req, res) => {
  try {
    const { calendarId, name, date_debut, date_fin, description } = req.body;
    const userId = await model.getProfilCal(calendarId);

    if (!calendarId || !name || !date_debut || !date_fin) {
      return res
        .status(400)
        .json({ error: "manque d'inforamtion pour créer un rdv" });
    }

    // vérification les date
    const start = new Date(date_debut);
    const end = new Date(date_fin);

    if (start >= end) {
      return res
        .status(400)
        .json({ error: "date de debut doit etre avent la date de fin !" });
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
    const cldr = await model.getUserAppointment(userID, id_rdv);
    const rdv = await model.deleteAppointment(id_rdv);
    if (!rdv) {
      return res.status(404).json({ error: "RDV pas trouvé" });
    } else if (!cldr) {
      return res
        .status(500)
        .json({ error: "RDV n'appartient pas a ce utilisateur " });
    }
    return res.status(200).json({ rdv });
  } catch (error) {
    return res.status(500).json({ error });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id_rdv, name, date_debut, date_fin, description } = req.body;
    const userID = req.user.id;
    const cldr = await model.getUserAppointment(userID, id_rdv);
    if (!id_rdv) {
      return res.status(400).json({ error: "L'ID du RDV est requis" });
    } else if (!cldr) {
      return res
        .status(500)
        .json({ error: "RDV n'appartient pas a ce utilisateur " });
    }
    const updatedRdv = await model.updateAppointment(id_rdv, {
      name,
      date_debut,
      date_fin,
      description,
    });
    if (!updatedRdv) {
      return res.status(404).json({ error: "RDV pas trouvé" });
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

    // Récupération de tous les calendriers
    //const calendars = await model.getCalendars(calendarIds);
    //POUR AFFICHER LES RDV SUR EVENT A VENIR
    const calendars = await model.getCalendars(req.user.id, calendarIds);

    const now = new Date();

    const allAppointments = calendars
      .flatMap((cal) => {
        // Si cal.appointments est undefined ou vide
        const appointments = Array.isArray(cal.appointments)
          ? cal.appointments
          : [];
        return appointments.map((event) => ({
          ...event,
          calendar_id: cal._id.toString(), // ou cal.cal_id selon ton modèle
        }));
      })
      .filter((a) => new Date(a.date_debut) >= now) // rdv futurs
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
    const { receiverId, appointment } = req.body;

    if (!receiverId || !appointment) {
      return res.status(400).json({ error: "Données manquantes." });
    }

    // Appel du modèle (logique dans model.js)
    const updatedCalendar = await model.addSharedAppointment(
      receiverId,
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
