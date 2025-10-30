const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    const token = req.cookies.token;

    if (!token) return res.redirect("/");

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Erreur auth:", err.message);
    return res.redirect("/");
  }
};
