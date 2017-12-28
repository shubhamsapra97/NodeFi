// Importing Libraries
const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
var mongooseRedisCache = require("mongoose-redis-cache");

//Creating Mongoose Schema
var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not valid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        unique: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        minlength: 6,
        unique: true,
        trim: true
    },
    fullname: {
        type: String,
        required: false,
        minlength: 1
    },
    work: {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: false
    },
    posts: {
        type: Number,
        required: false
    },
    mainStatus: {
        type: String,
        required: false
    },
    bday: {
        type: String,
        required: false
    },
    qualities: {
        type: String,
        required: false
    },
    contact: {
        type: Number,
        required: false
    },
    backgroundPic: {
        type: String,
        required: false
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

UserSchema.set('redisCache', true);
UserSchema.set('expires', 30);

// User only have access to these Properties.. 
UserSchema.methods.toJSON = function() {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email', 'username', 'fullname', 'website', 'location', 'url', 'status', 'bday', 'qualities', 'contact', 'mainStatus', 'confirmPass', 'backgroundPic']);
}

// Generating Auth Tokens 
UserSchema.methods.generateAuthToken = function() {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({
        password: user.password,
        access
    }, 'pennyS').toString();

    user.tokens.push({
        access,
        token
    });

    return user.save().then(() => {
        return token;
    });
};

// Checking User Existence
UserSchema.methods.bcryptPass = function(password) {
    var user = this;

    return new Promise((resolve, reject) => {

        //Matching Hashed Password with Input Password
        bcrypt.compare(password, user.password, (err, res) => {
            if (res) {
                if (user.tokens.length == 0) {
                    var access = 'auth';
                    var token = jwt.sign({
                        password: user.password,
                        access
                    }, 'pennyS').toString();

                    user.tokens.push({
                        access,
                        token
                    });

                    user.save();
                }
                return resolve(user);
            } else {
                return reject();
            }
        });

    });

};

//Checking if 2 passwords match
UserSchema.statics.passMatch = function(password, hashPassword) {
    var User = this;
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hashPassword, (err, res) => {
            if (err) {
                return reject(err);
            }
            return resolve(res);
        });
    });
}

// Finding user by Id
UserSchema.statics.findByEmail = function(email) {
    var User = this;

    return Users.findOne({
        email: email
    }).lean().then((user) => {

        if (!user) {
            return Promise.reject();
        } else {
            return Promise.resolve(user);
        }

    });
};

// Finding By Token
UserSchema.statics.findByToken = function(token) {
    var User = this;
    var decoded;

    try {
        // Decoding Token with the secret.
        decoded = jwt.verify(token, 'pennyS');
    } catch (e) {
        console.log('not Found ' + e);
        return Promise.reject();
    }
    return User.findOne({
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

//Removing Token from User
UserSchema.methods.removeToken = function(token) {
    var user = this;
    return user.update({
        $pull: {
            tokens: {
                token
            }
        }
    });
};

// Called every time save methos is used..
UserSchema.pre('save', function(next) {

    var user = this;
    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }

});

//Creating Mongoose Model
var Users = mongoose.model('Users', UserSchema);
mongooseRedisCache(mongoose, {
    engine: 'redis',
    port: 27017,
    host: 'localhost'
});

//Exporting Users 
module.exports = {
    Users
};