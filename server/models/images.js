var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  username: {
    type: String,
    required: true,
    minlength: 6
  },
  image:{
    name:String,
    data: Buffer,
    contentType: String
  }  
});

var Images = mongoose.model('Images' , UserSchema);

module.exports = {Images};
