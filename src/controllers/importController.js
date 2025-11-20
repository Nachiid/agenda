const {
  getCalendarById,
  addAppointment,
  createCalendar,
} = require("../models/model");
const ics = require("ics");
const ical = require("node-ical");

const importIcs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const events = ical.parseICS(req.file.buffer.toString());

    if (Object.keys(events).length === 0) {
      return res.status(400).json({ error: "Empty ICS file" });
    }

    let calendarTitle = null;

    for (const key in events) {
      if (events[key].type === "VCALENDAR") {
        calendarTitle =
          events[key]["x-wr-calname"] || events[key]["X-WR-CALNAME"];
        break;
      }
    }

    if (!calendarTitle) {
      const originalName = req.file.originalname;
      calendarTitle = originalName.replace(/\.[^/.]+$/, "");
    }
    calendarTitle = calendarTitle + " Importé";
    const calendar = await createCalendar(req.user.id, calendarTitle);

    for (const event of Object.values(events)) {
      if (
        event.type === "VEVENT" &&
        event.summary &&
        event.start &&
        event.end
      ) {
        try {
          await addAppointment(calendar._id, {
            name: event.summary,
            date_debut: event.start,
            date_fin: event.end,
            description: event.description,
          });
        } catch (error) {
          console.error("Error adding appointment:", error);
        }
      }
    }

    res.status(200).json({ message: "Calendar importer avec succée " });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const exportIcs = async (req, res) => {
  try {
    const calendarId = req.params.calendarId;
    const calendar = await getCalendarById(calendarId);

    if (!calendar) {
      return res.status(404).json({ error: "Calendar not found" });
    }

    const events = calendar.appointments.map((appointment) => {
      const startDate = new Date(appointment.date_debut);
      const endDate = new Date(appointment.date_fin);
      return {
        title: appointment.name,
        start: [
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate(),
          startDate.getHours(),
          startDate.getMinutes(),
        ],
        end: [
          endDate.getFullYear(),
          endDate.getMonth() + 1,
          endDate.getDate(),
          endDate.getHours(),
          endDate.getMinutes(),
        ],
        description: appointment.description,
      };
    });

    const { error, value } = ics.createEvents(events);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create ICS file" });
    }

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${calendar.title}.ics"`
    );
    res.status(200).send(value);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { importIcs, exportIcs };
