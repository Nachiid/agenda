const jwt = require('jsonwebtoken');
const model = require("../models/model")

// Verification des donnees tous formulaire
exports.register = async (req, res) => {

    const { firstName, lastName, email, password, confirmPassword } = req.body;
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'il ya une erreur ' });
    }

    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
        return res.status(400).json({ error: 'Le prénom et le nom doivent contenir uniquement des lettres.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Les mot de passe sont differents' });
    }
    const userExists = await model.exists(email);

    if (userExists !== null) {

        return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    try {
        const NewUser = await model.register(firstName, lastName, email, password);
        return res.status(201).json({ message: "Utilisateur ajouté", user: NewUser });
    } catch (err) {
        return res.status(500).json({ error: "Erreur lors de l’inscription" });
    }
};



exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifications basiques
        if (!email || !password) {
            return res.status(400).json({ error: 'Veuillez remplir tous les champs.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Adresse email invalide.' });
        }

        const user = await model.login(email, password);
        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
        }

        // Génération du token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.SECRET_KEY,
            { expiresIn: '1w' }
        );

        // Stocke le token dans un cookie httpOnly
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 1 semaine
        });

        return res.status(200).json({
            message: 'Connexion réussie',
            user
        });

    } catch (err) {
        console.error('Erreur login:', err);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
};


exports.getuser = async (req , res) => {
    const id = req.user.id;
    try {
        const profil_inforamation = await model.getProfil(id);
        return res.status(200).json({ user: profil_inforamation });
    } catch (error) {
        return res.status(500).json({ error: 'Erreur interne du serveur.' });

    }
}
