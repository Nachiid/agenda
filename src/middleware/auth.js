const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.cookies.token;
      
        if (!token) return res.redirect('/'); 

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Erreur auth:', err.message);
        return res.redirect('/');
    }
};
