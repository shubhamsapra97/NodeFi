var socket = io();

socket.on('connect',function(){
   console.log('Connected to server');
});

socket.on('disconnect',function(){
   console.log('Disconnected from server');
});

// SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        if (!navigator.serviceWorker.controller) {
          return;
        }

        if (reg.waiting) {
          updateReady(reg.waiting);
          return;
        }

        if (reg.installing) {
          trackInstalling(reg.installing);
          return;
        }

        reg.addEventListener('updatefound', function() {
          trackInstalling(reg.installing);
        });
      });
        
        //Ensures refreshing is done only once..
        var refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    });
}

// Tracking State Change in Service Worker
function trackInstalling(worker){
    worker.addEventListener('statechange', function() {
        if (worker.state == 'installed') {
            updateReady(worker);
        }
    });
}

// Updating Service Worker.
function updateReady(worker){
    worker.postMessage({action: 'skipWaiting'});
}

//SignIn Page Js
if($("body").data("title") === "signInPage"){
    
    $("#loginEdit").click(function(){
       if ($('.loginOption').hasClass('pencil')){
           $(".loginOption").attr('src','images/edit2.png').removeClass('pencil').addClass('cross');
           $('.signInContent').addClass('fadeOut');
           setTimeout(function(){ 
               $(".signUpContent").css('display','block').removeClass('fadeOut').addClass('fadeInUp'); 
           }, 500);    
       }
       else{
           $(".loginOption").attr('src','images/edit.png').removeClass('cross').addClass('pencil');    
           $('.signUpContent').removeClass('fadeInUp').css('display','none');   
           $(".signInContent").removeClass('fadeOut').addClass('fadeInUp'); 
        }
    });  
    
    //if website open in 2 diff tabs with use logged in alredy
    socket.on('alreadyUser',function(info){
        window.location.href = 'mainPage.html?email=' + info.email;
    });

}

//mainPage Js
var CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/https-blog-5946b-firebaseapp-com/upload';
var CLOUDINARY_UPLOAD_PRESET = 'umw6g5ma';

