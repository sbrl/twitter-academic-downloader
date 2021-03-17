"use strict";

import TwitterApiCredentials from './TwitterApiCredentials.mjs';

class AcademicTweetDownloader {
	constructor() {
		this.endpoint = `https://api.twitter.com`
		// TODO: Find a promise-based timer that we can control more precisely than setInterval & clearInterval.
		this.credentials = null;
	}
	
	make_url(path) {
		return `${this.endpoint}${path}`;
	}
	
	async setup(filename_credentials) {
		this.credentials = await TwitterApiCredentials.Load(filename_credentials);
	}
	
	
}

AcademicTweetDownloader.Create = (filename_credentials) => {
	let result = new AcademicTweetDownloader();
	await result.setup(filename_credentials);
	return result;
}

export default AcademicTweetDownloader;
