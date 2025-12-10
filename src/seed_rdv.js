require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { User, Calendar } = require("./models/db");
const connectDB = require("./models/connexionDB");

async function addAppointmentsByEmail(email) {
  try {
    await connectDB();
    console.log("Connecté à MongoDB");

    // Recherche de l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Utilisateur avec email "${email}" introuvable.`);
      return;
    }

    // Récupération des calendriers
    const calendars = await Calendar.find({ userId: user._id });
    if (!calendars.length) {
      console.log("Aucun calendrier trouvé pour cet utilisateur.");
      return;
    }

    // Titres aléatoires
    const randomTitles = [
      "Réunion équipe",
      "Appel client",
      "Médecin",
      "Sport",
      "Sortie",
      "Formation",
      "Déjeuner",
      "Projet ",
      "Préparation ",
      "Visite",
    ];

    for (const calendar of calendars) {
      const newAppointments = [];


      // Génération RDV
      const today = new Date();

      for (let i = 0; i < 50; i++) {
        // Nombre de jours aléatoires autour d’aujourd’hui
        const offsetDays = Math.floor(Math.random() * 61) - 30;

        const start = new Date(today);
        start.setDate(today.getDate() + offsetDays);

        // Heure de début aléatoire entre 8h et 16h
        start.setHours(8 + Math.floor(Math.random() * 9), 0, 0, 0);

        // Fin entre 1h et 3h après le début
        const end = new Date(start);
        end.setHours(start.getHours() + (1 + Math.floor(Math.random() * 3)));

        const randomTitle =
          randomTitles[Math.floor(Math.random() * randomTitles.length)];

        newAppointments.push({
          name: `${randomTitle}`,
          date_debut: start,
          date_fin: end,
          description: `Rendez-vous lié à "${randomTitle}" programmé le ${start.toLocaleDateString()} à ${start.getHours()}h.`,
          actif: true,
          isRecurent: [],
        });
      }

      // Sauvegarde du calendrier
      calendar.appointments.push(...newAppointments);
      await calendar.save();

      console.log(
        `${newAppointments.length} RDV ajoutés à "${calendar.title}"`
      );
    }
  } catch (err) {
    console.error("Erreur lors de l’insertion des rendez-vous :", err);
  } finally {
    await mongoose.disconnect();
    console.log("Déconnecté de MongoDB");
  }
}

const email_aymen = "aymen@test.com";
const email_youcef = "youcef@test.com";
addAppointmentsByEmail(email_aymen);
