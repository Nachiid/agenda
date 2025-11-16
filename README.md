# 🗓️ Application Web Agenda

Une application web moderne permettant de gérer ses **rendez-vous et calendriers personnels ou professionnels**.
Développée avec **Node.js**, **Express**, **MongoDB** et intégrée avec **FullCalendar.js** pour une expérience utilisateur fluide et intuitive.

---

## 🚀 Fonctionnalités

### **Sprint 0 – Fonctionnalités de base**

* 👤 **Création de compte** : inscription avec email et mot de passe.
* 🔐 **Connexion / Authentification JWT** : accès sécurisé avec gestion des cookies.
* ➕ **Ajout de rendez-vous** : planifier un événement avec titre, date, heure et description.
* ✏️ **Modification de rendez-vous** : mettre à jour les informations d’un événement.
* ❌ **Suppression de rendez-vous** : supprimer un rendez-vous existant.
* 📋 **Affichage d’une liste de rendez-vous** : visualiser les rendez-vous à venir.

### **Sprint 1 – Fonctionnalités avancées**

* 📅 **Affichage du calendrier interactif** : vue jour, semaine ou mois via FullCalendar.
* 🗂️ **Gestion de plusieurs calendriers** : création, modification, suppression et affichage des calendriers.
* 🎨 **Calendriers colorés et catégorisés** : distinguer les rendez-vous personnels, professionnels, etc.
* 👤 **Modification du profil utilisateur** : nom, email, mot de passe.
* 🧹 **Suppression de compte** : suppression définitive et sécurisée du compte et des données.

---

## 🏗️ Architecture du projet

```
agenda/
├── src/
│   ├── server.js               # Point d’entrée du serveur Express
│   ├── routes/                 # Routes API
│   ├── controllers/            # Logique métier (users, agenda, calendars)
│   ├── models/                 # Modèles Mongoose (User, Calendar, Appointment)
│   ├── middlewares/            # Authentification & sécurité
│   └── views/                  # Fichiers frontend (HTML, CSS, JS)
│
├── public/
│   ├── js/
│   │   ├── agenda.js           # Gestion du calendrier (FullCalendar)
│   │   ├── appointment.js      # Gestion des rendez-vous
│   │   └── utils.js            # Fonctions utilitaires
│   └── css/
│       └── style.css           # Feuille de style principale
│
├── .env                        # Variables d’environnement (SECRET_KEY, DB_URI, etc.)
├── package.json
└── README.md
```

---

## ⚙️ Installation et configuration

### 1️⃣ Cloner le projet

```bash
git clone https://gitlab.univ-lorraine.fr/e80624u/agenda.git
cd agenda
```

### 2️⃣ Installer les dépendances

```bash
npm install
```

### 3️⃣ Créer un fichier `.env` à la racine

```bash
SECRET_KEY=ton_secret_jwt
MONGODB_URI=mongodb://localhost:27017/agenda
PORT=3000
```

### 4️⃣ Lancer le serveur

#### En mode développement :

```bash
npm run dev
```

#### En mode production :

```bash
npm start
```

Le serveur sera disponible sur :
👉 [http://localhost:3000](http://localhost:3000)

---

## 🧩 Dépendances principales

| Package             | Utilisation                            |
| ------------------- | -------------------------------------- |
| **express**         | Framework web principal                |
| **mongoose**        | ORM pour MongoDB                       |
| **jsonwebtoken**    | Authentification sécurisée (JWT)       |
| **bcrypt**          | Hachage des mots de passe              |
| **cookie-parser**   | Gestion des cookies utilisateur        |
| **dotenv**          | Gestion des variables d’environnement  |
| **cors**            | Autorisation des requêtes cross-origin |
| **tippy.js**        | Tooltips dynamiques pour FullCalendar  |
| **nodemon** *(dev)* | Rechargement automatique du serveur    |

---

## 🧠 Logique métier

* Chaque **utilisateur** possède un ou plusieurs **calendriers**.
* Chaque **calendrier** contient plusieurs **rendez-vous**.
* Les utilisateurs peuvent :

  * Sélectionner un calendrier actif.
  * Ajouter, modifier ou supprimer des rendez-vous dans ce calendrier.
  * Personnaliser la couleur et le titre de chaque calendrier.
* L’application gère les rendez-vous avec **FullCalendar** pour un rendu visuel optimal.

---

## 🛡️ Sécurité

* Authentification basée sur **JWT** stocké dans les cookies.
* Routes protégées côté serveur via un **middleware d’authentification**.
* Données utilisateurs et mots de passe **hachés avec bcrypt**.
* Headers anti-cache et contrôle des accès pour éviter la réutilisation de session.

---

## 🎯 Améliorations futures (Backlog avancé)

* 🔁 Répétition intelligente des rendez-vous (récurrence personnalisée).
* 👥 Partage de calendriers entre utilisateurs.
* 🔔 Notifications (email / push) avant les rendez-vous.
* 🌓 Mode sombre / clair dynamique.
* 📊 Statistiques et suivi du temps.
* 🔍 Recherche avancée dans les événements.

---

📅 Année : 2026
📜 Licence : MIT
