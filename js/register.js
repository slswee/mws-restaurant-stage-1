if (navigator.serviceWorker) {
	navigator.serviceWorker
	.register("/sw.js")
	.then(reg => {
		console.log("Service Worker registration is successful." + reg.scope);
	})
	.catch(err => {
		console.log("Service Worker registration failed." + err);
	})


	// background sync, request a one-off sync
	navigator.serviceWorker.ready.then(swRegistration => {
	  return swRegistration.sync.register('myFirstSync').then(() => {
	  	console.log("Background registration successful");
	  }).catch(() => {
	  	console.log("Background registration failed");
	  });
	});
}


