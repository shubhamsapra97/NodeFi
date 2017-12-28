// Importing the libraries
const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const _ = require('lodash');
const mongoose = require('mongoose');
const hbs = require('hbs');
const cloudinary = require('cloudinary');
const engines = require('consolidate');
const url = require('url');
var session = require('express-session');
const internetAvailable = require("internet-available");
const cookieParser = require('cookie-parser');

mongoose.Promise = global.Promise;    //Telling mongoose which promise library to use;
mongoose.connect('mongodb://localhost:27017/FakeInsta'); //Connecting to DB.


//Setting Up Server
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

//To fetch Static Files (html)
const publicPath = path.join(__dirname,'../public');
app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser('1234'));

//Setting Up views..
app.set('views', publicPath);
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

//Export from other files
var {Users} = require('./models/user');
var {Images} = require('./models/images');
var {authenticate} = require('../middleware/authenticate');

//Cloud Configured
cloudinary.config({ 
  cloud_name: 'https-blog-5946b-firebaseapp-com', 
  api_key: '456286155712342', 
  api_secret: 'sC4_am-XrdDs4AuMkY1am5-tI9c' 
});

//Session Config
var sessionMiddleware = session({
    secret: "1234",
    resave:false,
    saveUninitialized: false,
    cookie:{
        authStatus: "NotLoggedIn",
        maxAge: 100000000000000
    }
});

//Session Middleware
app.use(sessionMiddleware);

//Socket.io Middleware
io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

//Auth Check.
app.use(function (req, res, next){
    if(req.session.user || req.url == '/login'){
        next();
    }
});

//User Connected
io.on('connection',(socket)=>{
    
    console.log('New user connected'); 
    
    // Prevent Unauth Dialog Box To appear on Login Page..
    var referer = socket.request.headers.referer;
    if(!socket.request.session.user && referer !== "http://localhost:3000/" && referer !== "http://localhost:3000/index.html"){
        socket.emit('unauthorized',{});
    }   
    
    //User  Disconnected
    socket.on('disconnect',()=>{
       console.log('User was disconnected'); 
    });
    
    
    //Login Page Route
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
            
            //Generate Tokens For authentication
            return user.generateAuthToken();
            
        }).then((token)=>{
            //Sending Tokens as headers for verification
            res.header('x-auth',token);
            
            //Saving user in session 
            req.session.user = user;
            req.session.save();
            
            //Redirection
            res.redirect("profile.html");
            
        }).catch((e)=>{
            console.log(e);
            res.redirect('/');
        });
    });
    
    //MainPage Route
    app.post('/login',(req,res)=>{
       var body = _.pick(req.body,['email','password']);   
       var email = body.email;
       var password = body.password;
       
       Users.findOne({email}).then((user)=>{
           if(!user){
               console.log('No User Found');
           }
           
           return user.bcryptPass(body.password).then((user)=>{
               
                var id = (user._id).toString();
                res.header('x-auth',user.tokens[0].token);
               
                req.session.user = user;
                req.session.save();
               
                res.redirect(url.format({
                  pathname:"mainPage.html",
                  query: {
                      email: user.email
                  }
                }));
               
           })
           
       }).catch((err)=>{
           console.log(err);
           res.redirect('/');           
       });
    });
    
    //On ProfileButton Click
    app.post('/profile',authenticate,(req,res)=>{
        var body = _.pick(req.body,['id','email']);
        res.header('x-auth',req.token);
        if(req.session.user){
            return res.send(url.format({
              pathname:"profile.html"
            }));
        }
    });
    
    //Route To redirect to User Account Page
    app.post('/userAcc',authenticate,(req,res)=>{
        var body = _.pick(req.body,['email','id']);
        res.header('x-auth',req.token);
        return res.send(url.format({
          pathname:"userAcc.html",   
          query: {
              "email": body.email,
              "user": "yes"
           }
        }));   
    });
    
    //Logout Route
    app.get('/logOut',authenticate,(req,res)=>{
        req.user.removeToken(req.token).then(()=>{
           req.session.destroy();
           return res.status(200).send(url.format({
              pathname:"index.html"
            }));  
        },()=>{
            res.status(400).send();
        });
    });
    
    //Delete Account Route
    app.post('/delete',(req,res)=>{
       var body = _.pick(req.body,['email','id']);
       
       //Destroy the Session
       req.session.destroy();
        
       //Remove User from DB
       Users.remove({ _id: body.id }, function(err) {
           console.log('User Account Deleted Successfully');
       });     
        
        //Delete all User Images 
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
            
            //Check if Password was changed
            if(body.confirmPass){
                user.password = body.confirmPass;
                user.save();
            }
            
            //Update Images with latest User Info
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
                      email: user.email
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
           
       //Save Image to DB
       image.save().then((image)=>{
           console.log(`Image Uploaded to DB by ${image.username}`);
           socket.broadcast.emit('newPost',image);
       });
        
       // Increase User Posts Count by 1
       Users.findOneAndUpdate({
           _id: user.id 
       },{
           $inc: {
               'posts': 1
           }
       }).then((image)=>{
           
       });    
    });
    
    // Saving Main Page Text Post
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
    
    // User Account Status Update
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
        console.log("Like");
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
        
        //Sending 8 images per request
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
        
        //Sending all users
        Users.find({}).lean(10).exec(function(err, docs) {
            if (!err){ 
                socket.emit('allUsers', docs);
            } else {
                throw err;
            }
        });
        
    });
    
    //Sending User Posts on User Account Page
    socket.on('userPosts',(info)=>{
        //Sending 6 Posts oer request
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
    
    // Event received as soon as mainPage and UserAcc Page loads 
    socket.on('userInfo',(info)=>{
        Users.findByEmail(info.email).then((user)=>{
            socket.emit('UserInfo', user);
        });
    });
    
    // sending user info on profile page load
    socket.on('profileuserInfo',(info)=>{
        Users.findByEmail(socket.request.session.user.email).then((user)=>{
            socket.emit('profileUserInfo', user);
        });
    });
    
    // Matching 2 Pa
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