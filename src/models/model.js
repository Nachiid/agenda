const { User, Calendar } = require('./db');
const bcrypt = require('bcrypt');


exports.inscription = async function (firstName, lastName, email, password) {

        const hashPassword = await bcrypt.hash(password, 10)
        const newUser = new User({ firstName, lastName, email, hashPassword });
        return newUser.save();
};

exports.connexion = async function (email, password) {
    const user = await User.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
};

exports.exists = function (email) {
        return User.findOne({email});
};

exports.getProfil = function(id){
        return User.findById(id);
}