// Importing the libraries
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const _ = require('lodash');
const mongoose = require('mongoose');
const hbs = require('hbs');
const fs = require('fs');
const cloudinary = require('cloudinary');
const engines = require('consolidate');
const url = require('url');
var session = require('express-session');
const internetAvailable = require("internet-available");
const exphbs = require('express-handlebars');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
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
app.use(cookieParser());

app.set('views', publicPath);
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

var {Users} = require('./models/user');
var {Images} = require('./models/images');

//Cloud Configured
cloudinary.config({ 
  cloud_name: 'https-blog-5946b-firebaseapp-com', 
  api_key: '456286155712342', 
  api_secret: 'sC4_am-XrdDs4AuMkY1am5-tI9c' 
});


app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(session({
    secret: "kvkjsdsbj12334",
    resave:false,
    saveUninitialized: false,
    cookie:{
        authStatus: "NotLoggedIn",
        secure: false
    },
    rolling: true
}));



app.use(function (req, res, next){
    if(req.url == '/login' || req.url == '/register' || req.session.user){
       next();
    }
});




io.use(sharedsession(session({
    secret: "kvkjsdsbj12334",
    resave:false,
    saveUninitialized: false,
    cookie:{
        authStatus: "NotLoggedIn",
        secure: false
    },
    rolling: true
}))); 
       
 io.use(function(socket, next) {
    var req = socket.handshake;
//    console.log(req.session.id);

     next();

});

//User Connected
io.on('connection',(socket)=>{
    
    console.log('New user connected');
    
    //User  Disconnected
    socket.on('disconnect',()=>{
       console.log('User was disconnected'); 
    });
    
    internetAvailable({
        timeout: 1000
    }).then(function(){
        console.log("Internet available");
    }).catch(function(){
        console.log("No internet");
    });
    
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
            req.session.user = user;
            req.session.cookie.authStatus = "loggedIn";
            res.redirect(url.format({
                  pathname:"profile.html",
                  query: {
                      id: id,
                      email: user.email
                   }
            }));
        }).catch((e)=>{
            res.status(400).send(e);
        });
    });
    
    //MainPage Route
    app.post('/login',(req,res)=>{
       var body = _.pick(req.body,['email','password']);   
       var email = body.email;
       var password = body.password;
      
       req.checkBody('email','Email is required').notEmpty();
       req.checkBody('email','Email is not valid').isEmail();
       req.checkBody('password','Password is required').notEmpty();
        
       var errors = req.validationErrors();
//        socket.emit('loginErrors',{
//               errors: errors
//        });
        
       if(errors){
           res.render('index.html',{
               errors: errors
           });       
       }
        else{
            Users.findByCredentials(body.email,body.password).then((user)=>{
                //redirecting along with some currenltly logged in user info
                 req.session.user = user;
                 req.session.cookie.authStatus = "loggedIn";
                req.session.user = user;
//                socket.handshake.session.authStatus = 'LoggedIn';
//                socket.handshake.headers.cookie.auth = 'NOt';
//                socket.handshake.session.save();
                 var id = (user._id).toString();
                   res.redirect(url.format({
                      pathname:"mainPage.html",   
                      query: {
                         "id": id
                       }
                   }));           
            }).catch((error) => {
              console.log(error);
            }); 
        }    
        
        
    });
    
        //On ProfileButton Click
    app.post('/profile',(req,res)=>{
        var body = _.pick(req.body,['id','email']);
        req.session.cookie.authStatus = "loggedIn";
        return res.send(url.format({
          pathname:"profile.html",   
          query: {
             "id": body.id,
             "email": body.email
           }
        }));
    });
    
    app.post('/userAcc',(req,res)=>{
        req.session.cookie.authStatus = "userACC";
        req.session.save();
        var body = _.pick(req.body,['email','id']);
        return res.send(url.format({
          pathname:"userAcc.html",   
          query: {
             "email": body.email,
              "id": body.id,
              "user": "yes"
           }
        }));   
    });
    
    app.get('/logOut',(req,res)=>{
        req.session.cookie.authStatus = "loggedOut";
         req.session.destroy(function (err) {
            return res.send(url.format({
              pathname:"index.html"
            })); 
         });
    });
    
    app.post('/delete',(req,res)=>{
       var body = _.pick(req.body,['email','id']);
       req.session.cookie.authStatus = 'loggedOut';
       
       Users.remove({ _id: body.id }, function(err) {
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
        var obj1;

        Users.findOneAndUpdate(
        { 
            username :body.username 
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
            
            if(body.confirmPass){
                user.password = body.confirmPass;
                user.save();
            }
            
            Images.update(
            {
                username: user.username
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
                
            });
            
            console.log('Profile Updated');
            
            res.redirect(url.format({
                pathname:"mainPage.html",   
                query: {
                    "id": (user._id).toString()
                }
            }));      
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
        Images.find({}).lean().skip(Number(skip)).sort({
            date: -1,
            time: -1  
        }).limit(8).exec(function(err, docs) {
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
        Images.find({
            email: info.email
        }).lean().exec(function(err, docs) {
            if (!err){                 
                socket.emit('userImages', docs);
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