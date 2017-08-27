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
    var CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/https-blog-5946b-firebaseapp-com/upload';
    var CLOUDINARY_UPLOAD_PRESET = 'umw6g5ma';
    
    var fileUpload = document.getElementById('fileUpload');
    var preview = document.getElementById('preview');
    
    fileUpload.addEventListener('change',function(e){
        var file = event.target.files[0];
        var formData = new FormData();
        formData.append('file',file);
        formData.append('upload_preset',CLOUDINARY_UPLOAD_PRESET);
        
        axios({
           url: CLOUDINARY_URL,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: formData
        }).then(function(res){
           console.log(res);
           preview.src = res.data.secure_url;
           socket.emit('onPost',{
               email: document.getElementById("userEmail").innerText,
               username: document.getElementById("userName").innerText,
               imageUrl: res.data.secure_url 
           });
        }).catch(function(err){
            console.log(err);
        });
    
    }); 
}

