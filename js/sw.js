const cacheName = "mws-restaurant-stage-1-001";
const urlsToCache = [
			"../",
			"../index.html",
			"../css/stlyes.css",
			"../data/restaurants.json",
			"../js/",
			"../js/dbhelper.js",
			"../js/main.js",å
			"../js/restaurant_info.js",
			"../js/register.js",
			"../img/na.png"
			];
self.addEventListener("install", event => {
	event.waitUntil(
		caches.open(cacheName).then( 	cache => {
			console.log("yo yo yo! ");
			return cache
			.addAll(urlsToCache)
			.catch(err => {
			console.log("Caches install " + err);
			});
		})
	);
});


self.addEventListener("fetch", event => {
	//console.log('we are fetching');
	let cacheRequest = event.request;
	let cacheUrlObj = new URL(event.request.url);
	if (event.request.url.indexOf("restaurant.html") > -1) {
		const cacheURL = "restaurant.html";
		cacheRequest = new Request(cacheURL);
	}
	if (cacheUrlObj.hostname !== "localhost") {
		event.request.mode = "no-cors";
	}

	console.log(caches);

	event.respondWith(
		caches.match(cacheRequest).then(response => {
		return (
			response ||
			fetch(event.request)
			.then(fetchResponse => {
				return caches.open(cacheId).then (cache => {
					cache.put(event.request, fetchResponse.clone());
					return fetchResponse;
				});
			})
			.catch(err => {
				if (event.request.url.indexOf(".jpg") > -1) {
					return caches.match("/img/na.png");
				}
				return new Response("Not connected to Internet", {
					status: 404,
					statusText: "Not connected to Internet"
				});
			})
			);
	})
	);
});