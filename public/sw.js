var staticCacheName = 'NodeFi-static-v3';

//While Service Worker is getting Installed
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll([
                '/',
                'mainPage.html',
                'userAcc.html',
                'profile.html',
                '/js/libs/jquery-3.1.1.min.js',
                '/js/libs/bootstrap.min.js',
                '/css/bootstrap.min.css',
                '/css/styles.css',
                '/css/animate.css',
                '/socket.io/socket.io.js',
                '/js/javascript.js',
                '/js/libs/mustache.js',
                '/js/libs/deparam.js',
                'https://unpkg.com/axios/dist/axios.min.js',
                'https://fonts.googleapis.com/css?family=PT+Serif|Roboto+Mono',
                '/js/libs/moment.js',
                '/images/anony.jpg',
                'images/compass.png',
                'images/edit.png',
                'images/edit2.png',
                'images/heart.png',
                'images/redheart.png',
                'images/insta.png',
                'images/user.png',
                'images/camera.png',
                '/images/match.png',
                '/images/wrong.png',
                '/images/loader2.gif',
                'images/close.png',
                'images/calendar.png',
                'images/bday.png',
                'images/briefcase.jpg',
                'images/phone.png',
                'images/user.png'
            ]).catch(function(err) {
                console.log("Cache Error " + err);
            });
        })
    );
});

//Activate Event Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('NodeFi-') &&
                        cacheName != staticCacheName;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

//Fetch Event Service Worker
self.addEventListener('fetch', function(event) {
    
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
//        console.log(requestUrl.pathname);
        if (requestUrl.pathname === '/mainPage.html') {
          console.log('Main Page...');
          event.respondWith(caches.match('/mainPage.html'));
          return;
        }
        else if (requestUrl.pathname === '/userAcc.html') {
          console.log('UserAcc Page...');
          event.respondWith(caches.match('/userAcc.html'));
          return;
        }
        else if (requestUrl.pathname === '/profile.html') {
          console.log('Profile Page...');
          event.respondWith(caches.match('/profile.html'));
          return;
        }
    }
    
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                console.log("CACHED " + response.url);
                return response;
            }
            console.log("FETCHED " + event.request.url);
            return fetch(event.request);
        })
    );
});

//self.addEventListener('fetch', function(event) {
//  var requestUrl = new URL(event.request.url);
//
//  if (requestUrl.origin === location.origin) {
//      console.log("YEA");
//    if (requestUrl.pathname === '/mainPage.html') {
//      console.log('Response For MainPage Complete');
//      event.respondWith(caches.match('mainPage.html'));
//      return;
//    }
//  }
//
//  caches.match(event.request).then(function(response) {
//    if (response) {
//      console.log("CACHED " + response.url);
//      return response;
//    }
//    console.log("FETCHED " + event.request.url);
//    return fetch(event.request);
//  })
//});

//Message Received To activate New Installed Waiting Service Worker..
self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting(); //Skipped the waiting of New Service Worker.
    }
});