```
      ___           ___           ___                    ___           ___           ___           ___           ___           ___
     /\__\         /\  \         /\__\                  /\  \         /\  \         /\  \         /\__\         /\  \         /\  \
    /::|  |       /::\  \       /::|  |                /::\  \       /::\  \       /::\  \       /::|  |       /::\  \       /::\  \
   /:|:|  |      /:/\:\  \     /:|:|  |               /:/\:\  \     /:/\:\  \     /:/\:\  \     /:|:|  |      /:/\:\  \     /:/\:\  \
  /:/|:|__|__   /:/  \:\  \   /:/|:|  |__            /::\~\:\  \   /:/  \:\  \   /::\~\:\  \   /:/|:|  |__   /:/  \:\__\   /::\~\:\  \
 /:/ |::::\__\ /:/__/ \:\__\ /:/ |:| /\__\          /:/\:\ \:\__\ /:/__/_\:\__\ /:/\:\ \:\__\ /:/ |:| /\__\ /:/__/ \:|__| /:/\:\ \:\__\
 \/__/~~/:/  / \:\  \ /:/  / \/__|:|/:/  /          \/__\:\/:/  / \:\  /\ \/__/ \:\~\:\ \/__/ \/__|:|/:/  / \:\  \ /:/  / \/__\:\/:/  /
       /:/  /   \:\  /:/  /      |:/:/  /                \::/  /   \:\ \:\__\    \:\ \:\__\       |:/:/  /   \:\  /:/  /       \::/  /
      /:/  /     \:\/:/  /       |::/  /                 /:/  /     \:\/:/  /     \:\ \/__/       |::/  /     \:\/:/  /        /:/  /
     /:/  /       \::/  /        /:/  /                 /:/  /       \::/  /       \:\__\         /:/  /       \::/__/        /:/  /
     \/__/         \/__/         \/__/                  \/__/         \/__/         \/__/         \/__/         ~~            \/__/
```

---

# 📅 Mon Agenda – Application Web de Gestion de Calendriers & Rendez-vous

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-8+-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/FullCalendar-6.1-0275d8?style=for-the-badge&logo=google-calendar&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production-success?style=flat-square" />
  <img src="https://img.shields.io/badge/Responsive-100%25-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" />
</p>

---

## 🎯 **Présentation**

**Agenda** est une application web moderne, intuitive et responsive permettant de gérer plusieurs calendriers, organiser des rendez-vous, collaborer avec une équipe et synchroniser ses données via le format **ICS**.

Développée en **Node.js + Express + MongoDB**, elle s'appuie sur **[FullCalendar](https://fullcalendar.io)** pour un rendu interactif, fluide et ergonomique sur ordinateur, tablette et mobile.

---

# ✨ Fonctionnalités

## 🔐 **Authentification & Sécurité**

- Création de compte
- Connexion sécurisée (JWT)
- Modification du profil
- Suppression définitive du compte
- Hashage des mots de passe (bcrypt)
- Middleware d’authentification dédié

---

## 📆 **Gestion avancée des rendez-vous**

- CRUD complet (ajout, modifier, supprimer)
- Déplacement & redimensionnement dans FullCalendar
- Recherche globale
- Rendez-vous récurrents
- Corbeille avec restauration 30 jours
- Jours fériés automatiques selon pays
- Import & export ICS

---

## 🗂️ **Calendriers personnalisés**

- Création / modification / suppression
- Couleur personnalisée
- Affichage parallèle multi-calendriers
- Permissions partagées
- Mode entreprise (accès équipe)

---

## 👥 **Collaboration & Mode Entreprise**

- Partage de calendriers
- Droits d’accès (lecture / écriture)
- Visualisation de disponibilité d’équipe
- Gestion multi-utilisateurs

---

## 📱 **Interface responsive & moderne**

- Compatible ordinateur, tablette, mobile
- Adaptation automatique des vues FullCalendar
- Mode sombre
- Design clean & ergonomique
- Comportements dynamiques (tooltips, interactions directes)

---

# 🏗️ Architecture du projet

```
agenda
│
├── docs/                → documentation projet (backlog, diagrammes, revues)
├── src/
│   ├── controllers/     → logique métier (rendez-vous, calendrier, user…)
│   ├── middleware/      → authentification JWT
│   ├── models/          → schémas Mongoose + connexion DB
│   ├── public/
│   │   ├── css/         → styles globaux et pages (global, agenda, thème…)
│   │   └── js/          → scripts front-end modulaires
│   ├── routes/          → routes Express
│   ├── views/           → pages HTML principales
│   └── server.js        → serveur Express
│
└── package.json

```

---

# 🛠️ Technologies

### Backend

- Node.js
- Express 5
- MongoDB / Mongoose
- JWT
- bcrypt
- Multer
- node-ical / ICS
- dotenv

### Frontend

- HTML / CSS / JS
- FullCalendar
- Tippy.js
- Thème clair et sombre

---

# 📦 Installation

### 1. Cloner le dépôt

```bash
git clone https://gitlab.univ-lorraine.fr/e80624u/agenda.git
cd agenda
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Créer `.env` :

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/agenda
JWT_SECRET=votre_secret
```

