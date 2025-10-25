const { User, Calendar,Appointment } = require('./db');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


exports.inscription = async function (firstName, lastName, email, password) {

        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = new User({ firstName, lastName, email, password: hashPassword });
        return newUser.save();
};

exports.connexion = async function (email, password) {
    const user = await User.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
};

exports.exists = function (email) {
        return User.findOne({email});
};

exports.getProfil = function(id){
        return User.findById(id);
}
exports.deleteAppointment = async function(id_rdv){
    // Cherche le calendrier qui contient ce RDV
    const calendar = await Calendar.findOne({ 'appointments._id': id_rdv });
    if (!calendar) return null;

    // Trouver l'index du RDV
    const index = calendar.appointments.findIndex(a => a._id.toString() === id_rdv);
    if (index === -1) return null;

    const removed = calendar.appointments.splice(index, 1)[0]; // retirer du tableau
    await calendar.save();

    return removed; 
}

// updateAppointment : met à jour un RDV existant dans un calendrier
exports.updateAppointment = async function(id_rdv, data) {
    // Cherche le calendrier qui contient ce RDV
    const calendar = await Calendar.findOne({ 'appointments._id': id_rdv });
    if (!calendar) return null;

    // Trouver le RDV
    const index = calendar.appointments.findIndex(a => a._id.toString() === id_rdv);
    if (index === -1) return null;

    // Mettre à jour les champs (titre, dates, description)
    const rdv = calendar.appointments[index];
    if (data.titre !== undefined) rdv.name = data.titre;
    if (data.date_debut !== undefined) rdv.date_debut = new Date(data.date_debut);
    if (data.date_fin !== undefined) rdv.date_fin = new Date(data.date_fin);
    if (data.description !== undefined) rdv.description = data.description;

    await calendar.save();
    return rdv; 
};

// récupéerer l'utilisateur de calonder en quesiton 
exports.getProfilCal = async function(id_cal){
    const calendar = await Calendar.findById(id_cal);  // attendre que le doc soit récupéré
    if (!calendar) return null;                        // gérer le cas où il n’existe pas
    return calendar.userId;   
}

// Vérifie qu'un calendrier appartient à un utilisateur
exports.calendarAppartientAUser = async function(calendarId, userId) {
    const calendar = await Calendar.findOne({ _id: calendarId, userId });
    return calendar; // renvoie le document si trouvé, sinon null
};
