const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

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
    minlength: 6
  },
  username: {
    type: String,
    required: true,
    minlength: 6
  },
  fullname: {
    type: String,
    required: true,
    minlength: 1
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

UserSchema.methods.toJSON = function(){
    var user = this;
    var userObject = user.toObject();
    
    return _.pick(userObject,['email','username','fullname']);
}

UserSchema.methods.generateAuthToken = function(){
    var user = this;
    var access = 'auth';
    var token = jwt.sign({password: user.password,access},'pennyS').toString();
    
    user.tokens.push({access,token});
    
    return user.save().then((token)=>{
        return token;
    });
};

UserSchema.statics.findByCredentials = function(email,password){
  var User = this;

  return Users.findOne({email}).then((user)=>{

    if(!user){
      return Promise.reject();
    }

    return new Promise((resolve,reject)=>{
      bcrypt.compare(password,user.password,(err,res)=>{

          if(res){
            resolve(user);
          }
          else{
            reject();
          }

      });
    });

  });
};

UserSchema.pre('save',function(next){

  var user = this;
  if(user.isModified('password')){
    bcrypt.genSalt(10 , (err,salt)=>{
      bcrypt.hash(user.password,salt,(err,hash)=>{
        user.password = hash;
        next();
      });
    });
  }else{
    next();
  }

});

var Users = mongoose.model('Users' , UserSchema);

module.exports = {Users};
