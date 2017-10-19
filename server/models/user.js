const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
var mongooseRedisCache = require("mongoose-redis-cache");


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
    required: false,
    minlength: 1
  },
  website: {
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
  posts:{
    type: Number,
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

UserSchema.methods.toJSON = function(){
    var user = this;
    var userObject = user.toObject();
    
    return _.pick(userObject,['email','username','fullname','website','location','url']);
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

  return Users.findOne({email}).lean().then((user)=>{

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

UserSchema.statics.findByEmail = function(email){
  var User = this;

  return Users.findOne({email}).lean().then((user)=>{

    if(!user){
      return Promise.reject();
    }
    else{
      return Promise.resolve(user);    
    }

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
mongooseRedisCache(mongoose, {
  engine: 'redis',
  port: 27017,
  host: 'localhost'
});


module.exports = {Users};
