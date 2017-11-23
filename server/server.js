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
var engines = require('consolidate');
var url = require('url');

mongoose.Promise = global.Promise;    //Telling mongoose which promise library to use;
mongoose.connect('mongodb://localhost:27017/FakeInsta');

const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
//app.set('view engine', 'hbs');
const publicPath = path.join(__dirname,'../public');
//app.set('view engine', 'ejs');
//app.engine('html', require('ejs').renderFile);
app.set('views', publicPath);
//app.set('view engine', 'html');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

var {Users} = require('./models/user');
var {Images} = require('./models/images');

//Cloud Configured
cloudinary.config({ 
  cloud_name: 'https-blog-5946b-firebaseapp-com', 
  api_key: '456286155712342', 
  api_secret: 'sC4_am-XrdDs4AuMkY1am5-tI9c' 
});

//app.set('../',__dirname+'/views');
//app.use("/public", express.static(publicPath));
app.use(express.static(publicPath));
//Parse JSON data
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//User Connected
io.on('connection',(socket)=>{
    
    console.log('New user connected');
    
    //User  Disconnected
    socket.on('disconnect',()=>{
       console.log('User was disconnected'); 
    });
    
    //SignUp Route
    app.post('/signUp',(req,res)=>{
        var body = _.pick(req.body,['email','username','location','password']);
        var id = mongoose.Types.ObjectId();
        var user = new Users(body);
        user.posts = 0;
        user._id = id;
        user.mainStatus = "Hello there!";
        user.url = 'images/anony.jpg'
        id = id.toString();
        user.save().then(()=>{
            res.redirect(url.format({
                  pathname:"profile.html",
                  query: {
                      id: id
                   }
            }));
        }).catch((e)=>{
            res.status(400).send(e);
        });
    });
    
    //MainPage Route
    app.post('/mainPage',(req,res)=>{
       var body = _.pick(req.body,['email','password']);      
       Users.findByCredentials(body.email,body.password).then((user)=>{
            //redirecting along with some currenltly logged in user info
             var id = (user._id).toString();
               res.redirect(url.format({
                  pathname:"mainPage.html",   
                  query: {
                     "id": id
                   }
               }));           
       });      
    });
    
    //On ProfileButton Click
    app.post('/profile',(req,res)=>{
        var body = _.pick(req.body,['id']);
        res.send(url.format({
          pathname:"profile.html",   
          query: {
             "id": body.id
           }
        }));
    });
    
    app.post('/userAcc',(req,res)=>{
        var body = _.pick(req.body,['email','id']);
        res.send(url.format({
          pathname:"userAcc.html",   
          query: {
             "email": body.email,
              "id": body.id,
              "user": "yes"
           }
        }));        
    });
    
    //Profile Update Route
    app.post('/update',(req,res)=>{
        var body = _.pick(req.body,['email','username','fullname','work','location','url','mobile','qualities','bday']);
        Users.findOneAndUpdate(
        { 
            email :body.email 
        },
        { 
            $set:
            { 
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
            Images.update(
            {
                email:user.email
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
    
    //Fetching all the images from DB
    socket.on('pageLoad',(info)=>{
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
    
});
//Server Started
server.listen(port,()=>{
   console.log(`Server is up on port ${port}`); 
});