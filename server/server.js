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

io.on('connection',(socket)=>{
    
    console.log('New user connected');
    
    socket.on('disconnect',()=>{
       console.log('User was disconnected'); 
    });
    
    //SignUp Route
    app.post('/signUp',(req,res)=>{
        var body = _.pick(req.body,['email','fullname','username','password']);
        var user = new Users(body);
        user.save().then(()=>{
            res.redirect(url.format({
                  pathname:"mainPage.html",
                  query: {
                     "email": body.email,
                     "username": body.username,
                     "fullname": body.fullname
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
//           Usery = JSON.parse(JSON.stringify(user));
           res.header('x-auth',user.tokens[0].token);
               //redirecting along with some currenltly logged in user info
               res.redirect(url.format({
                  pathname:"mainPage.html",   
                  query: {
                     "email": user.email,
                     "username": user.username,
                     "fullname": user.fullname
                   }
               }));
           
       });
      
    });
    //On ProfileButton Click
    app.post('/profile',(req,res)=>{
        var body = _.pick(req.body,['email','username','fullname']);
        console.log(body);
        res.send(url.format({
          pathname:"profile.html",   
          query: {
             "email": body.email,
             "username": body.username,
             "fullname": body.fullname
           }
        }));
        console.log("Done");
    });
    //Profile Update Route
    app.post('/update',(req,res)=>{
        var body = _.pick(req.body,['email','username','fullname','website','location','url']);
        Users.findOneAndUpdate(
        { 
            email :body.email 
        },
        { 
            $set:
            { 
                username: body.username,
                fullname: body.fullname,
                website: body.website,
                location: body.location,
                url: body.url
            }
        },
        function(err, user) {
            console.log('Profile Updated');
        });
        res.redirect('/mainPage.html');
    });
    
    //Saving new image to db
    socket.on('onPost',(user)=>{
       var image = new Images({
          email: user.email,
          username: user.username,
          url: user.imageUrl,
          time: user.time,
          like: 0,
          status: user.status   
       });
       image.save().then((image)=>{
           console.log(`Image Uploaded to DB by ${image.username}`);
       });       
    });
    
    //Like Functionality
    socket.on('Like',(info)=>{
        Images.findOneAndUpdate({
            username :info.name,
            url: info.url
        }, {
            $inc : {
                'like' : 1
            }
        });
    });
    
    //Dislike Functionality
    socket.on('Dislike',(info)=>{
        Images.findOneAndUpdate({
            username :info.name,
            url: info.url
        }, {
            $inc : {
                'like' : -1
            }
        });
    });
    //Fetching all the images from DB
    socket.on('pageLoad',(info)=>{
        Images.find({}, function(err, docs) {
            if (!err){ 
                socket.emit('allImages', docs);
            } else {
                throw err;
            }
        });         
    });
    
});
//Server Started
server.listen(port,()=>{
   console.log(`Server is up on port ${port}`); 
});