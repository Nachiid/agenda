require("dotenv").config({ path: "../.env" });
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

    // Créer 3 calendriers par utilisateur
    const calendarTypes = [
      { title: "perso", color: "#3498db" },
      { title: "amis", color: "#2ecc71" },
      { title: "famille", color: "#e74c3c" },
      { title: "travail", color: "#34495e"},
      { title: "Rendez-vous partagés", color: "#grey" , isShared : true},

    ];

    const calendars = [];
    for (const user of createdUsers) {
      for (const t of calendarTypes) {
        // Générer des rendez-vous aléatoires pour l'utilisateur "aymen"
        const appointments = [];
        if (user.firstName.toLowerCase() === "aymen") {
          for (let i = 0; i < 5; i++) {
            const start = new Date();
            start.setDate(start.getDate() + i); // aujourd'hui + i jours
            start.setHours(9 + i, 0); // heure de début 9h + i
            const end = new Date(start);
            end.setHours(end.getHours() + 1); // durée 1h
            appointments.push({
              name: `Rendez-vous ${i + 1}`,
              date_debut: start,
              date_fin: end,
              description: `Description du rendez-vous ${i + 1}`,
            });
          }
        }

        calendars.push({
          title: t.title,
          color: t.color,
          userId: user._id,
          appointments,
        });
      }
    }

    await Calendar.insertMany(calendars);
    console.log(
      "Calendriers créés avec rendez-vous pour l’utilisateur Aymen"
    );
  } catch (err) {
    console.error("Erreur pendant le seedAll :", err);
  } finally {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
    console.log("Déconnecté de MongoDB");
  }
}

seedAll();
