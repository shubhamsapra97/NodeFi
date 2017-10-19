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
        socket.emit('userInfo',{
            email: params.email
        });
        socket.emit('pageLoad',{});
     });
    
    var like,index,likeIcon;
    var currentUser = {};
    var likesArray = new Array();
    socket.on('allImages',function(images){
        var postStatus = document.getElementsByClassName('.postStatus');
        for(var i=0;i<images.length;i++){
           like = images[i].like + " Likes";
           likesArray = images[i].userLiked;            
           index = likesArray.indexOf(currentUser.username);
           if(index>-1){
               likeIcon = 'fa-heart';
           }
            else{
                likeIcon = 'fa-heart-o';
            }   
           var template = document.getElementById("post-template").innerHTML;
           var html = Mustache.render(template,{
               user: images[i].username,
               url: images[i].url,
               time: images[i].time,
               like: like,
               status: images[i].status,
               location: images[i].location,
               dp: images[i].userDp,
               likeIcon: likeIcon               
           });
           $("#allPosts").prepend(html);
        }
    });
    
    //current user info received
    socket.on('UserInfo',function(user){
        currentUser = Object.assign({}, user); 
            //Like and Dislike Button Functionality
        var c;
        function hasClass(elem, className) {
            return elem.className.split(' ').indexOf(className) > -1;
        }

        document.addEventListener('click', function (e) {
            if (hasClass(e.target, 'postLike')) {
                c = $(e.target).parent().next().text();
                if($(e.target).hasClass('fa-heart')) {  
                    $(e.target).removeClass('fa-heart').addClass('fa-heart-o');
                    $(e.target).parent().next().text(parseInt(c) - 1 + " Likes");
                    var index = likesArray.indexOf(currentUser.username);
                    likesArray.splice(index, 1);
                    socket.emit('Dislike',{
                        name: e.target.title,
                        url: e.target.id,
                        user: currentUser.username
                    });
                }
                else{
                    $(e.target).removeClass('fa-heart-o').addClass('fa-heart');
                    $(e.target).parent().next().text(parseInt(c) + 1 + " Likes");
                    likesArray.push(currentUser.username);
                    socket.emit('Like',{
                        name: e.target.title,
                        url: e.target.id,
                        user: currentUser.username
                    });
                }
            } else if (hasClass(e.target, 'postComment')) {
                alert('test');
            }

        }, false);
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
               dp: currentUser.url,
               likeIcon: 'fa-heart-o'
           });
           $("#allPosts").prepend(html);
 
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

if($("body").data("title") === "userAcc"){
    var params = $.deparam(window.location.search);
    $(function(){
        socket.emit('userInfo',{
            email: params.email
        });
        socket.emit('userPosts',{
            email: params.email
        });
    });
    
    var currentUser = {};
    //current user info received
    socket.on('UserInfo',function(user){
        currentUser = Object.assign({}, user);
        console.log(currentUser);
        
        var template = document.getElementById("user-template").innerHTML;
        var html = Mustache.render(template,{
           user: currentUser.username,
           fullname: currentUser.fullname,    
           location: currentUser.location,
           dp: currentUser.url,
           website: currentUser.website,
           email: currentUser.email,
           posts: currentUser.posts    
        });
        document.getElementById("header").innerHTML += html;
        
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
        
    });
    
    socket.on('userImages',function(images){
        for(var i=0;i<images.length;i++){    
           var template = document.getElementById("post-template").innerHTML;
           var html = Mustache.render(template,{
               user: images[i].username,
               url: images[i].url,
               time: images[i].time,
               like: images[i].like,
               status: images[i].status,
               location: images[i].location,
               dp: images[i].userDp
           });
           $("#Posts").prepend(html);
        }
    });
 
//OVERLAY ON USER POSTS    
//    function hasClass(elem, className) {
//        return elem.className.split(' ').indexOf(className) > -1;
//    }
//    document.addEventListener('mouseover', function (e) {
//        if (hasClass(e.target, 'OnePost')) {
//               var top = document.getElementsByClassName(e.target.classList[1]);
//                alert(top);
//               document.getElementById("overlay").style.display = "block";
//        } else{
//            
//        }
//
//    }, false);
//    document.addEventListener('mouseout', function (e) {
//        if (hasClass(e.target, 'OnePost')) {
//               document.getElementById("overlay").style.display = "none";
//        } else{
//            
//        }
//
//    }, false);
    
}