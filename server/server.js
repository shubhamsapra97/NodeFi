// Importing the libraries
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const _ = require('lodash');
const mongoose = require('mongoose');
const hbs = require('hbs');
//const fs = require('fs');
const cloudinary = require('cloudinary');
const engines = require('consolidate');
const url = require('url');
var session = require('express-session');
const internetAvailable = require("internet-available");
//const exphbs = require('express-handlebars');
const expressValidator = require('express-validator');
//const flash = require('connect-flash');
//const passport = require('passport');
//const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const sharedsession = require("express-socket.io-session");


mongoose.Promise = global.Promise;    //Telling mongoose which promise library to use;
mongoose.connect('mongodb://localhost:27017/FakeInsta');

const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);


const publicPath = path.join(__dirname,'../public');
app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser('1234'));

app.set('views', publicPath);
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

var {Users} = require('./models/user');
var {Images} = require('./models/images');
var {authenticate} = require('../middleware/authenticate');

//Cloud Configured
cloudinary.config({ 
  cloud_name: 'https-blog-5946b-firebaseapp-com', 
  api_key: '456286155712342', 
  api_secret: 'sC4_am-XrdDs4AuMkY1am5-tI9c' 
});


//app.use(passport.initialize());
//app.use(passport.session());
//
//app.use(expressValidator({
//  errorFormatter: function(param, msg, value) {
//      var namespace = param.split('.')
//      , root    = namespace.shift()
//      , formParam = root;
//
//    while(namespace.length) {
//      formParam += '[' + namespace.shift() + ']';
//    }
//    return {
//      param : formParam,
//      msg   : msg,
//      value : value
//    };
//  }
//}));
app.use(session({
    secret: "1234",
    resave:false,
    saveUninitialized: false,
    cookie:{
        authStatus: "NotLoggedIn",
        secure: false,
        maxAge: 100000000000000
    }
}));



//app.use(function (req, res, next){
//    console.log(req.session.id);
//    console.log(req.session);
////    if(req.url == '/login' || req.url == '/register' || req.session.user){
//       next();
////    }
//});



var ID=0,i=0;
io.use(sharedsession(session({
    secret: "1234",
    resave:true,
    saveUninitialized: true,
    cookie:{
        authStatus: "NotLoggedIn",
        secure: false,
        maxAge: 100000000000000
    }
}))); 
       
 io.use(function(socket, next) {
    var req = socket.handshake;
    if(i==0){        
        ID = req.sessionID;
        i++;
        next();
    }
     
    if(req.sessionStore.sessions[ID]){
        var sessionObj = JSON.parse(req.sessionStore.sessions[ID]);
        if(sessionObj.user){
            console.log("Authorized User " + sessionObj.user.username);
            next();
        }
        else{
            console.log('UNAUTH User');
            socket.emit('unauthorizedUser',{
                destination: '/index.html'
            });
//            next();
        }
    }

});

