"use strict";

import Bottleneck from 'bottleneck';

import l from '../io/Log.mjs';
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
		
		let limiter = new Bottleneck({
			minTime: 1000, // 1 request per second
			maxConcurrent: 1,
			
			reservoir: 300,
			reservoirRefreshAmount: 300, // 300 requests
			reservoirRefreshInterval: 15 * 60 * 1000 // every 15 minutes
		});
		
		this.download_single_wrapped = limiter.wrap(this.download_single.bind(this));
		
	}
	
	async *download_archive(query, start_time, end_time = null) {
		this.query = query;
		this.start_time = start_time;
		this.end_time = end_time;
		
		let next_token = null;
		while(next_token !== null) {
			let response = yield await this.download_single_wrapped(next_token);
			if(typeof response.meta.next_token !== "string")
				next_token = null;
			else
				next_token = response.meta.next_token;
			
			console.log(JSON.stringify(result));
			process.exit(42);
		}
	}
	
	/**
	 * Downloads a single response from the Twitter API and returns the result.
	 * @param	{string?}	[query=null]		The query string to search for.
	 * @param	{string?}	[next_token=null]	Optional. The next_token to pass to the twitter API to fetch the next page of results.
	 * @return	{Promise<object>}	The downloaded response as an object.
	 */
	async download_single(query = null, next_token = null) {
		let params = {
			query: query || this.query,
			start_time: this.start_time.toISOString(),
			max_results: 50,
			"tweet.fields": [
				"author_id",
				"geo",
				"created_at",
				"context_annotations",
				"lang",
				"entities",
				"source",
				"conversation_id",
				"referenced_tweets",
				"public_metrics"
			].join(","),
			expansions: [
				"author_id",
				"geo.place_id"
			].join(","),
			"user.fields": [
				"username",
				"location",
				"public_metrics"
			].join(","),
			"place.fields": [
				"contained_within",
				"country",
				"full_name",
				"geo",
				"id",
				"place_type",
			].join(",")
		};
		l.log(`[TweetDownloadManager:download_single] params`, params);
		if(this.end_time !== null)
			params.end_time = this.end_time;
		if(this.next_token !== null)
			params.next_token = this.next_token;
		
		yield await this.downloader.full_archive(params);
	}
}

TweetDownloadManager.Create = async (filename_credentials, output) => {
	let result = new TweetDownloadManager(output);
	await result.setup(filename_credentials);
	return result;
}

export default TweetDownloadManager;