### 4. Lancer l’application

```bash
npm run dev
```

---

# 🧪 Seed Database

```bash
node src/seed.js
node src/seed_rdv.js
```

---

# 📁 Documentation

Le dossier `docs/` contient :

- Backlog produit
- Diagramme UML
- Sprint Reviews
- Rétrospectives
- Tests Effectués

---

# 🖥️ Responsive Preview

| Desktop            | Tablette               | Mobile                       |
| ------------------ | ---------------------- | ---------------------------- |
| ✔️ Support complet | ✔️ Adaptation des vues | ✔️ Mode listWeek automatique |

---

# 🔒 Sécurité

- Hashage des mots de passe
- JWT signé
- Middleware d’accès
- Permissions granulaire
- Validation back-end et front-end

---

---

# 👥 Équipe de développement

- [NACHID Ayman](https://github.com/Nachiid)
- KECHICHE Younes
- MEZOUARA Yasser
- MADANE Youssef

---

# 📜 Licence

Projet sous licence **MIT**.

---

```
      ___           ___           ___           ___                  ___           ___                         ___
     /__/|         /  /\         /  /\         /  /\                /  /\         /  /\                       /__/\
    |  |:|        /  /:/_       /  /:/_       /  /::\              /  /:/        /  /::\                     |  |::\
    |  |:|       /  /:/ /\     /  /:/ /\     /  /:/\:\            /  /:/        /  /:/\:\    ___     ___     |  |:|:\
  __|  |:|      /  /:/ /:/_   /  /:/ /:/_   /  /:/~/:/           /  /:/  ___   /  /:/~/::\  /__/\   /  /\  __|__|:|\:\
 /__/\_|:|____ /__/:/ /:/ /\ /__/:/ /:/ /\ /__/:/ /:/           /__/:/  /  /\ /__/:/ /:/\:\ \  \:\ /  /:/ /__/::::| \:\
 \  \:\/:::::/ \  \:\/:/ /:/ \  \:\/:/ /:/ \  \:\/:/            \  \:\ /  /:/ \  \:\/:/__\/  \  \:\  /:/  \  \:\~~\__\/
  \  \::/~~~~   \  \::/ /:/   \  \::/ /:/   \  \::/              \  \:\  /:/   \  \::/        \  \:\/:/    \  \:\
   \  \:\        \  \:\/:/     \  \:\/:/     \  \:\               \  \:\/:/     \  \:\         \  \::/      \  \:\
    \  \:\        \  \::/       \  \::/       \  \:\               \  \::/       \  \:\         \__\/        \  \:\
     \__\/         \__\/         \__\/         \__\/                \__\/         \__\/                       \__\/
```

```

                                                   ___           ___                            
                                                  /\  \         /\  \         _____             
                                                 /::\  \        \:\  \       /::\  \            
                                                /:/\:\  \        \:\  \     /:/\:\  \           
                                               /:/ /::\  \   _____\:\  \   /:/  \:\__\          
                                              /:/_/:/\:\__\ /::::::::\__\ /:/__/ \:|__|         
                                              \:\/:/  \/__/ \:\~~\~~\/__/ \:\  \ /:/  /         
                                               \::/__/       \:\  \        \:\  /:/  /          
                                                \:\  \        \:\  \        \:\/:/  /           
                                                 \:\__\        \:\__\        \::/  /            
                                                  \/__/         \/__/         \/__/             
```

```
      ___           ___           ___           ___          _____          ___                         ___
     /  /\         /  /\         /__/\         /  /\        /  /::\        /__/\                       /  /\
    /  /:/_       /  /:/         \  \:\       /  /:/_      /  /:/\:\       \  \:\                     /  /:/_
   /  /:/ /\     /  /:/           \__\:\     /  /:/ /\    /  /:/  \:\       \  \:\    ___     ___    /  /:/ /\
  /  /:/ /::\   /  /:/  ___   ___ /  /::\   /  /:/ /:/_  /__/:/ \__\:|  ___  \  \:\  /__/\   /  /\  /  /:/ /:/_
 /__/:/ /:/\:\ /__/:/  /  /\ /__/\  /:/\:\ /__/:/ /:/ /\ \  \:\ /  /:/ /__/\  \__\:\ \  \:\ /  /:/ /__/:/ /:/ /\
 \  \:\/:/~/:/ \  \:\ /  /:/ \  \:\/:/__\/ \  \:\/:/ /:/  \  \:\  /:/  \  \:\ /  /:/  \  \:\  /:/  \  \:\/:/ /:/
  \  \::/ /:/   \  \:\  /:/   \  \::/       \  \::/ /:/    \  \:\/:/    \  \:\  /:/    \  \:\/:/    \  \::/ /:/
   \__\/ /:/     \  \:\/:/     \  \:\        \  \:\/:/      \  \::/      \  \:\/:/      \  \::/      \  \:\/:/
     /__/:/       \  \::/       \  \:\        \  \::/        \__\/        \  \::/        \__\/        \  \::/
     \__\/         \__\/         \__\/         \__\/                       \__\/                       \__\/

```

---
