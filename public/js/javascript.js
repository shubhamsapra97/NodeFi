var socket = io();

socket.on('connect',function(){
   console.log('Connected to server'); 
});

socket.on('disconnect',function(){
   console.log('Disconnected from server'); 
});
   

if($("body").data("title") === "index"){
    
    socket.on('onSignUp' , function(user){
        console.log('user');
    });
    
    $("#SignInButton").click(function(){
       window.location = 'signIn.html'; 
    });
    
    $("#SignUpButton").click(function(){
       window.location = 'signUp.html'; 
    });
    
}



if($("body").data("title") === "signInPage"){
            
}

if($("body").data("title") === "signUpPage"){

//    $('#SignUpButton').click(function(ev) {
//        socket.emit('onSignUp',{
//            email: $('[name=email]').val(),
//            fullname: $('[name=fullname]').val(),
//            username: $('[name=username]').val(),
//            password: $('[name=password]').val()
//        });
//    });
    
//    socket.on('redirect',function(user){
//        window.location = 'views/mainPage.ejs';
//    });
//    
//    $("#SignUpButton").click(function(){
//        alert("hello");
//       window.location = 'mainPage'; 
//    });
//    
}

socket.on('SignUpInfo',function(user){
    console.log(user);
});

if($("body").data("title") === "mainPage"){
    
    $("#PostInput").click(function(){
         
    });
    
}

