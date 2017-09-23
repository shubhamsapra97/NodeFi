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
  url:{
      type: String,
      required: true
  },
  time:{
      type: String,
      required: true
  },
  like:{
    type: Number,
    required: true
  }
});

UserSchema.statics.findByCredentials = function(username,time){
  var Image = this;

  return Image.findOne({username,time}).then((image)=>{

    if(!image){
      return Promise.reject();
    }
    else{
        return Promise.resolve(image);
    }

  });
};


var Images = mongoose.model('Images' , UserSchema);

module.exports = {Images};
