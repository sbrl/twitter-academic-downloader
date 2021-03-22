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
	
	
	async full_archive(params) {
		return await download_json_twitter(
			this.credentials,
			`/2/tweets/search/all`,
			params
		);
	}
}

AcademicTweetDownloader.Create = async (filename_credentials) => {
	let result = new AcademicTweetDownloader();
	await result.setup(filename_credentials);
	return result;
}

export default AcademicTweetDownloader;
