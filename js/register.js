if (navigator.serviceWorker) {
	navigator.serviceWorker
	.register("/sw.js")
	.then(reg => {
		console.log("Service Worker registration is successful." + reg.scope);
	})
	.catch(err => {
		console.log("Service Worker registration failed." + err);
	})
}