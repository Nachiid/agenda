const mongoose = require('mongoose');


// Schéma pour les utilisateurs (User)
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Schéma pour les rendez-vous (Appointment) — sous-document uniquement
const appointmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date_debut: { type: Date, required: true },
    date_fin: { type: Date, required: true },
    description: { type: String, default: '' }
});

// Schéma pour les agendas (Calendar)
const calendarSchema = new mongoose.Schema({
    title: { type: String, required: true },
    color: { type: String, required: true },
    appointments: [appointmentSchema], // Tableau de sous-documents
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Création des modèles
const User = mongoose.model('User', userSchema);
const Calendar = mongoose.model('Calendar', calendarSchema);

module.exports = { User, Calendar };





