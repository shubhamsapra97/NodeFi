var socket = io();

socket.on('connect',function(){
   console.log('Connected to server');
   $("#overlay12").css("display","none");
});

socket.on('disconnect',function(){
   console.log('Disconnected from server'); 
   $("#overlay12").css("display","block");
});

//SignIn Page Js
if($("body").data("title") === "signInPage"){
    $(".fa").click(function(){
       if ($('.fa').hasClass('fa-pencil')){
           $(".fa").removeClass('fa-pencil').addClass('fa-times');    
           $('.signInContent').addClass('fadeOut');
           setTimeout(function(){ 
               $(".signUpContent").css('display','block').removeClass('fadeOut').addClass('fadeInUp'); 
           }, 500);    
       }
       else{
           $(".fa").removeClass('fa-times').addClass('fa-pencil');    
           $('.signUpContent').removeClass('fadeInUp').css('display','none');   
           $(".signInContent").removeClass('fadeOut').addClass('fadeInUp'); 
        }
    });  

}

//mainPagnodwe Js
var CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/https-blog-5946b-firebaseapp-com/upload';
var CLOUDINARY_UPLOAD_PRESET = 'umw6g5ma';

if($("body").data("title") === "mainPage"){
    
    //Prevent Page from redirecting to Login Page
    history.pushState(null, null, $(location).attr('href'));
    window.addEventListener('popstate', function () {
        history.pushState(null, null, $(location).attr('href'));
    });
    
    //fetching info from search url
    var params = $.deparam(window.location.search);
    
    var fileUpload = document.getElementById('fileUpload');
    var count=0;
    //Fetches user info and all posts as soon as page loads
    $(function(){
        socket.emit('userInfo',{
            id: params.id
        });
        socket.emit('pageLoad',{
            id: params.id,
            county: count
        });
     });
    
    var like,index,likeIcon;
    var currentUser = {};
    var likesArray = new Array();
    socket.on('allImages',function(images){
        $("#loader1").remove();
        var postStatus = document.getElementsByClassName('.postStatus');
        if(!images.empty){
            
            for(var i=0;i<images.docs.length;i++){
               like = images.docs[i].like + " Likes";
               likesArray = images.docs[i].userLiked;            
               index = likesArray.indexOf(currentUser.username);
               if(index>-1){
                   likeIcon = 'fa-heart';
               }
                else{
                    likeIcon = 'fa-heart-o';
                }

               if(images.docs[i].postStatus){
                   //appending text Posts
                   var template = document.getElementById("mainPostTemplate").innerHTML;
                   var html = Mustache.render(template,{
                       email: images.docs[i].email,
                       user: images.docs[i].username,
                       time: images.docs[i].time,
                       like: like,
                       postStatus: images.docs[i].postStatus,
                       location: images.docs[i].location,
                       dp: images.docs[i].userDp,
                       likeIcon: likeIcon,
                       date: images.docs[i].date
                   });
                   $("#allPosts").append(html);

               }  
               else{            
                   //appending image Posts
                   var template = document.getElementById("post-template").innerHTML;
                   var html = Mustache.render(template,{
                       email: images.docs[i].email,
                       user: images.docs[i].username,
                       url: images.docs[i].url,
                       time: images.docs[i].time,
                       like: like,
                       status: images.docs[i].status,
                       location: images.docs[i].location,
                       dp: images.docs[i].userDp,
                       likeIcon: likeIcon,
                       date: images.docs[i].date
                   });
                   $("#allPosts").append(html);

               }
            }
            
            if(images.docs.length > 6){
                $("#allPosts").append("<img id='loader' class='load' src='images/loader1.gif' alt='loader'>");
            }
            
        }
    });
    
    //Check if loader is visible inviewport after scroll.
    $(window).scroll(function(e) {
        if($("#loader").length !== 0) {

           var hT = $('#loader').offset().top,
               hH = $('#loader').outerHeight(),
               wH = $(window).height(),
               wS = $(this).scrollTop();
               if (wS > (hT+hH-wH) && (hT > wS) && (wS+wH > hT+hH)){ 
                    count = count+1;
                   
                    //To make loader disppear after the new posts are loaded.
                    $('#loader').removeAttr('id');
                    $('.load').attr('id', 'loader1');
                   
                    //request for new posts.
                    socket.emit('pageLoad',{
                        id: params.id,
                        county: count
                    });
                   
               }
            
        }
    });
    
    socket.on('newPost',function(images){
        var postStatus = document.getElementsByClassName('.postStatus');
               if(images.postStatus){
                   var template = document.getElementById("mainPostTemplate").innerHTML;
                   var html = Mustache.render(template,{
                       email: images.email,
                       user: images.username,
                       time: images.time,
                       like: (0+" Likes"),
                       postStatus: images.postStatus,
                       location: images.location,
                       dp: images.userDp,
                       likeIcon: "fa-heart-o",
                       date: images.date
                   });
                   $("#allPosts").prepend(html);

               }  
               else{            
                   var template = document.getElementById("post-template").innerHTML;
                   var html = Mustache.render(template,{
                       email: images.email,
                       user: images.username,
                       url: images.url,
                       time: images.time,
                       like: (0+" Likes"),
                       status: images.status,
                       location: images.location,
                       dp: images.userDp,
                       likeIcon: "fa-heart-o",
                       date: images.date
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
                    if($(e.target).parent().prev().children().hasClass('textPost')){
                        socket.emit('Dislike1',{
                            name: e.target.title,
                            postStatus: e.target.id,
                            user: currentUser.username
                        });
                    }
                    else if($(e.target).parent().prev().children().hasClass('postImage')){
                        socket.emit('Dislike',{
                            name: e.target.title,
                            url: e.target.id,
                            user: currentUser.username
                        });
                    }
                }
                else{
                    $(e.target).removeClass('fa-heart-o').addClass('fa-heart');
                    $(e.target).parent().next().text(parseInt(c) + 1 + " Likes");
                    likesArray.push(currentUser.username);
                    if($(e.target).parent().prev().children().hasClass('textPost')){
                        socket.emit('Like1',{
                            name: e.target.title,
                            postStatus: e.target.id,
                            user: currentUser.username
                        });
                    }
                    else if($(e.target).parent().prev().children().hasClass('postImage')){
                        socket.emit('Like',{
                            name: e.target.title,
                            url: e.target.id,
                            user: currentUser.username
                        });
                    }
                }
            } else if (hasClass(e.target, 'postComment')) {
                alert('test');
            }

        }, false);
    });

    $( ".inputUserstatus" ).keyup(function() {
        var status,time,likes,date;
        status = $('.inputUserstatus').val();
        if(event.key === 'Enter' && status.length !==0){
            time = moment(moment().valueOf()).format('h:mm a');
            date = moment(moment().valueOf()).format('MM-DD-YYYY');
            likes = 0+" Likes";
            
            var template = document.getElementById("mainPostTemplate").innerHTML;
            var html = Mustache.render(template,{
               email: currentUser.email,
               user: currentUser.username,
               time: time,
               like: likes,
               postStatus: status,
               location: currentUser.location,
               dp: currentUser.url,
               likeIcon: 'fa-heart-o',
               date: date    
            });
            
            $("#allPosts").prepend(html);
            
            $( ".inputUserstatus" ).val("");
            
            socket.emit('postStatus',{
              id: currentUser._id,
              email:currentUser.email,
              username:currentUser.username,
              time: time,
              location: currentUser.location,
              postStatus: status,
              dp: currentUser.url,
              date: date     
             });
         }
    });
    
    var status;
    //Post Upload button click 
    fileUpload.addEventListener('change',function(e){
        status = $(".inputUserstatus").val(); 
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
           var time = moment(moment().valueOf()).format('h:mm a');
           var date = moment(moment().valueOf()).format('MM-DD-YYYY');
           var likes = 0+" Likes";
           //Mustache Templating    
           var template = document.getElementById("post-template").innerHTML;
           var html = Mustache.render(template,{
               email: currentUser.email,
               user: currentUser.username,
               url: res.data.secure_url,
               time: time,
               like: likes,
               date: date,
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
               id: currentUser._id,
               email:currentUser.email,
               username:currentUser.username,
               imageUrl:res.data.secure_url,
               time: time,
               status: status,
               location: currentUser.location,
               url: currentUser.url,
               date: date
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
             id: btoa(currentUser._id),
             email: currentUser.email
           },
           success : function(data){
              window.location.replace(data);   
           }
        });
        
    });
    
    var allUsers = {};
    var searchArray = {};
    socket.on('allUsers',function(users){
        allUsers = jQuery.extend({}, users);

        searchArray = jQuery.extend({}, users);
    });
    
    var input='';
    $( ".userSearch" ).keyup(function() {
        input = $(".userSearch").val();
        if(input.length === 0){
            //console.log(searchArray);
            searchArray = jQuery.extend({}, allUsers);
            $("#myUL").empty();
        }
        else{
            if(Object.keys(searchArray).length == 0){
                searchArray = jQuery.extend({}, allUsers);
            }
            for (var i = (Object.keys(searchArray).length)-1 ; i >= 0 ;i--){
                if (searchArray[i].username.toLowerCase().indexOf(input.toLowerCase()) > -1 && searchArray[i].username !== currentUser.username) {
                    if($('#myUL').find("."+allUsers[i].username).length == 0){
                        $("#myUL").append("<li class='myLi'><a class='myA "+searchArray[i].username+"' href='http://localhost:3000/userAcc.html?email="+searchArray[i].email+"&id="+btoa(searchArray[i]._id)+"&user=no'>"+searchArray[i].username+"</a></li>");
                    }
                    delete searchArray[i];
                }
                else {
                    $('.'+allUsers[i].username).remove();
                    delete searchArray[i];
                }
            }
        }
    });
}

