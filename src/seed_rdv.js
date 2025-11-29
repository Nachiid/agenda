require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { User, Calendar } = require("./models/db");
const connectDB = require("./models/connexionDB");

async function addAppointmentsByEmail(email) {
  try {
    await connectDB();
    console.log("Connecté à MongoDB");

    // 🔍 Recherche de l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Utilisateur avec email "${email}" introuvable.`);
      return;
    }

    // 📅 Récupération des calendriers
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
      "Sortie famille",
      "Formation",
      "Déjeuner pro",
      "Projet personnel",
      "Préparation dossier",
      "Visite partenaire",
    ];

    for (const calendar of calendars) {
  const newAppointments = [];

  // 🔧 IMPORTANT : corriger les anciens calendriers sans `mode`
  if (!calendar.mode) {
    calendar.mode = calendar.title === "travail" ? "entreprise" : "perso";
  }

  // Génération RDV
  for (let monthOffset = -1; monthOffset <= 5; monthOffset++) {
    for (let i = 0; i < 10; i++) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() + monthOffset);
      baseDate.setDate(Math.floor(Math.random() * 25) + 1);
      baseDate.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0);

      const start = new Date(baseDate);
      const end = new Date(start);
      end.setHours(start.getHours() + (1 + Math.floor(Math.random() * 2)));

      const randomTitle =
        randomTitles[Math.floor(Math.random() * randomTitles.length)];

      newAppointments.push({
        name: `${randomTitle} (${calendar.title})`,
        date_debut: start,
        date_fin: end,
        description: `Rendez-vous lié à "${randomTitle}" programmé le ${start.toLocaleDateString()} à ${start.getHours()}h.`,
        actif: true,
        isRecurent: [],
      });
    }
  }

  // Sauvegarde du calendrier
  calendar.appointments.push(...newAppointments);
  await calendar.save();

  console.log(`${newAppointments.length} RDV ajoutés à "${calendar.title}"`);
}

  } catch (err) {
    console.error("Erreur lors de l’insertion des rendez-vous :", err);
  } finally {
    await mongoose.disconnect();
    console.log("Déconnecté de MongoDB");
  }
}

// Exemple d'utilisation
const email = "aymen@test.com";
addAppointmentsByEmail(email);
