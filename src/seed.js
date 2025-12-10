require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const connectDB = require("./models/connexionDB");
const model = require("./models/model");

const { User, Calendar } = require("./models/db");

async function seedAll() {
  try {
    await connectDB();
    console.log("Connecté à MongoDB");

    // Vider les collections
    await User.deleteMany({});
    await Calendar.deleteMany({});
    console.log("Collections vidées");

    // Utilisateurs à créer
    const usersData = [
      {
        firstName: "younes",
        lastName: "younes",
        email: "younes@test.com",
        password: "younesyounes",
      },
      {
        firstName: "yassir",
        lastName: "yassir",
        email: "yassir@test.com",
        password: "yassiryassir",
      },
      {
        firstName: "aymen",
        lastName: "aymen",
        email: "aymen@test.com",
        password: "aymenaymen",
      },
      {
        firstName: "youcef",
        lastName: "youcef",
        email: "youcef@test.com",
        password: "youcefyoucef",
      },
    ];

    const createdUsers = [];

    // Créer les utilisateurs via le model sécurisé (hash password)
    for (const u of usersData) {
      const user = await model.register(
        u.firstName,
        u.lastName,
        u.email,
        u.password
      );
      createdUsers.push(user);
      console.log("-> utilisateur créé :", user.email);
    }

    // Types de calendriers à créer
    const calendarTypes = [
      { title: "Partagés", color: "#d63031", isShared: true, mode: "permanent" },
      { title: "personnel", color: "#3498db", mode: "personnel" },
      { title: "amis", color: "#2ecc71", mode: "personnel" },
      { title: "famille", color: "#e67e22", mode: "personnel" },
      { title: "travail", color: "#34495e", mode: "entreprise" },
    ];

    const calendarsToInsert = [];

    // Création des calendriers
    for (const user of createdUsers) {
      for (const t of calendarTypes) {
        const appointments = [];

        // Générer 5 rendez-vous pour AYMER
        if (user.firstName.toLowerCase() === "aymen") {
          for (let i = 0; i < 5; i++) {
            const start = new Date();
            start.setDate(start.getDate() + i);
            start.setHours(9 + i, 0);

            const end = new Date(start);
            end.setHours(end.getHours() + 1);

            appointments.push({
              name: `Rendez-vous ${i + 1}`,
              date_debut: start,
              date_fin: end,
              description: `Description du rendez-vous ${i + 1}`,
              actif: true,
              isRecurent: [], // conforme à ton nouveau schéma
            });
          }
        }

        calendarsToInsert.push({
          title: t.title,
          color: t.color,
          userId: user._id,
          appointments,
          mode: t.mode,
          isShared: t.isShared || false,
          sharedWith: [], // vide par défaut
        });
      }
    }

    await Calendar.insertMany(calendarsToInsert);

    console.log("Calendriers créés avec rendez-vous pour l’utilisateur Aymen");

  } catch (err) {
    console.error("Erreur pendant le seedAll :", err);
  } finally {
    await mongoose.disconnect();
    console.log("Déconnecté de MongoDB");
  }
}

seedAll();
