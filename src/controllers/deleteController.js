const model = require("../models/model");

/**
 * Met un élément (calendrier ou rdv) en corbeille (soft delete).
 * Le type d'élément est déterminé par l'URL.
 */
exports.softDelete = async (req, res) => {
    const { item_type, id } = req.params;
    const userId = req.user.id; 

    try {
        let result;
        if (item_type === 'calendar') {
            // On vérifie que le calendrier appartient bien à l'utilisateur
            result = await model.softDeleteCalendar(userId, id);
        } else if (item_type === 'appointment') {
            // On vérifie que le rdv appartient bien à un calendrier de l'utilisateur
            const isOwner = await model.getUserAppointment(userId, id);
            if (!isOwner) {
                return res.status(403).json({ message: "Vous n'avez pas les droits pour supprimer ce rendez-vous." });
            }
            result = await model.softDeleteAppointment(id);
        } else {
            return res.status(400).json({ message: "Type d'élément non valide." });
        }

        if (!result) {
            return res.status(404).json({ message: "Élément non trouvé ou déjà supprimé." });
        }

        res.status(200).json({ message: `L'élément a été mis à la corbeille.`, item: { _id: id } });

    } catch (error) {
        console.error(`Erreur lors de la mise à la corbeille de ${item_type}:`, error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression." });
    }
};

/**
 * Restaure un élément (calendrier ou rdv) de la corbeille.
 */
exports.restoreItem = async (req, res) => {
    const { item_type, id } = req.params;
    const userId = req.user.id;

    try {
        let result;
        if (item_type === 'calendar') {
            result = await model.restoreCalendar(userId, id);
        } else if (item_type === 'appointment') {
             const isOwner = await model.getUserAppointment(userId, id);
             if (!isOwner) {
                 // Même si le rdv est inactif, getUserAppointment doit pouvoir le trouver pour le restaurer
                 // Potentiellement, il faudra une fonction "isOwnerOfInactiveItem"
             }
            result = await model.restoreAppointment(id);
        } else {
            return res.status(400).json({ message: "Type d'élément non valide." });
        }

        if (!result) {
            return res.status(404).json({ message: "Élément non trouvé dans la corbeille ou droits insuffisants." });
        }

        res.status(200).json({ message: `L'élément a été restauré.`, item: result });

    } catch (error) {
        console.error(`Erreur lors de la restauration de ${item_type}:`, error);
        res.status(500).json({ message: "Erreur serveur lors de la restauration." });
    }
};


/**
 * Récupère le contenu de la corbeille pour l'utilisateur.
 */
exports.getTrash = async (req, res) => {
    const userId = req.user.id;
    try {
        const trashContent = await model.getTrash(userId);
        res.status(200).json(trashContent);
    } catch (error) {
        console.error("Erreur lors de la récupération de la corbeille:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
