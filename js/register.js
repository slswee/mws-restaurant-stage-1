if (navigator.serviceWorker) {
	navigator.serviceWorker
	.register("/js/sw.js")
	.then(reg => {
		console.log("Service Worker registration is successful." + reg.scope);
	})
	.catch(err => {
		console.log("Service Worker registration failed." + err);
	})
}