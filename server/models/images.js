//Importing Libraries
var mongoose = require('mongoose');
var mongooseRedisCache = require("mongoose-redis-cache");

// Creating Mongoose Schema.
var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1
    },
    username: {
        type: String,
        required: true,
        minlength: 6
    },
    url: {
        type: String,
        required: false
    },
    time: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    like: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: false
    },
    postStatus: {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    userDp: {
        type: String,
        required: false
    },
    userLiked: [{
        type: String,
        required: false
    }]
});

// Find By Credentials.
UserSchema.statics.findByCredentials = function(username, time) {
    var Image = this;

    return Image.findOne({
        username,
        time
    }).then((image) => {

        if (!image) {
            return Promise.reject();
        } else {
            return Promise.resolve(image);
        }

    });
};

//Creating Mongoose Model.
var Images = mongoose.model('Images', UserSchema);

// Exporting Images
module.exports = {
    Images
};