if($("body").data("title") === "mainPage"){
    
    var params = $.deparam(window.location.search);
    
    var container = $('#Container');
    
    //Redirecting To login page if Unauth Users.
    socket.on('unauthorized',function(eve){
        alert("Unauth User");
        window.location.href = 'index.html';
    });
    
    //Stoppping Back Button Functionality
    history.pushState(null, document.title, location.href);
    window.addEventListener('popstate', function (event)
    {
      history.pushState(null, document.title, location.href);
    });
    
    var fileUpload = document.getElementById('fileUpload');
    var count=0;
    //Fetches user info and all posts as soon as page loads
    $(function(){
        socket.emit('userInfo',{
            email: params.email
        });
        
        socket.emit('pageLoad',{
            county: count
        });
        
     });
    
    var like,index,likeIcon,div,html,template;
    var currentUser = {};
    var likesArray = new Array();
    
    //Use of document fragments to prevent page reflow..
    var fragment = document.createDocumentFragment();
    
    socket.on('allImages',function(images){
        $("#loader1").remove();
        $("#userView").remove();
        var postStatus = document.getElementsByClassName('.postStatus');
        if(!images.empty){
            
            for(var i=0;i<images.docs.length;i++){
               likesArray = images.docs[i].userLiked;
               if(likesArray.indexOf(currentUser.username)>-1){
                   likeIcon = 'images/redheart.png';
               }
                else{
                    likeIcon = 'images/heart.png';
                }

               if(images.docs[i].postStatus){
                   //appending text Posts
                   template = document.getElementById("mainPostTemplate").innerHTML;
                   html = Mustache.render(template,{
                       email: images.docs[i].email,
                       user: images.docs[i].username,
                       time: images.docs[i].time,
                       like: images.docs[i].like,
                       postStatus: images.docs[i].postStatus,
                       location: images.docs[i].location,
                       dp: images.docs[i].userDp,
                       likeIcon: likeIcon,
                       date: images.docs[i].date
                   });
                   
                   div = document.createElement('div');
                   div.setAttribute('class','posty');
                   div.innerHTML = html;
                   fragment.appendChild(div);

               }  
               else{            
                   //appending image Posts
                   template = document.getElementById("post-template").innerHTML;
                   html = Mustache.render(template,{
                       email: images.docs[i].email,
                       user: images.docs[i].username,
                       url: images.docs[i].url,
                       time: images.docs[i].time,
                       like: images.docs[i].like,
                       status: images.docs[i].status,
                       location: images.docs[i].location,
                       dp: images.docs[i].userDp,
                       likeIcon: likeIcon,
                       date: images.docs[i].date
                   });
                   
                   div = document.createElement('div');
                   div.setAttribute('class','posty');
                   div.innerHTML = html;
                   fragment.appendChild(div);

               }
            }
    
            container.append(fragment);
            
            if(images.docs.length > 6){
                container.append("<img id='loader' class='load' src='images/loader2.gif' alt='loader'>");
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
                        county: count
                    });
                   
               }
            
        }
    });
    
    socket.on('newPost',function(images){
        var postStatus = document.getElementsByClassName('.postStatus');
        
               if(images.postStatus){
                   template = document.getElementById("mainPostTemplate").innerHTML;
                   html = Mustache.render(template,{
                       email: images.email,
                       user: images.username,
                       time: images.time,
                       like: 0,
                       postStatus: images.postStatus,
                       location: images.location,
                       dp: images.userDp,
                       likeIcon: "images/heart.png",
                       date: images.date
                   });
               }  
               else{            
                   template = document.getElementById("post-template").innerHTML;
                   html = Mustache.render(template,{
                       email: images.email,
                       user: images.username,
                       url: images.url,
                       time: images.time,
                       like: 0,
                       status: images.status,
                       location: images.location,
                       dp: images.userDp,
                       likeIcon: "images/heart.png",
                       date: images.date
                   });

               }
        div = document.createElement('div');
        div.setAttribute('class','posty');
        div.innerHTML = html;
        fragment.appendChild(div);
        container.prepend(fragment);
    });
    
    //current user info received
    socket.on('UserInfo',function(user){
        currentUser = Object.assign({}, user);
        
        //Like and Dislike Button Functionality
        var c;
        function hasClass(elem, className) {
            return elem.className.split(' ').indexOf(className) > -1;
        }
        var target;
        document.addEventListener('click', function (e) {
            if (hasClass(e.target, 'postLike')) {
                target = $(e.target);
                c = target.parent().next().text();
                if(target.attr('src') == 'images/redheart.png') {  
                    target.attr('src','images/heart.png');
                    target.parent().next().text(parseInt(c) - 1 + ' like');
                    var index = likesArray.indexOf(currentUser.username);
                    likesArray.splice(index, 1);
                    if(target.parent().prev().children().hasClass('textPost')){
                        socket.emit('Dislike1',{
                            name: e.target.title,
                            postStatus: e.target.id,
                            user: currentUser.username
                        });
                    }
                    else if(target.parent().prev().children().hasClass('postImage')){
                        socket.emit('Dislike',{
                            name: e.target.title,
                            url: e.target.id,
                            user: currentUser.username
                        });
                    }
                }
                else{
                    target.attr('src','images/redheart.png');
                    target.parent().next().text(parseInt(c) + 1 + ' like');
                    likesArray.push(currentUser.username);
                    if(target.parent().prev().children().hasClass('textPost')){
                        socket.emit('Like1',{
                            name: e.target.title,
                            postStatus: e.target.id,
                            user: currentUser.username
                        });
                    }
                    else if(target.parent().prev().children().hasClass('postImage')){
                        socket.emit('Like',{
                            name: e.target.title,
                            url: e.target.id,
                            user: currentUser.username
                        });
                    }
                }
            }
        }, false);
    });

    $( ".inputUserstatus" ).keyup(function() {
        var status,time,likes,date;
        status = $('.inputUserstatus').val();
        if(event.key === 'Enter' && status.length !==0){
            $("camera").css('display','none');
            $("#backPicLoad").css('display','inline');
            time = moment(moment().valueOf()).format('H:mm');
            date = moment(moment().valueOf()).format('MM-DD-YYYY');
            
            template = document.getElementById("mainPostTemplate").innerHTML;
            html = Mustache.render(template,{
               email: currentUser.email,
               user: currentUser.username,
               time: time,
               like: 0,
               postStatus: status,
               location: currentUser.location,
               dp: currentUser.url,
               likeIcon: 'images/heart.png',
               date: date    
            });
            $("#backPicLoad").css('display','none');
            $("camera").css('display','inline');
            div = document.createElement('div');
            div.setAttribute('class','posty');
            div.innerHTML = html;
            fragment.appendChild(div);
            container.prepend(fragment);
            
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
        $(".camera").css('display','none');
        $("#backPicLoad").css('display','inline');
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
           var url = res.data.secure_url.slice(0, 72) + '/q_50/' + res.data.secure_url.slice(73,res.data.secure_url.length); 
           //moment to fetch the time-date     
           var time = moment(moment().valueOf()).format('H:mm');
           var date = moment(moment().valueOf()).format('MM-DD-YYYY');
//           //Mustache Templating    
           var template = document.getElementById("post-template").innerHTML;
           var html = Mustache.render(template,{
               email: currentUser.email,
               user: currentUser.username,
               url: url,
               time: time,
               like: 0,
               date: date,
               status: status,
               location: currentUser.location,
               dp: currentUser.url,
               likeIcon: 'images/heart.png'
           });
           $("#backPicLoad").css('display','none');
           $(".camera").css('display','inline');
           div = document.createElement('div');
           div.setAttribute('class','posty');
           div.innerHTML = html;
           fragment.appendChild(div);
           container.prepend(fragment);
           
           // Sending data to server on image upload   
           socket.emit('onPost',{
               id: currentUser._id,
               email:currentUser.email,
               username:currentUser.username,
               imageUrl:url,
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
           beforeSend: function(request) {
             request.setRequestHeader("x-auth", currentUser.tokens[0].token);
           },
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
            searchArray = jQuery.extend({}, allUsers);
            $("#myUL").empty();
        }
        else{
            if(Object.keys(searchArray).length == 0){
                searchArray = jQuery.extend({}, allUsers);
            }
            //Search Algo
            for (var i = (Object.keys(searchArray).length)-1 ; i >= 0 ;i--){
                if (searchArray[i].username.toLowerCase().indexOf(input.toLowerCase()) > -1 && searchArray[i].username !== currentUser.username) {
                    if($('#myUL').find("."+allUsers[i].username).length == 0){
                       div = document.createElement('div');
                       div.setAttribute('id','myUL');
                       div.innerHTML = "<li class='myLi'><a class='myA "+searchArray[i].username+"' href='http://localhost:3000/userAcc.html?email="+searchArray[i].email+"&user=no'>"+searchArray[i].username+"</a></li>";
                       fragment.appendChild(div);
                    }
                    delete searchArray[i];
                }
                else {
                    $('.'+allUsers[i].username).remove();
                    delete searchArray[i];
                }
            }
            $(".ulAppend").append(fragment);
        }
    });
}

if($("body").data("title") === "profilePage"){
    
    //Fetches all user info as soon as page loads
    $(function(){
        socket.emit('profileuserInfo',{});
    });
    
    function validateForm(){
        if (isNaN(document.getElementById('mobile'))) {
            return true;
        } else {
            return false;
        }
    }
    
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

        // Init a timeout variable to be used below
        var timeout = null;

        // Listen for keystroke events
        $("#currentPassword").keyup(function(){
            // Clear the timeout if it has already been set.
            // This will prevent the previous task from executing
            // if it has been less than <MILLISECONDS>
            clearTimeout(timeout);

            // Make a new timeout set to go off in 800ms
            timeout = setTimeout(function () {
                if($("#currentPassword").val().length == 0){
                    $(".wrongMatch").css('display','none');
                    $(".match").css('display','none');
                    $("#newPassword").attr('readonly','readonly');
                }
                else{
                    $(".passMatch").css('display','inline');
                    socket.emit('passMatchProcess',{
                        pass: $("#currentPassword").val(),
                        hashedPass: user.password
                    });    
                }
                
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
            else{
                if($("#newPassword").val().length > 5 ){
                    $(".match1").css('display','inline');
                    $("#confirmPass").removeAttr('readonly');
                }
                else{
                    $(".match1").css('display','none');
                    $("#confirmPass").attr('readonly','readonly');
    //                $("#updateBtn").attr('disabled','disbaled');
                }
            }
            if($("#confirmPass").val().length !== 0){
                $("#confirmPass").val("");
                $("#updateBtn").attr('disabled','disbaled');
                $('.match2').css('display','none');
            }
        });
        
        $("#confirmPass").keyup(function(){
            if($("#newPassword").val().length == 0){
                $(".match2").css('display','none');
                $("#updateBtn").removeAttr('disabled');
            }
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
                    $(".match2").css('display','none');
            }
        });
        
    });
    
    // Uploading User Display Pic to Cloud 
    var fileUpload = document.getElementById('fileUpload2');
    fileUpload.addEventListener('change',function(e){
        $("#submitText").css('display','none');
        $("#backPicLoad").css('display','inline');
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
           var url = res.data.secure_url.slice(0, 72) + '/w_200,h_200,q_30/' + res.data.secure_url.slice(73,res.data.secure_url.length); 
           $("#backPicLoad").css('display','none');    
           $("#submitText").css('display','inline');
           document.getElementById("profilePic").src = url;
           document.getElementById("url").value = url;    
        });
        
    });
      
}

