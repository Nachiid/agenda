const model = require("../models/model");

/*
 *
 * */
exports.rajouteAppointment = async (req, res) => {
  try {
    const { calendarId, name, date_debut, date_fin, description } = req.body;
    //const calendare = await Calendar.findById(calendarId);
    const userId = await model.getProfilCal(calendarId);

    console.log(
      "1 " +
        calendarId +
        " " +
        name +
        " " +
        date_debut +
        " " +
        date_fin +
        " " +
        userId
    );

    if (!calendarId || !name || !date_debut || !date_fin) {
      console.log(calendarId + " " + name + " " + date_debut + " " + date_fin);
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

    /*
     * */
    const calendar = await model.getUserCalendar(calendarId, userId);
    if (!calendar) {
      return res
        .status(404)
        .json({ error: "Calendrier introuvable pour cet utilisateur" });
    }

    // Ajouter le rendez-vous
    const updatedCalendar = await model.addAppointment(calendarId, {
      name,
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

/*
 * */
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

/*
 * */

exports.updateAppointment = async (req, res) => {
  try {
    const { id_rdv, name, date_debut, date_fin, description } = req.body;
    if (!id_rdv) {
      return res.status(400).json({ error: "L'ID du RDV est requis" });
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
    const { calendarId } = req.params;

    const calendar = await model.getCalandar(calendarId);
    if (!calendar) {
      return res.status(404).json({ error: "Calendrier introuvable" });
    }
    const now = new Date();
    const upcoming = calendar.appointments.filter(
      (a) => new Date(a.date_debut) >= now
    );
    const sortedAppointments = upcoming.sort(
      (a, b) => new Date(a.date_debut) - new Date(b.date_debut)
    );

    const firstFive = sortedAppointments.slice(0, 3);

    return res.status(200).json(firstFive);
  } catch (err) {
    console.error("Erreur getAppointments:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