if($("body").data("title") === "profilePage"){
    var params = $.deparam(window.location.search);
    
    //Fetches all user info as soon as page loads
    $(function(){
        socket.emit('profileuserInfo',{
            id: params.id
        });
    });
    
    //Fetching profile user info
    socket.on('profileUserInfo',function(user){
        // Autofilling Info already provided by user
        document.getElementById('username').value = user.username;
        document.getElementById('location').value = user.location; 
        if(user.work){
            document.getElementById('work').value = user.work;
        }
        if(user.fullname){
            document.getElementById('fullname').value = user.fullname;
        }
        if(user.url){
            document.getElementById('profilePic').src = user.url;
            document.getElementById('url').value = user.url;
        }
        if(user.bday){
            document.getElementById('bday').value = user.bday;
        }
        if(user.contact){
            document.getElementById('mobile').value = user.contact;
        }
        if(user.qualities){
            document.getElementById('qualities').value = user.qualities;
        }
        
//        $( "#currentPassword" ).keypress(function() {
//          console.log( "Handler for .keypress() called." );
//            
////            $("#currentPassword").keyup(function(){
//                socket.emit('passMatchProcess',{
//                    pass: $("#currentPassword").val(),
//                    hashedPass: user.password
//                });
//                console.log('emitted');
//
//                socket.on('noMatch',function(info){
//                   alert('Not Matched'); 
//                });
//
//                socket.on('Match',function(){
//                   alert('Matched'); 
//                });
//
////            });
//            
//        });

        // Init a timeout variable to be used below
        var timeout = null;

        // Listen for keystroke events
        $("#currentPassword").keyup(function(){
            console.log('KEYUP');
            // Clear the timeout if it has already been set.
            // This will prevent the previous task from executing
            // if it has been less than <MILLISECONDS>
            clearTimeout(timeout);

            // Make a new timeout set to go off in 800ms
            timeout = setTimeout(function () {
                $(".passMatch").css('display','inline');
                socket.emit('passMatchProcess',{
                    pass: $("#currentPassword").val(),
                    hashedPass: user.password
                });
                console.log('emitted');
                
            }, 500);
        });
        
        socket.on('noMatch',function(info){ 
           $(".passMatch").css('display','none');
           $(".wrongMatch").css('display','inline'); 
           $(".match").css('display','none');
           $("#newPassword").attr('readonly','readonly');
        });

        socket.on('Match',function(){
           $(".passMatch").css('display','none');
           $(".wrongMatch").css('display','none');
           $(".match").css('display','inline');
           $("#newPassword").removeAttr('readonly');
        });
        
        $("#newPassword").keyup(function(){
            if($("#newPassword").val().length == 0){
                $("#updateBtn").removeAttr('disabled');
            }
            if($("#newPassword").val().length > 5 ){
                $(".match1").css('display','inline');
                $("#confirmPass").removeAttr('readonly');
            }
            else{
                $(".match1").css('display','none');
                $("#confirmPass").attr('readonly','readonly');
//                $("#updateBtn").attr('disabled','disbaled');
            }
        });
        
        $("#confirmPass").keyup(function(){
            if($("#confirmPass").val() === $("#newPassword").val() ){
                if($("#confirmPass").val().length!=0){
                    $(".match2").css('display','inline');
                    $("#updateBtn").removeAttr('disabled'); 
                }
                else{
                    $(".match2").css('display','none'); 
                }
            }
            else{
                    $("#updateBtn").attr('disabled','disabled');
            }
        });
        
    });
    
    // Uploading User Display Pic to Cloud 
    var fileUpload = document.getElementById('fileUpload2');
    fileUpload.addEventListener('change',function(e){
        console.log("sdfsdfdsf");
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
            id: atob(params.id)
        });
        socket.emit('userPosts',{
            email: params.email
        });
    });
    
    var currentUser = {},url;
    
    //current user info received
    socket.on('UserInfo',function(user){
        
        currentUser = Object.assign({}, user);
        
        if(!currentUser.url){
            url = 'images/anony.jpg';
        }
        else{
            url = currentUser.url;
        }
        
        var template = document.getElementById("user-template").innerHTML;
        var html = Mustache.render(template,{
           user: currentUser.username,
           fullname: currentUser.fullname,    
           location: currentUser.location,
           dp: url,
           work: currentUser.work,
           email: currentUser.email,
           posts: currentUser.posts,
           bday: currentUser.bday,
           qualities: currentUser.qualities,
           contact: currentUser.contact,
           status: currentUser.mainStatus,
           backPic: currentUser.backgroundPic
        });
        document.getElementById("header").innerHTML += html;
        
        if(params.user == 'no'){
            $(".updateProfile").css('display','none');
            $(".statusEdit").css('display','none');
            $('#userStatus').bind('dblclick',function(e){
                e.preventDefault();
            });
        }
        else{
            $("#userStatus").dblclick(function(){
                $("#userStatus").css("display","none");
                $(".statusEdit").css("display","none");
                $("#inputStatus").css("display","block");
                $(".inputClose").css("display","block");
                $("#inputStatus").on('keyup', function (e) {
                    if (event.key === 'Enter') {
                        socket.emit('statusUpdate',{
                            id: currentUser._id,
                            status: $("#inputStatus").val() 
                        });
                    }
                });
            });
        }
        
    $("#BackgroundPic").click(function(){
   
        var fileUpload = document.getElementById('BackgroundfileUpload');
        fileUpload.addEventListener('change',function(e){
            var file = event.target.files[0];
            var formData = new FormData();
            formData.append('file',file);
            formData.append('upload_preset',CLOUDINARY_UPLOAD_PRESET);
            $("#backPicLoad").css('display','inline');

            //Linking with Cloud
            axios({
               url: CLOUDINARY_URL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: formData
            }).then(function(res){
               $(".backImage").attr('src' , res.data.secure_url); 
               $("#backPicLoad").css('display','none');
                
               socket.emit('backgroundPic' , {
                  backUrl : res.data.secure_url,
                  email : currentUser.email
               });
            });

        });
        
    });    
        

        
    $(".inputClose").click(function(){
        $("#userStatus").css("display","block");
        $(".statusEdit").css("display","block");
        $("#inputStatus").css("display","none");
        $(".inputClose").css("display","none");
    });  
    
    socket.on('statusUpdated',function(user){
        $("#userStatus").css("display","block");
        $(".statusEdit").css("display","block");
        $("#inputStatus").css("display","none");
        $(".inputClose").css("display","none");
        $("#userStatus").text(user.mainStatus);
    });    
        
        // Ajax request to redirect from main page to profile page along with user info
        $(".updateProfile").click(function(){
            $.ajax({
               url : '/profile',
               type : 'POST',
               data : {
                 id: currentUser._id,   
                 username: currentUser.username,    
                 location: currentUser.location,
                 email: currentUser.email,
                 fullname: currentUser.fullname,
                 work: currentUser.work,
                 url: currentUser.url   
               },
               success : function(data){
                  window.location.replace(data);   
               }
            });
        });        
        
    });
    
    socket.on('userImages',function(images){
            var k=0;
            for(var i=0;i<images.length;i++){
               if(!images[i].postStatus){
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
                   k=1;
               }
            }
            if(k==0){
                $("#Posts").append('<p id="noPosts">No Posts Yet!</p>');
            }
    });
    
    
    $("#LogOut").click(function(e){
        console.log("clicked");
        $.ajax({
            url:"/logOut",
            type: "GET",
            success: function(result) {
                window.location.replace(result); 
            }                
        });
    });
    
    $("#DeleteAcc").click(function(e){
       console.log('clicky');
       $.ajax({
          url: "/delete" ,
          type: "POST",
          data:{
             email: currentUser.email,
             id: currentUser._id
          },
          success: function(result){
              window.location.replace(result);
          }
       });
    });
    
//    $(".signOut").click(function(){
//        alert("clicked");
//       socket.emit('logOut',{
//           logout: true
//       }); 
//    });
 
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