require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { User, Calendar } = require('./models/db');
const connectDB = require('./models/connexionDB');

async function addAppointmentsByEmail(email) {
  try {
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    // Récupérer l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Utilisateur avec email "${email}" introuvable.`);
      return;
    }

    // Récupérer tous les calendriers de l'utilisateur
    const calendars = await Calendar.find({ userId: user._id });
    if (!calendars.length) {
      console.log("Aucun calendrier trouvé pour cet utilisateur.");
      return;
    }

    // Ajouter des rendez-vous à chaque calendrier
    for (const calendar of calendars) {
      const newAppointments = [];
      for (let i = 0; i < 5; i++) {
        const start = new Date();
        start.setDate(start.getDate() + i); // aujourd'hui + i jours
        start.setHours(9 + i, 0);           // heure de début 9h + i
        const end = new Date(start);
        end.setHours(end.getHours() + 1);   // durée 1h
        newAppointments.push({
          name: `RDV ${i + 1} - ${calendar.title}`,
          date_debut: start,
          date_fin: end,
          description: `Description du RDV ${i + 1}`
        });
      }

      calendar.appointments.push(...newAppointments);
      await calendar.save();
      console.log(`📅 Rendez-vous ajoutés pour le calendrier "${calendar.title}"`);
    }

  } catch (err) {
    console.error('❌ Erreur lors de l’insertion des rendez-vous :', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Remplace par l’email de l’utilisateur
const email = 'aymen@test.com';
addAppointmentsByEmail(email);
