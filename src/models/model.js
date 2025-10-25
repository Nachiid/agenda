const { User, Calendar } = require('./db');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Crée un nouvel utilisateur avec un mot de passe hashé et l'enregistre dans la base de données.
 */
exports.register = async function (firstName, lastName, email, password) {
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ firstName, lastName, email, password: hashPassword });
    const savedUser = await newUser.save();

    const defaultCalendar = new Calendar({title: 'Mon agenda', color: '#3498db',userId: savedUser._id, appointments: []});
    await defaultCalendar.save();

    return savedUser;
};


/**
 * Authentifie un utilisateur en comparant l'email et le mot de passe.
 * Renvoie l'utilisateur si les identifiants sont corrects, sinon null.
 */
exports.login = async function (email, password) {
    const user = await User.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
};

/**
 * Vérifie si un utilisateur avec un email donné existe dans la base de données.
 * Renvoie l'utilisateur si trouvé, sinon null.
 */
exports.exists = function (email) {
    return User.findOne({ email });
};

/**
 * Récupère le profil d'un utilisateur en fonction de son ID.
 */
exports.getProfil = function (id) {
    return User.findById(id);
}

/**
 * Supprime un rendez-vous d'un calendrier.
 * Cherche le calendrier contenant le RDV, supprime le RDV et sauvegarde le calendrier.
 */
exports.deleteAppointment = async function (id_rdv) {
    const calendar = await Calendar.findOne({ 'appointments._id': id_rdv });
    if (!calendar) return null;

    const index = calendar.appointments.findIndex(a => a._id.toString() === id_rdv);
    if (index === -1) return null;

    const removed = calendar.appointments.splice(index, 1)[0];
    await calendar.save();

    return removed;
}

/**
 * Met à jour un rendez-vous existant dans un calendrier.
 * Modifie les champs titre, dates et description si présents dans les données fournies.
 */
exports.updateAppointment = async function (id_rdv, data) {
    const calendar = await Calendar.findOne({ 'appointments._id': id_rdv });
    if (!calendar) return null;

    const index = calendar.appointments.findIndex(a => a._id.toString() === id_rdv);
    if (index === -1) return null;

    const rdv = calendar.appointments[index];
    if (data.titre !== undefined) rdv.name = data.titre;
    if (data.date_debut !== undefined) rdv.date_debut = new Date(data.date_debut);
    if (data.date_fin !== undefined) rdv.date_fin = new Date(data.date_fin);
    if (data.description !== undefined) rdv.description = data.description;

    await calendar.save();
    return rdv;
};

/**
 * Récupère l'ID de l'utilisateur associé à un calendrier donné.
 */
exports.getProfilCal = async function (id_cal) {
    const calendar = await Calendar.findById(id_cal);
    if (!calendar) return null;
    return calendar.userId;
}

/**
 * Vérifie si un calendrier appartient à un utilisateur spécifique.
 * Renvoie le calendrier si trouvé, sinon null.
 */
exports.getUserCalendar = async function (calendarId, userId) {
    const calendar = await Calendar.findOne({ _id: calendarId, userId });
    return calendar;
};


/**
 * Renvoie le premier calendrier de user.
 */
exports.getFirstCalendar = async function (userId) {
    const calendar = await Calendar.findOne({ userId: userId });
    return calendar;
};

