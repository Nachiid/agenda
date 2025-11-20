const express = require("express");
const router = express.Router();
const path = require("path");
const userController = require("../controllers/userController");
const appointmentController = require("../controllers/appointmentController");
const calendarController = require("../controllers/calendarController");
const importController = require("../controllers/importController");
const auth = require("../middleware/auth");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// === ROUTES PAGES PUBLICS=== //
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/register.html"));
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
});

// === ROUTES API (utilisateurs) === //
router.post("/user/register", userController.register);
router.post("/user/login", userController.login);

// === ROUTES PAGE PRIVE === //

/* Routes Profil
 **
 */
router.get("/user/profile", auth, userController.getuser);
router.get("/user/preference", auth, userController.getuserPreference);
router.get("/profile", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/profile.html"));
});
// --- Route pour modifier le profil ---
router.put("/user/profile", auth, userController.modifierProfile);
// --- Route pour changer le mot de passe ---
router.put("/user/password", auth, userController.changePassword);
// --- Route pour supprimer le profil ---
router.delete("/user/profile", auth, userController.supprimerProfile);
// Route pour mettre à jour la vue par défaut du calendrier
router.put("/user/preferences/defaultView", auth, userController.updatePreference);


/* Routes Evenements
 **
 */
router.get('/appointment/:calendarId', auth, appointmentController.getAppointments);
router.post("/appointment",auth, appointmentController.rajouteAppointment);
router.delete("/deletAppointment",auth, appointmentController.deletAppointment);
router.put("/updateAppointment",auth, appointmentController.updateAppointment);
router.post("/appointments/multiple", auth, appointmentController.getAppointments);
router.post("/searchAppointment", auth, appointmentController.searchAppointment);



/* Routes Calendrier
 **
 */
router.get("/user/agenda", auth, calendarController.showFirstCalendar);
router.post("/user/agenda", auth, calendarController.showCalendar);
router.get("/agenda", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/agenda.html"));
});
router.get(
  "/user/calendars",
  auth,
  calendarController.getAllCalendarsIdsTitles
);
router.delete(
  "/user/calendar/delete/:id",
  auth,
  calendarController.deleteCalendar
);
router.put(
  "/user/calendar/updateTitle",
  auth,
  calendarController.updateCalendarTitle
);
router.post("/user/calendar/create", auth, calendarController.addCalendar);
router.post(
  "/user/calendar/import",
  auth,
  upload.single("importFile"),
  importController.importIcs
);
router.get("/user/calendar/export/:calendarId", auth, importController.exportIcs);

router.get("/user/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Déconnecté avec succès" });
});

module.exports = router;
