const express = require('express');
const router = express.Router();
const path = require('path');
const userController        = require('../controllers/userController');
const appointmentController = require('../controllers/appointmentController');
const calendarController = require('../controllers/calendarController');
const auth = require('../middleware/auth');

// === ROUTES PAGES PUBLICS=== //
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});


// === ROUTES API (utilisateurs) === //
router.post('/user/register', userController.register);
router.post('/user/login', userController.login);
router.post('/appointment',appointmentController.rajouteAppointment);
router.delete('/deletAppointment',appointmentController.deletAppointment);
router.put('/updateAppointment',appointmentController.updateAppointment);
router.get('/user/profile', auth,  userController.getuser);

router.get('/user/agenda', auth,  calendarController.showFirstCalendar);
router.get('/agenda', auth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/agenda.html'));
});
router.get('/user/calendars', auth, calendarController.getAllCalendarsIdsTitles);

router.get('/user/logout', (req, res) => {
    res.clearCookie('token');  
    res.status(200).json({ message: 'Déconnecté avec succès' });
});




module.exports = router;
