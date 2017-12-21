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
      required : false
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
    
    return _.pick(userObject,['_id','email','username','fullname','website','location','url','status','bday','qualities','contact','mainStatus','confirmPass','backgroundPic']);
}

UserSchema.methods.generateAuthToken = function(){
    var user = this;
    var access = 'auth';
    var token = jwt.sign({password: user.password,access},'pennyS').toString();
    
    user.tokens.push({access,token});
    
    return user.save().then(()=>{
        return token;
    });
};

//UserSchema.statics.generateAuthToken1 = function(email,password){
//    var User = this;
//    var access = 'auth';
//    var token = jwt.sign({password: password,access},'pennyS').toString();
//    
//    Users.findOneAndUpdate({
//        email: email
//    },
//    {
//        $push:{
//            tokens: {access,token}
//        }  
//    },{
//        new: true
//    }, function(err,user){
//       return new Promise(token); 
//    });
//};

UserSchema.methods.bcryptPass = function(password){
  var user = this;
    
    return new Promise((resolve,reject)=>{
        
      bcrypt.compare(password,user.password,(err,res)=>{
          if(res){
            if(user.tokens.length == 0){
                var access = 'auth';
                var token = jwt.sign({password: user.password,access},'pennyS').toString();

                user.tokens.push({access,token});

                user.save();
            }              
            return resolve(user);        
          }
          else{
            return reject();
          }
      });
        
    });
    
};

UserSchema.statics.passMatch = function(password,hashPassword){
    var User = this;
    return new Promise((resolve,reject)=>{
      bcrypt.compare(password,hashPassword,(err,res)=>{
          if(err){
              return reject(err);
          }
          return resolve(res);
      });  
    });
}

UserSchema.statics.findByEmail = function(id){
  var User = this;

  return Users.findOne({_id:id}).lean().then((user)=>{

    if(!user){
      return Promise.reject();
    }
    else{
      return Promise.resolve(user);    
    }

  });
};

UserSchema.statics.findByToken = function(token){
    var User = this;
    var decoded;
    
    try{
     decoded = jwt.verify(token,'pennyS');
    }
    catch(e){
        console.log('not Found ' + e);
        return Promise.reject();
    }
    return User.findOne({
        'tokens.token': token,
        'tokens.access': 'auth'
    });   
};

UserSchema.methods.removeToken = function(token){
    var user = this;
    return user.update({
        $pull: {
            tokens: {token}
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
