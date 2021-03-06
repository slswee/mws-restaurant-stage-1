/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `http://localhost:1337/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    iKeyVal.get('allRestaurants').then(restaurants => {
      if (restaurants) {  
          callback(null, restaurants);
      } else {
     // iKeyVal.keys().then(keys => {
        return fetch(DBHelper.DATABASE_URL)
              .then(response => response.json())
              .then(restaurants => {
                iKeyVal.set('allRestaurants', restaurants);
                callback(null, restaurants);
              });
            
      }
    });
  }

  /**
   * Fetch all reviews for a restaurant and store in idb-keyval
   */

  static fetchRestaurantReviewsByRestaurantID(id, callback) {
    iKeyVal.get(`Reviews_${id}`).then(reviews => {
      if (reviews) {
          callback(null, reviews);
      } else {
        return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`)
          .then(response => response.json())
          .then(reviews => {
            iKeyVal.set(`Reviews_${id}`, reviews);
            callback(null, reviews);
          });
      }
    });
  }


  static createRestaurantReviewsByRestaurantID(reviewInfo, callback) {
    // if online
    if(navigator.onLine) {
      return fetch(`http://localhost:1337/reviews/`, {
        method: 'POST',
        body: JSON.stringify({
            "restaurant_id": reviewInfo.id,
            "name": reviewInfo.reviewerName,
            "rating": reviewInfo.rating,
            "comments": reviewInfo.comments
        })
      }).then(response => response.json())
        .then(review => {
            iKeyVal.get(`Reviews_${reviewInfo.id}`).then(currentReviewsInIDB => {
                  iKeyVal.set(`Reviews_${reviewInfo.id}`, [...currentReviewsInIDB, review]);
            });
            callback(null, review);
      });
    } else { // offline
      let msg = document.getElementById('pending-post');
      msg.style.display = '';
      iKeyVal.get('offline_reviews').then(offlineReview => {
      const reviewForm = JSON.stringify({
            "restaurant_id": reviewInfo.id,
            "name": reviewInfo.reviewerName,
            "rating": reviewInfo.rating,
            "comments": reviewInfo.comments
        });
      if(offlineReview) {
        iKeyVal.set('offline_reviews', [...offlineReview, reviewForm]);
      } else {
        iKeyVal.set('offline_reviews', [reviewForm]);
      }
    })
    }
  }

  /**
   * Handle offline reviews pending POST
   */
  static syncReview(callback) {
  // go through the reviews in offline iKeyval, POST each one, and then delete offline reviews
  return iKeyVal.get('offline_reviews').then(offlineReview => {
    if(offlineReview) {
      const [reviewToPost, ...reducedOfflineReview] = offlineReview;

      return fetch(`http://localhost:1337/reviews/`, {
          method: 'POST',
          body: reviewToPost
      }).then(response => response.json())
            .then(review => {
              return iKeyVal.get(`Reviews_${review.restaurant_id}`).then(currentReviewsInIDB => {
                if(callback) {
                  callback(null, review);
                }
                return iKeyVal.set(`Reviews_${review.restaurant_id}`, [...currentReviewsInIDB, review]);
              });
            }).then(() => {
              //delete the already posted offline reviews from iKeyVal
              return iKeyVal.set('offline_reviews', reducedOfflineReview);
            }).then(() => {
              return DBHelper.syncReview();
            })
            .catch(err => {
              console.error("syncReview failed.", err);
            });

    }
  })
} 

  /**
   * Handle offline favorite pending POST
   */
   static syncFav(callback) {
    let reducedOfflineFav;
      return iKeyVal.get('offline_favs').then(offlineFav => {
        if(offlineFav && offlineFav.length) {
          const [favToPost, ...reducedFav] = offlineFav;
          reducedOfflineFav = reducedFav;
          const helperKey = favToPost.currentFavState == "true" ? 'unfavoriteRestaurant' : 'favoriteRestaurant';
          return DBHelper[helperKey](favToPost.restaurant_id, () => {}).then( () => {
              if (callback) {
                callback();
              }
              // delete the already posted fav states from iKeyVal
              return iKeyVal.set('offline_favs', reducedOfflineFav);
            }).then( () => {
              return DBHelper.syncFav();
            });
        }
      }).catch( err => {
        console.error("syncFav failed: ", err);
      });
   }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    iKeyVal.get(+id).then(restaurant => {
      if (restaurant) {
        callback(null, restaurant);
      }
      else {
        return fetch(DBHelper.DATABASE_URL + `/${id}`)
              .then(response => response.json())
              .then(restaurant => {
                iKeyVal.set(+id, restaurant);
                callback(null, restaurant);
              });
      }
    });


    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     const restaurant = restaurants.find(r => r.id == id);
    //     if (restaurant) { // Got the restaurant
    //       callback(null, restaurant);
    //     } else { // Restaurant does not exist in the database
    //       callback('Restaurant does not exist', null);
    //     }
    //   }
    // });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {

      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return restaurant.photograph ? (`/img/${restaurant.photograph}-2.jpg`) : `/img/na.png`;
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  /**
  * Favorite a restaurant
  */
  static favoriteRestaurant(id, callback) {
    return fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=true`, {
        method: 'PUT'
    }).then(response => response.json())
      .then(restaurant => {
            callback(null, restaurant);
            return iKeyVal.set(id, restaurant);
      });
  }

  /**
  * Unfavorite a restaurant
  */
  static unfavoriteRestaurant(id, callback) {
    return fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=false`,{
        method: 'PUT'
    }).then(response => response.json())
      .then(restaurant => {
            callback(null, restaurant);
            return iKeyVal.set(id, restaurant);
      });
  }
}

