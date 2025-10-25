const model = require("../models/model");





exports.showFirstCalendar = async (req, res) => {
    try {
        const userID = req.user.id;

        const calendar = await model.getFirstCalendar(userID);
        return res.status(200).json({ calendar: calendar });

    } catch (error) {
        console.error('Erreur showCalendar:', error);
        return res.status(500).json({ error });

    }

}

/*
exports.showCalendar = async (req, res) => {
    try {
        const calendarId = req.body;
        const userID = req.user.id;

        await model.getUserCalendar(calendarId);
        return res.status(200).json({ message: 'le calendrier est recuperé' });

    } catch (error) {
        console.error('Erreur showCalendar:', error);
        return res.status(500).json({ error });

    }

}*/

