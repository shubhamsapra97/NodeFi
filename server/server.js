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

mongoose.Promise = global.Promise;    //Telling mongoose which promise library to use;
mongoose.connect('mongodb://localhost:27017/FakeInsta');

const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
app.set('view engine', 'hbs');
const publicPath = path.join(__dirname,'../public');
//app.set('view engine', 'ejs');
//app.engine('html', require('ejs').renderFile);
//app.set('views', __dirname + '../views');
//app.set('view engine', 'html');

var {Users} = require('./models/user');
var {Images} = require('./models/images');

cloudinary.config({ 
  cloud_name: 'https-blog-5946b-firebaseapp-com', 
  api_key: '456286155712342', 
  api_secret: 'sC4_am-XrdDs4AuMkY1am5-tI9c' 
});

//app.set('../',__dirname+'/views');
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
    
    app.post('/signUp',(req,res)=>{
        var body = _.pick(req.body,['email','fullname','username','password']);
        var user = new Users(body);
        user.save().then(()=>{
            return user.generateAuthToken();
        }).then((token)=>{
            res.header('x-auth',token); 
        }).catch((e)=>{
            res.status(400).send(e);
        });
        res.render('mainPage.hbs',user);
    });
    
    app.post('/signIn',(req,res)=>{
       var body = _.pick(req.body,['email','password']);
       
       Users.findByCredentials(body.email,body.password).then((user)=>{
           res.header('x-auth',user.tokens[0].token);
           res.render('mainPage.hbs',user);
       }).catch((err)=>res.status(404).send(err));
    });
    
//    socket.on('onPost',(user)=>{
//       var image = new Images({
//          email: user.email,
//          username: user.username,
//          url: user.imageUrl
//       });
//       image.save().then((image)=>{
//           console.log("Image Uploaded to DB by `${image.email}` ");
//       });       
//    });
        
});

app.get('/',(req,res)=>{
    res.render('index');
});

//var user = new Users(body);
//        user.save().then(()=>{         
//            return user.generateAuthToken();
//        }).then((token)=>{
//            socket.emit('onSignUp' , body);
//            res.header('x-auth',token).send(user);
//            res.redirect('/mainPage.html');   
//        }).catch((e)=>{
//            res.status(400).send(e);
//        });

server.listen(port,()=>{
   console.log(`Server is up on port ${port}`); 
});