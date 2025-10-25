require('dotenv').config({ path: '../.env' }); // ../ pour remonter à la racine
const connectDB = require('./models/connexionDB');
const model = require('./models/model');
const { User, Calendar } = require('./models/db');

async function seedAll() {
  try {
    // Connexion à MongoDB
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    // Vider les collections
    await User.deleteMany({});
    await Calendar.deleteMany({});
    console.log('🧹 Collections vidées');

    // Utilisateurs à créer
    const usersData = [
      { firstName: 'younes', lastName: 'younes', email: 'younes@test.com', password: 'younesyounes' },
      { firstName: 'yassir', lastName: 'yassir', email: 'yassir@test.com', password: 'yassiryassir' },
      { firstName: 'aymen', lastName: 'aymen', email: 'aymen@test.com', password: 'aymenaymen' },
      { firstName: 'youcef', lastName: 'youcef', email: 'youcef@test.com', password: 'youcefyoucef' },
    ];

    const createdUsers = [];
    for (const u of usersData) {
      const user = await model.inscription(u.firstName, u.lastName, u.email, u.password);
      createdUsers.push(user);
      console.log('-> utilisateur créé :', user.email);
    }

    // Créer 3 calendriers par utilisateur
    const calendarTypes = [
      { title: 'perso', color: '#3498db' },
      { title: 'amis',  color: '#2ecc71' },
      { title: 'famille', color: '#e74c3c' },
    ];

    const calendars = [];
    for (const user of createdUsers) {
      for (const t of calendarTypes) {
        calendars.push({
          title: t.title,
          color: t.color,
          userId: user._id,
          appointments: []
        });
      }
    }

    await Calendar.insertMany(calendars);
    console.log('📅 Calendriers créés pour chaque utilisateur');

  } catch (err) {
    console.error('❌ Erreur pendant le seedAll :', err);
  } finally {
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

seedAll();
