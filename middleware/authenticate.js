const {
    Users
} = require('../server/models/user');

var authenticate = (req, res, next) => {
    var token = req.header('x-auth');

    Users.findByToken(token).then((user) => {

        if (!user) {
            console.log('AUTHENTICATION ERROR')
            return Promise.reject();
        }

        req.user = user;
        req.token = token;

        next();

    }).catch((err) => {
        console.log('Authentication Error: User Not Found');
        res.status(401);
    });
};

module.exports = {
    authenticate
};