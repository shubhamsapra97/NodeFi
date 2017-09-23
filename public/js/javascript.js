var socket = io();

socket.on('connect',function(){
   console.log('Connected to server'); 
});

socket.on('disconnect',function(){
   console.log('Disconnected from server'); 
});
   
//index.html Js
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

//SignIn Page Js
if($("body").data("title") === "signInPage"){
            
}

//signUpPage Js
if($("body").data("title") === "signUpPage"){
    
}

//mainPage Js
if($("body").data("title") === "mainPage"){
    //fetching info from search url
    var params = $.deparam(window.location.search);
    
    var CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/https-blog-5946b-firebaseapp-com/upload';
    var CLOUDINARY_UPLOAD_PRESET = 'umw6g5ma';
    
    var fileUpload = document.getElementById('fileUpload');
    
    fileUpload.addEventListener('change',function(e){
        var file = event.target.files[0];
        var formData = new FormData();
        formData.append('file',file);
        formData.append('upload_preset',CLOUDINARY_UPLOAD_PRESET);
        
        //Linking with Cloud
        axios({
           url: CLOUDINARY_URL,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: formData
        }).then(function(res){
           //moment to fetch the time-date     
           var time = moment(moment().valueOf()).format('h:mm a  MM-DD-YYYY');
           //Mustache Templating    
           var template = document.getElementById("post-template").innerHTML;
           var html = Mustache.render(template,{
               user: params.username,
               url: res.data.secure_url,
               time: time
           });
           document.getElementById("allPosts").innerHTML += html;
 
// Handlebars Templating
            
//            var source = $("#post-template").html();
//            var template = Handlebars.compile(source);
//            var context = {
//                post: "Shubham",
//                u: res.data.secure_url
//            };
//            var el_html = ;
//            $("#allPosts").append(template(context));
           
           // Sending data to server on image upload
           socket.emit('onPost',{
               email:params.email,
               username:params.username,
               imageUrl:res.data.secure_url,
               time: time
           });
            
        }).catch(function(err){
            console.log(err);
        });
    
    });
    
    //Like and Dislike Button Functionality
    function hasClass(elem, className) {
        return elem.className.split(' ').indexOf(className) > -1;
    }
    document.addEventListener('click', function (e) {
        if (hasClass(e.target, 'postLike')) {
            if($(e.target).hasClass('fa-heart')) {  
                $(e.target).removeClass('fa-heart').addClass('fa-heart-o').css({"color": ""});
                socket.emit('Dislike',{
                   name: e.target.title,
                   url: e.target.id
                });
            }
            else{
                $(e.target).css({"color": "red"}).removeClass('fa-heart-o').addClass('fa-heart');
                socket.emit('Like',{
                   name: e.target.title,
                   url: e.target.id
                });
            }
        } else if (hasClass(e.target, 'postComment')) {
            alert('test');
        }

    }, false);
    
}

