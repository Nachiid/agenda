const jwt = require("jsonwebtoken");
const model = require("../models/model");

exports.rajouteAppointment = async (req, res) => {
  try {
    const { calendarId, titre, date_debut, date_fin, description } = req.body;
    //const calendare = await Calendar.findById(calendarId);
    const userId = await model.getProfilCal(calendarId);

    console.log(
      calendarId +
        " " +
        titre +
        " " +
        date_debut +
        " " +
        date_fin +
        " " +
        userId
    );

    if (!calendarId || !titre || !date_debut || !date_fin) {
      console.log(calendarId + " " + titre + " " + date_debut + " " + date_fin);
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

    // Vérification que le calendrier appartient bien à l'utilisateur connecté
    const calendar = await model.getUserCalendar(calendarId, userId);
    if (!calendar) {
      return res
        .status(404)
        .json({ error: "Calendrier introuvable pour cet utilisateur" });
    }

    // Ajouter le rendez-vous
    const updatedCalendar = await model.addAppointment(calendarId, {
      titre,
      date_debut,
      date_fin,
      description,
    });

    return res.status(200).json({
      message: "Rendez-vous ajouté avec succès",
      calendar: updatedCalendar,
    });
  } catch (error) {
    console.error("Erreur addAppointment:", error);
    return res.status(500).json({ error });
  }
};

exports.deletAppointment = async (req, res) => {
  try {
    const { id_rdv } = req.body;
    const rdv = await model.deleteAppointment(id_rdv);
    console.log(rdv);
    if (!rdv) {
      return res.status(404).json({ error: "RDV pas trouvé" });
    }
    return res.status(200).json({ rdv });
  } catch (error) {
    console.error("Erreur deleteAppointment:", error);
    return res.status(500).json({ error });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id_rdv, titre, date_debut, date_fin, description } = req.body;
    if (!id_rdv) {
      return res.status(400).json({ error: "L'ID du RDV est requis" });
    }
    const updatedRdv = await model.updateAppointment(id_rdv, {
      titre,
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
