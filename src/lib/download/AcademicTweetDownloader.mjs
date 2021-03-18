"use strict";

import TwitterApiCredentials from './TwitterApiCredentials.mjs';

import download_json_twitter from './download_json_twitter.mjs';

class AcademicTweetDownloader {
	constructor() {
		// TODO: Find a promise-based timer that we can control more precisely than setInterval & clearInterval.
		this.credentials = null;
	}
	
	async setup(filename_credentials) {
		this.credentials = await TwitterApiCredentials.Load(filename_credentials);
	}
	
	
	full_archive(query) {
		return await download_json_twitter(
			this.credentials,
			`/2/tweets/search/all`
		);
	}
}

AcademicTweetDownloader.Create = (filename_credentials) => {
	let result = new AcademicTweetDownloader();
	await result.setup(filename_credentials);
	return result;
}

export default AcademicTweetDownloader;
