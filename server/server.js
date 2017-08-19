const path = require('path');
const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const bodyParser = require('body-parser');
const _ = require('lodash');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;    //Telling mongoose which promise library to use;
mongoose.connect('mongodb://localhost:27017/FakeInsta');

const publicPath = path.join(__dirname,'../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

var {Users} = require('./models/user');

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
    
    socket.on('onSignUp',(newUser)=>{
        var user = new Users(newUser);
        user.save().then(()=>{
                //PERFORM TASK AFTER SAVING NEW USER TO DB.
        });
        socket.emit('redirect',{});
        socket.emit('SignUpInfo',user);
    });
        
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