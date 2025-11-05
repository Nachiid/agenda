const model = require("../models/model");

/*
 *
 * user est dans req.user.id pas besoin de const userId = await model.getProfilCal(calendarId); ( on verifie si celui connecté peut faire x pas l'inverse hhhhhhhhhhhhhh
 * bug ( n'importe qu'elle user du site vas appartenir a getUserCalendar vus que getProfilCal recupere le user qui a creer cal id ! )
 * *
 *
 *
 *
 *
 *
 *
 *
 * *
 * *
 * *
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
     *a faire : il faut methode dans model qui verifie si user a droit de faire ajouter a cet calendrier - et donc le controlleur verifie ca avant d'appeler addAppointment
     * ne pas toucher a getUserCalendar on vas l'adapter pour chercher si user est owner ou il a droit de creer des rdv  - apres merge
     * *
     *
     *
     *
     * Sprint 2 : on vas donner droit au users en mode editor a faire ce qu'il veulent
     *
     *
     *
     * *
     * *
     * *
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
 *passage par user_id pour voir si on peut supprimer ou pas -> model.deleteAppointment(id_rdv, user_id) donc 
 a faire : il faut methode dans model qui verifie si user a droit de suppa cet rvd - et donc le controlleur verifie ca avant d'appeler addAppointment
     * ne pas toucher a getUserCalendar on vas l'adapter pour chercher si user est owner ou il a droit de creer des rdv  - apres merge
 * *
 * *
 * *
 * *
 * *
 * *dans le sprint prochain on vas ajouter un autre parcours pour savoir si user_id peut faire l'action
 * ------> c'est soit cest le owner du calendrier ou y'as le rdv, soit il existe dans la table shared avec cal_id ( chaque rdv auras comme dataset son id + cal_id)
 *
 * *
 * *
 * *
 * *
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
 *
 * s'assurer que c le bon user qui cherche a updateAppointment les rdv donc model.updateAppointment(id_rdv, data, userId)
 * il faut methode dans model qui verifie si user a droit de faire updateAppointment a cet calendrier - et donc le controlleur verifie ca avant d'appeler model.updateAppointment
 * *
 * * ( c pour eviter ce bug - si calendrier partagé, un autre utilisateur en mode viewer peut recuperer l'id rdv
 * et modifier les rdv d'autre calendrier dont il n'as pas droit) donc on force qu'il soit user_id (pour l'instant) et calendar_id pour faire update rdv_id
 * *
 * *
 * *
 * *dans le sprint prochain on vas ajouter un autre parcours pour savoir si user_id peut faire l'action
 * ------> c'est soit cest le owner du calendrier ou y'as le rdv, soit il existe dans la table shared avec cal_id ( chaque rdv auras comme dataset son id + cal_id)
 * *
 * *
 * *
 * *
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

/*
 *
 * s'assurer que c le bon user qui cherche a avoir les rdv donc model.getCalandar(calendarId, userId) donc
 * il faut methode dans model qui verifie si user a droit de faire updateAppointment a cet calendrier - et donc le controlleur verifie ca avant d'appeler model.updateAppointment
 *
 * + recupere les rendez vous de tous les calendiers dans tab et envoie a l'ecouteur
 * *
 * *
 * *
 * *
 * *tu peux gerer la logique pour recuperer que 5 rdv les plus proché entre les calendriers selectionnées et envoyé un objet qui contient 5 object (cal_id, cal_color, appointement)
 * *
 * *
 * *methode , fonction model qui recupere tous les  calendriers dont id est en parametre
 * * puis faire un flattening -> donc la t'as un tableau avec les colonnes cal_id, cal_titre, cal_color, rdv (1 seul rdv par ligne donc tranquille)
 * * puis trie simple pour garder que les lignes dont les dates sont au futur puis trie par appointement.data...
 * envoie de objet qui contient 5 objet(cal_id, cal_color, appoint) ->   les 5 dates les plus proches - les 5 premiere dans le tableau
 * *
 * * 07 49 13 03 19 pour des renseignement, appeler apres 13h
 * */

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

    const firstFive = sortedAppointments.slice(0, 5);

    return res.status(200).json(firstFive);
  } catch (err) {
    console.error("Erreur getAppointments:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