if($("body").data("title") === "userAcc"){
    var county = 0,template,html;
    var params = $.deparam(window.location.search);
    $(function(){
        socket.emit('userInfo',{
            email: params.email
        });
        socket.emit('userPosts',{
            email: params.email,
            county: county
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
        
        template = document.getElementById("user-template").innerHTML;
        html = Mustache.render(template,{
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
            $(".dropdown").css('display','none');
        }
        else{
            $("#userStatus").dblclick(function(){
                $("#userStatus").css("display","none");
                $(".statusEdit").css("display","none");
                $("#inputStatus").css("display","block");
                $(".inputClose").css("display","block");
                $(".dropdown").css('display','block');
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
               var url = res.data.secure_url.slice(0, 72) + '/q_70/' + res.data.secure_url.slice(73,res.data.secure_url.length); 
               $(".backImage").attr('src' , url); 
               $("#backPicLoad").css('display','none');
                
               socket.emit('backgroundPic' , {
                  backUrl : url,
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
               beforeSend: function(request) {
                 request.setRequestHeader("x-auth", currentUser.tokens[0].token);
               },
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
    
    var k=0;
    socket.on('userImages',function(images){
            if(!images.empty){
                $("#morePostsLoad").css('display','none');
                var fragment = document.createDocumentFragment();
                for(var i=0;i<images.docs.length;i++){
                       template = document.getElementById("post-template").innerHTML;
                       html = Mustache.render(template,{
                           user: images.docs[i].username,
                           url: images.docs[i].url,
                           time: images.docs[i].time,
                           like: images.docs[i].like,
                           status: images.docs[i].status,
                           location: images.docs[i].location,
                           dp: images.docs[i].userDp
                       });
                       div = document.createElement('div');
                       div.setAttribute('id','postify');
                       div.innerHTML = html;
                       fragment.appendChild(div);
                       k=1;
                }
                $("#Posts").append(fragment);
                if((images.skip+6)<currentUser.posts && currentUser.posts>6){
                    $("#morePostDiv").append("<div class='morePosts'>More Posts</div>");
                }
                
                
                $(".morePosts").click(function(){
                    $(".morePosts").remove();
                    $("#morePostsLoad").css('display','inline');
                    county++;
                    socket.emit('userPosts',{
                        email: params.email,
                        county: county
                    });
                });
                
            }
            else{
                
                if(k==0){
                    $("#postify").append('<p id="noPosts">No Posts Yet!</p>');
                }
                
                $("#morePostsLoad").css('display','none');
                
            }
    });    
    
    $("#LogOut").click(function(e){
        $("#backPicLoad").css('display','inline');
        $.ajax({
            url:"/logOut",
            type: "GET",
            beforeSend: function(request) {
              request.setRequestHeader("x-auth", currentUser.tokens[0].token);
            },
            success: function(result) {
                $("#backPicLoad").css('display','none');
                window.location.replace(result); 
            }                
        });
    });
    
    $("#DeleteAcc").click(function(e){
       $("#backPicLoad").css('display','inline');
       $.ajax({
          url: "/delete" ,
          type: "POST",
          beforeSend: function(request) {
           request.setRequestHeader("x-auth", currentUser.tokens[0].token);
          },
          data:{
             email: currentUser.email,
             id: currentUser._id
          },
          success: function(result){
              $("#backPicLoad").css('display','none');
              window.location.replace(result);
          }
       });
    });
}