//User Connected
io.on('connection',(socket)=>{
    
    console.log('New user connected');
    
    //User  Disconnected
    socket.on('disconnect',()=>{
       console.log('User was disconnected'); 
    });
    
//    internetAvailable({
//        timeout: 1000
//    }).then(function(){
//        console.log("Internet available");
//    }).catch(function(){
//        console.log("No internet");
//    });
    
    app.get('/',(req,res)=>{
       res.render('index.html');
    });
    
    //SignUp Route
    app.post('/register',(req,res)=>{
        var body = _.pick(req.body,['email','username','location','password']);
        var id = mongoose.Types.ObjectId();
        var user = new Users(body);
        user.posts = 0;
        user._id = id;
        user.mainStatus = "Hello there!";
        user.url = 'images/anony.jpg';
        user.backgroundPic = 'https://res.cloudinary.com/https-blog-5946b-firebaseapp-com/image/upload/v1513716645/tujs9qumbcxuq0gv8qb0.jpg';
        id = id.toString();
        user.save().then(()=>{
            
            return user.generateAuthToken();
            
        }).then((token)=>{
            res.header('x-auth',token);
            socket.handshake.session.user = user;
            socket.handshake.session.save();
            res.redirect(url.format({
              pathname:"profile.html",
              query: {
                  id: id,
                  email: user.email
              }
            }));
        }).catch((e)=>{
            console.log(e);
            res.redirect('/')
        });
    });
    
    //MainPage Route
    app.post('/login',(req,res)=>{
       var body = _.pick(req.body,['email','password']);   
       var email = body.email;
       var password = body.password;
        
       Users.findOne({email}).then((user)=>{
           if(!user){
               socket.emit('loginErrors',{});
           }
           
           return user.bcryptPass(body.password).then((user)=>{
               
                var id = (user._id).toString();
                res.header('x-auth',user.tokens[0].token);
                req.session.cookie.authStatus = "not";
                req.session.save();
                
                socket.handshake.session.user = user;
                socket.handshake.session.save();
                 res.redirect(url.format({
                    pathname:"mainPage.html",   
                      query: {
                         "id": id
                      }
                 }));  
               
           })
           
       }).catch((err)=>{
           console.log(err);
           res.redirect('/');           
       });
      
      
//       req.checkBody('email','Email is required').notEmpty();
//       req.checkBody('email','Email is not valid').isEmail();
//       req.checkBody('password','Password is required').notEmpty();
        
//       var errors = req.validationErrors();
//        socket.emit('loginErrors',{
//               errors: errors
//        });
        
//       if(errors){
//           res.render('index.html',{
//               errors: errors
//           });       
//       }
//        else{ 
        
    });
    
    //On ProfileButton Click
    app.post('/profile',authenticate,(req,res)=>{
        var body = _.pick(req.body,['id','email']);
        res.header('x-auth',req.token);
        return res.send(url.format({
          pathname:"profile.html",   
          query: {
             "id": body.id,
             "email": body.email
           }
        }));
    });
    
    app.post('/userAcc',authenticate,(req,res)=>{
        var body = _.pick(req.body,['email','id']);
        res.header('x-auth',req.token);
        return res.send(url.format({
          pathname:"userAcc.html",   
          query: {
             "email": body.email,
              "id": body.id,
              "user": "yes"
           }
        }));   
    });
    
    app.get('/logOut',authenticate,(req,res)=>{
        req.user.removeToken(req.token).then(()=>{
           delete socket.handshake.session.user;
           socket.handshake.session.save();
           return res.status(200).send(url.format({
              pathname:"index.html"
            }));  
        },()=>{
            res.status(400).send();
        });
    });
    
    app.post('/delete',(req,res)=>{
       var body = _.pick(req.body,['email','id']);
       
       Users.remove({ _id: body.id }, function(err) {
           delete socket.handshake.session.user;
           socket.handshake.session.save();
           console.log('User Account Deleted Successfully');
       });     
        
        Images.find({
            email: body.email
        }, function (err, users) {
            Images.deleteMany({ 
                email: body.email
            }, function(err) {
                console.log("Removed all user Images");
                req.session.destroy(function (err) {
                  return res.send(url.format({
                      pathname:"index.html"
                  }));     
                }); 
            });
        });
    });
    
    //Profile Update Route
    app.post('/update',(req,res)=>{
        var body = _.pick(req.body,['username','fullname','work','location','url','mobile','qualities','bday','confirmPass']);
        console.log(body);

        Users.findOneAndUpdate(
        { 
            username : body.username 
        },
        { 
            $set: { 
                username: body.username,
                fullname: body.fullname,
                work: body.work,
                location: body.location,
                url: body.url,
                contact: body.mobile,
                qualities: body.qualities,
                bday: body.bday
            }
        },
        {
            new :true
        },
        function(err, user) {
            
            if(err){
                console.log(err);
            }
            
            if(body.confirmPass){
                user.password = body.confirmPass;
                user.save();
            }
            
            Images.update(
            {
                username: body.username
            }, 
            {
                userDp: user.url,
                username: user.username,
                location: user.location
            },
            {
                multi: true
            }, 
            function(err,docs) {
                console.log('Profile Updated');
                res.redirect(url.format({
                  pathname:"mainPage.html",
                  query: {
                      id: (user._id).toString()
                  }
                }));
            });
    
        });
        
    });
    
    //Saving new image to db
    socket.on('onPost',(user)=>{
       var image = new Images({
          email: user.email,
          username: user.username,
          url: user.imageUrl,
          time: user.time,
          like: 0,
          status: user.status,
          location: user.location,
          userDp: user.url,
          date: user.date   
       });
           
       image.save().then((image)=>{
           console.log(`Image Uploaded to DB by ${image.username}`);
           socket.broadcast.emit('newPost',image);
       });
        
       Users.findOneAndUpdate({
           _id: user.id 
       },{
           $inc: {
               'posts': 1
           }
       }).then((image)=>{
           
       });    
    });
    
    socket.on('postStatus',(info)=>{
        var image = new Images({
            email : info.email,
            username: info.username,
            postStatus: info.postStatus,
            time: info.time,
            like: 0,
            location: info.location,
            userDp: info.dp,
            date: info.date
        });
        
        image.save().then((image)=>{
           console.log(`Text-Post Uploaded to DB by ${image.username}`);
           socket.broadcast.emit('newPost',image);    
        });

    });
    
    socket.on('statusUpdate',(info)=>{
       Users.findOneAndUpdate({
           _id: info.id 
       },{
           $set: {
               'mainStatus': info.status
           }
       },{
           new: true
       }).then((user)=>{
           socket.emit('statusUpdated',user);          
       });    
    });
    
    //Like Functionality
    socket.on('Like',(info)=>{
        Images.findOneAndUpdate({
            url: info.url
        }, {
            $inc : {
                'like' : 1
            },
            $push : {
                'userLiked' : info.user    
        }
        }).then((image)=>{
            console.log("Liked Post");
        });
    });
    
    //Dislike Functionality
    socket.on('Dislike',(info)=>{
        Images.findOneAndUpdate({
            url: info.url
        }, {
            $inc : {
                'like' : -1
            },
            $pull : {
                'userLiked' : info.user
            }
        }).then((image)=>{
            console.log('Dislike Post');
        });
    });
    
    //Like Functionality
    socket.on('Like1',(info)=>{
        Images.findOneAndUpdate({
            postStatus: info.postStatus
        }, {
            $inc : {
                'like' : 1
            },
            $push : {
                'userLiked' : info.user    
        }
        }).then((image)=>{
            console.log("Liked Post");
        });
    });
    
    //Dislike Functionality
    socket.on('Dislike1',(info)=>{
        Images.findOneAndUpdate({
            postStatus: info.postStatus
        }, {
            $inc : {
                'like' : -1
            },
            $pull : {
                'userLiked' : info.user
            }
        }).then((image)=>{
            console.log('Dislike Post');
        });
    });
    
    //Fetching all the images from DB
    socket.on('pageLoad',(info)=>{
        internetAvailable({
            timeout: 1000
        }).then(function(){
            console.log("Internet available");
        }).catch(function(){
            console.log("No internet");
        });
        var skip = info.county*8;
        Images.find({}).lean().sort({
            _id: -1
        }).skip(Number(skip)).limit(8).exec(function(err, docs) {
            if (!err){
                if(docs.length!==0){
                    socket.emit('allImages', {
                        docs: docs,
                        empty: false
                    });
                }
                else{
                    socket.emit('allImages',{
                       empty: true 
                    });
                }
            } else {
                throw err;
            }
        });
        
        Users.find({}).lean(10).exec(function(err, docs) {
            if (!err){ 
                socket.emit('allUsers', docs);
            } else {
                throw err;
            }
        });
        
    });
    
    socket.on('userPosts',(info)=>{
        var skip = info.county*6;
        Images.find({
            email: info.email,
            postStatus : {
                "$exists" : false
            }
        }).sort({
            _id: -1
        }).skip(Number(skip)).lean().limit(6).exec(function(err, docs) {
            
            if (!err){
                
                if(docs.length!==0){
                    socket.emit('userImages', {
                        docs: docs,
                        empty: false,
                        skip: skip
                    });
                }
                else{
                    socket.emit('userImages',{
                       empty: true 
                    });
                }
                
            } else {
                throw err;
            }
            
        });
        
    });
    
    // Event received as soon as mainPage loads 
    socket.on('userInfo',(info)=>{
        Users.findByEmail(info.id).then((user)=>{
            socket.emit('UserInfo', user);
        });
    });
    
    // sending user info on profile page load
    socket.on('profileuserInfo',(info)=>{
        Users.findByEmail(info.id).then((user)=>{
            socket.emit('profileUserInfo', user);
        });
    });
    
    socket.on('passMatchProcess',(info)=>{
        Users.passMatch(info.pass,info.hashedPass).then((match)=>{
          if(match){
              socket.emit('Match',{});
          }  
          else{
              socket.emit('noMatch',{});
          }
        }).catch((error) => {
          console.log(error);
        });
    });
    
    socket.on('backgroundPic',(info)=>{
        Users.findOneAndUpdate({
            email: info.email
        }, {
            $set : {
                'backgroundPic' : info.backUrl
            }
        }).then((image)=>{
            console.log('Background Image Updated');
        });
    });
    
});
//Server Started
server.listen(port,()=>{
   console.log(`Server is up on port ${port}`); 
});