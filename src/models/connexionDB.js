const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI non défini dans .env !");
  await mongoose.connect(uri, {
    dbName: "agenda",
    serverSelectionTimeoutMS: 30000,
  });
  console.log("MongoDB connectée sur : agenda");
};

module.exports = connectDB;
