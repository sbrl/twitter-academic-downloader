"use strict";


import download_json_twitter from './download_json_twitter.mjs';

class AcademicTweetDownloader {
	constructor(credentials) {
		this.credentials = credentials;
	}
	
	async full_archive(params) {
		return await download_json_twitter(
			this.credentials,
			`/2/tweets/search/all`,
			params
		);
	}
}

export default AcademicTweetDownloader;
