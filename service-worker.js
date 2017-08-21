/*
This file must live in the application root 
because the scope for service workers is defined
by the directory in which the file resides
*/

// First, we need to open the cache with caches.open() and provide a cache name. 
// Providing a cache name allows us to version files, or separate data from 
// the app shell so that we can easily update one but not affect the other.

// Once the cache is open, we can then call cache.addAll(), which takes a list of URLs,
// then fetches them from the server and adds the response to the cache. 
// Unfortunately, cache.addAll() is atomic, if any of the files fail, the entire cache step fails!

var cacheName = 'weatherPWA-step-6-4';
var dataCacheName = 'weatherData-v1';

//var filesToCache = [];
var filesToCache = [
  '/',
  '/pwa-test/',
  '/pwa-test/index.html',
  '/pwa-test/scripts/app.js',
  '/pwa-test/styles/inline.css',
  '/pwa-test/images/clear.png',
  '/pwa-test/images/cloudy-scattered-showers.png',
  '/pwa-test/images/cloudy.png',
  '/pwa-test/images/fog.png',
  '/pwa-test/images/ic_add_white_24px.svg',
  '/pwa-test/images/ic_refresh_white_24px.svg',
  '/pwa-test/images/partly-cloudy.png',
  '/pwa-test/images/rain.png',
  '/pwa-test/images/scattered-showers.png',
  '/pwa-test/images/sleet.png',
  '/pwa-test/images/snow.png',
  '/pwa-test/images/thunderstorm.png',
  '/pwa-test/images/wind.png'
];


self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});


// This code ensures that your service worker updates its cache whenever any of the app shell files change. 
// In order for this to work, you'd need to increment the cacheName variable at the top of your service worker file.
self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// The code intercepts the request and checks if the URL starts with the address of the weather API. 
// If it does we'll use fetch to make the request. Once the response is returned, our code opens the cache, 
// clones the response, stores it in the cache, and finally returns the response to the original requestor.
self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  /*e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );*/

  var dataUrl = 'https://query.yahooapis.com/v1/public/yql';
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }

});