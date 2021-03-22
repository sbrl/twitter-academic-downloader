"use strict";

import Bottleneck from 'bottleneck';

import AcademicTweetDownloader from './AcademicTweetDownloader.mjs';

class TweetDownloadManager {
	constructor(stream_output) {
		this.stream_output = stream_output;
		
		this.has_finished = false;
		
		this.query = null;
		this.start_time = null;
		this.end_time = null;
		this.next_token = null;
	}
	
	async setup(filename_credentials) {
		this.downloader = await AcademicTweetDownloader.Create(filename_credentials);
	}
	
	async *download(query, start_time, end_time = null) {
		this.query = query;
		this.start_time = start_time;
		this.end_time = end_time;
		
		let limiter = new Bottleneck({
			minTime: 1000, // 1 request per second
			maxConcurrent: 1,
			
			reservoir: 300,
			reservoirRefreshAmount: 300, // 300 requests
			reservoirRefreshInterval: 15 * 60 * 1000 // every 15 minutes
		});
		
		let download_single_wrapped = limiter.wrap(this.download_single.bind(this));
		
		while(!this.has_finished)
			yield await download_single_wrapped();
	}
	
	async download_single() {
		let params = {
			query: this.query,
			start_time: this.start_time
		};
		if(this.end_time !== null)
			params.end_time = this.end_time;
		if(this.next_token !== null)
			params.next_token = this.next_token;
		
		let result = await this.downloader.full_archive(params);
		console.log(result);
		process.exit(42);
	}
}

TweetDownloadManager.Create = async (filename_credentials, output) => {
	let result = new TweetDownloadManager(output);
	await result.setup(filename_credentials);
	return result;
}

export default TweetDownloadManager;
