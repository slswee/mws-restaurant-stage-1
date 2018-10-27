const cacheName = "mws-restaurant-stage-1-002";
const urlsToCache = [
			"./",
			"./index.html",
			'./restaurant.html',
			"./css/styles.css",
			"./js/",
			"./js/dbhelper.js",
			"./js/main.js",
			"./js/restaurant_info.js",
			"./js/register.js",
			"./img/na.png"
			];
self.addEventListener("install", event => {
	event.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache
			.addAll(urlsToCache)
			.catch(err => {
			console.log("Caches install " + err);
			});
		})
	);
});


self.addEventListener("fetch", event => {
	let cacheRequest = event.request;
	let cacheUrlObj = new URL(event.request.url);
	if (event.request.url.indexOf("restaurant.html") > -1) {
		const cacheURL = "restaurant.html";
		cacheRequest = new Request(cacheURL);
	}
	if (cacheUrlObj.hostname !== "localhost") {
		event.request.mode = "no-cors";
	}

	event.respondWith(
		caches.match(cacheRequest).then(response => {
			if (response) return response;
			return fetch(event.request)
			.then(fetchResponse => {
				return caches.open(cacheName).then (cache => {
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
	})
	);
});

self.addEventListener('sync', function(event) {
  console.log("sw event: ", event);
  if (event.tag == 'myFirstSync') {
    event.waitUntil(syncReview());
  }
});

self.syncReview = () => {
	// go through the reviews in offline iKeyval, POST each one, and then delete offline reviews
	return iKeyVal.get('offline_reviews').then(offlineReview => {
		if(offlineReview) {

			return fetch(`http://localhost:1337/reviews/`, {
	        method: 'POST',
	        body: offlineReview[0]
			}).then(response => response.json())
	          .then(review => {
	          	console.log('fetch success');
	            iKeyVal.get(`Reviews_${reviewInfo.id}`).then(currentReviewsInIDB => {
	          			console.log('get review success', currentReviewsInIDB);

	                  iKeyVal.set(`Reviews_${reviewInfo.id}`, [...currentReviewsInIDB, review]);
	            	});
	            let [discard, ...reducedOfflineReview] = offlineReview;
	            //delete the already posted offline reviews from iKeyval
	            return iKeyval.set('offline_reviews', reducedOfflineReview).then(() => {
	            		console.log('update offline review success')
		            	return self.syncReview();
		            });
	      		})
	          .catch(err => {
	          	console.log("syncReview failed.");
	          });

		}
	})
	console.log("hello background sync");
} 