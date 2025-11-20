const mongoose = require("mongoose");

// Schéma pour les utilisateurs (User)
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  calendarPreferences: {
    defaultView: { type: String, default: "Semaine" },
    weekStart: { type: String, default: "Monday" }, // Sprint 4
    showWeekends: { type: Boolean, default: true }, // Sprint 4
  },
  timezone: { type: String, default: "Europe/Paris" }, // Sprint 4
});

// Schéma pour les rendez-vous (Appointment) — sous-document uniquement
const appointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date_debut: { type: Date, required: true },
  date_fin: { type: Date, required: true },
  description: { type: String, default: "" },
});

// Schéma pour les Calendriers (Calendar)
const calendarSchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: { type: String, required: true },
  appointments: [appointmentSchema],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isShared: { type: Boolean, default: false },
});

// Shéma pour les Calendriers partagé
const sharedCalendarSchema = new mongoose.Schema({
  calendarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Calendar",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["editor", "viewer"], default: "viewer" },
});


// Création des modèles
const User = mongoose.model("User", userSchema);
const Calendar = mongoose.model("Calendar", calendarSchema);
const sharedCalendar = mongoose.model("sharedCalendar", sharedCalendarSchema);

module.exports = { User, Calendar,  sharedCalendar};
