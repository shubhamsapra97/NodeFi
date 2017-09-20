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
    
}

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


socket.on('SignUpInfo',function(user){
    console.log(user);
});

if($("body").data("title") === "mainPage"){
    var count;
    var params = $.deparam(window.location.search);
    
    socket.emit('fetchInfo',function(){
       i:1
    });
    
    socket.on('initialInfo',function(info){
        count = info.count;
    });
    
    var CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/https-blog-5946b-firebaseapp-com/upload';
    var CLOUDINARY_UPLOAD_PRESET = 'umw6g5ma';
    
    var fileUpload = document.getElementById('fileUpload');
    
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
           var time = moment(moment().valueOf()).format('h:mm a  MM-DD-YYYY');
           var template = document.getElementById("post-template").innerHTML;
           var html = Mustache.render(template,{
               user: params.username,
               url: res.data.secure_url,
               time: time
           });
           document.getElementById("allPosts").innerHTML += html;
        
//            var source = $("#post-template").html();
//            var template = Handlebars.compile(source);
//            var context = {
//                post: "Shubham",
//                u: res.data.secure_url
//            };
//            var el_html = ;
//            $("#allPosts").append(template(context));
            
           socket.emit('onPost',{
               email:params.email,
               username:params.username,
               imageUrl:res.data.secure_url 
           });
        }).catch(function(err){
            console.log(err);
        });
    
    });
}

