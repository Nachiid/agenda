const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./models/connexionDB');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Utilisation du routeur
app.use('/', authRoutes);



// Démarrage du serveur
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`🚀 Serveur lancé sur : http://localhost:${PORT}`));
  } catch (err) {
    console.error('Impossible de démarrer le serveur :', err);
  }
})();

