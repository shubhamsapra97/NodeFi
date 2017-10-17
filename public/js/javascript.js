var socket = io();

socket.on('connect',function(){
   console.log('Connected to server'); 
});

socket.on('disconnect',function(){
   console.log('Disconnected from server'); 
});
   
//index.html Js
if($("body").data("title") === "index"){
    
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
var CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/https-blog-5946b-firebaseapp-com/upload';
var CLOUDINARY_UPLOAD_PRESET = 'umw6g5ma';
if($("body").data("title") === "mainPage"){
    //fetching info from search url
    var params = $.deparam(window.location.search);
    
    var fileUpload = document.getElementById('fileUpload');
    
    //Fetches user info and all posts as soon as page loads
    $(function(){
        socket.emit('pageLoad',{});
        socket.emit('userInfo',{
            email: params.email
        });
     });
    
    var like;
    socket.on('allImages',function(images){
        var postStatus = document.getElementsByClassName('.postStatus');
        for(var i=0;i<images.length;i++){
           like = images[i].like + " Likes";
           if(!images[i].status){ 
//               console.log(postStatus);
           }     
           var template = document.getElementById("post-template").innerHTML;
           var html = Mustache.render(template,{
               user: images[i].username,
               url: images[i].url,
               time: images[i].time,
               like: like,
               status: images[i].status,
               location: images[i].location,
               dp: images[i].userDp
           });
           document.getElementById("allPosts").innerHTML += html;
        }
    });
    
    var currentUser = {};
    //current user info received
    socket.on('UserInfo',function(user){
         currentUser = Object.assign({}, user); 
//         console.log(currentUser);
    });
    
    var status;
    //Post Upload button click 
    fileUpload.addEventListener('change',function(e){
        status = $("#statusText").val(); 
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
           var likes = 0+" Likes";
           //Mustache Templating    
           var template = document.getElementById("post-template").innerHTML;
           var html = Mustache.render(template,{
               user: currentUser.username,
               url: res.data.secure_url,
               time: time,
               like: likes,
               status: status,
               location: currentUser.location,
               dp: currentUser.url
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
               email:currentUser.email,
               username:currentUser.username,
               imageUrl:res.data.secure_url,
               time: time,
               status: status,
               location: currentUser.location,
               url: currentUser.url
           });
            
        }).catch(function(err){
            console.log(err);
        });
    
    });
    
    //Like and Dislike Button Functionality
    var c;
    function hasClass(elem, className) {
        return elem.className.split(' ').indexOf(className) > -1;
    }
    document.addEventListener('click', function (e) {
        if (hasClass(e.target, 'postLike')) {
            c = $(e.target).parent().next().text();
            if($(e.target).hasClass('fa-heart')) {  
                $(e.target).removeClass('fa-heart').addClass('fa-heart-o').css({"color": ""});
                $(e.target).parent().next().text(parseInt(c) - 1 + " Likes");
                socket.emit('Dislike',{
                   name: e.target.title,
                   url: e.target.id
                });
            }
            else{
                $(e.target).css({"color": "red"}).removeClass('fa-heart-o').addClass('fa-heart');
                $(e.target).parent().next().text(parseInt(c) + 1 + " Likes");
                socket.emit('Like',{
                   name: e.target.title,
                   url: e.target.id
                });
            }
        } else if (hasClass(e.target, 'postComment')) {
            alert('test');
        }

    }, false);
    
    // Ajax request to redirect from main page to profile page along with user info
    $(".updateProfile").click(function(){
        $.ajax({
           url : '/profile',
           type : 'POST',
           data : {
             username: currentUser.username,
             location: currentUser.location,
             email: currentUser.email,
             fullname: currentUser.fullname,
             website: currentUser.website,
             url: currentUser.url   
           },
           success : function(data){
              window.location.replace(data);   
           }
        });
        
    });
    
    $(".personalAcc").click(function(){
        $.ajax({
           url : '/userAcc',
           type : 'POST',
           data : {
             username: currentUser.username,
             location: currentUser.location,
             email: currentUser.email,
             fullname: currentUser.fullname,
             website: currentUser.website,
             url: currentUser.url   
           },
           success : function(data){
              window.location.replace(data);   
           }
        });
        
    });
    
}

if($("body").data("title") === "profilePage"){
    var params = $.deparam(window.location.search);
    
    //Fetches all user info as soon as page loads
    $(function(){
        socket.emit('profileuserInfo',{
            email: params.email
        });
    });
    
    //Fetching profile user info
    socket.on('profileUserInfo',function(user){
        // Autofilling Info already provided by user
        document.getElementById('email').value = user.email;
        document.getElementById('username').value = user.username;
        document.getElementById('location').value = user.location; 
        if(user.website){
            document.getElementById('website').value = user.website;
        }
        if(user.fullname){
            document.getElementById('fullname').value = user.fullname;
        }
        if(user.url){
            document.getElementById('profilePic').src = user.url;
            document.getElementById('url').value = user.url;
        }
    });
    
    // Uploading User Display Pic to Cloud 
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
           document.getElementById("profilePic").src = res.data.secure_url;
           document.getElementById("url").value = res.data.secure_url;    
        });
        
    });
      
}