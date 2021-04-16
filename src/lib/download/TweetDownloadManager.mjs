"use strict";

import Bottleneck from 'bottleneck';
import pretty_ms from 'pretty-ms';

import l from '../io/Log.mjs';
import sleep_async from '../async/sleep_async.mjs';
import TwitterApiCredentials from './TwitterApiCredentials.mjs';
import AcademicTweetDownloader from './AcademicTweetDownloader.mjs';
import TwitterResponseProcessor from './TwitterResponseProcessor.mjs';

class TweetDownloadManager {
	constructor(dir_output) {
		this.dir_output = dir_output;
		
		this.has_finished = false;
		
		this.query = null;
		this.start_time = null;
		this.end_time = null;
		this.next_token = null;
		
		this.sym_retry = Symbol.for("SYM_RETRY");
		this.sym_give_up = Symbol.for("SYM_GIVE_UP");
	}
	
	async setup(filename_credentials) {
		this.credentials = await TwitterApiCredentials.Load(filename_credentials);
		this.downloader = new AcademicTweetDownloader(this.credentials);
		this.processor = new TwitterResponseProcessor(
			this.dir_output,
			this.credentials.anonymise_salt
		);
		
		let limiter = new Bottleneck({
			minTime: 2000, // 1 request per second (but twitter doesn't like that very much)
			maxConcurrent: 1,
			
			reservoir: 300,
			reservoirRefreshAmount: 300, // 300 requests
			reservoirRefreshInterval: 15 * 60 * 1000 // every 15 minutes
		});
		
		this.download_single_wrapped = limiter.wrap(this.download_single.bind(this));
		
	}
	
	async download_archive(query, start_time, end_time = null) {
		this.start_time = start_time;
		this.end_time = end_time;
		
		query += " -is:retweet"; // Exclude retweets, ref https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query#boolean
		
		let next_token = null,
			totals = { responses: 0, tweets: 0, users: 0, places: 0 };
		do {
			let time_api = new Date();
			let response = await this.download_single_wrapped(query, next_token);
			time_api = new Date() - time_api;
			// Guarantee at least 1s between requests
			await sleep_async(1 * 1000);
			
			if(response == this.sym_retry) continue;
			if(response == this.sym_give_up) {
				process.exit(3);
			}
			
			next_token = response.meta.next_token || null;
			
			// Metrics
			totals.responses++;
			totals.tweets += response.data.length;
			if(response.includes.users instanceof Array)
				totals.users += response.includes.users.length;
			if(response.includes.places instanceof Array)
				totals.places += response.includes.places.length;
			
			
			let time_process = new Date();
			await this.processor.process(response);
			time_process = new Date() - time_process;
			
			// Update CLI
			process.stdout.write(`[ ${(new Date()).toISOString()} ] ${totals.responses} API calls made; totals: ${totals.tweets} tweets, ${totals.users} users (non-unique), ${totals.places} places (non-unique); timings ${pretty_ms(time_api)} API, ${pretty_ms(time_process)} process \r`);
		} while(next_token !== null);
		
		console.log();
		l.log(`Complete, statistics:
API requests:			${totals.responses}
Tweets:					${totals.tweets}
Users (non-unique):		${totals.users}
Places (non-unique):	${totals.places}

Please run the 'post-process.sh' script written to the output directory:

	${dir_output}/post-process.sh ${dir_output}

Thank you :-)
`);
		
	}
	
	/**
	 * Downloads a single response from the Twitter API and returns the result.
	 * @param	{string?}	[query=null]		The query string to search for.
	 * @param	{string?}	[next_token=null]	Optional. The next_token to pass to the twitter API to fetch the next page of results.
	 * @return	{Promise<object>}	The downloaded response as an object.
	 */
	async download_single(query = null, next_token = null) {
		let params = {
			query: query,
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
		// l.log(`[TweetDownloadManager:download_single] params`, params);
		if(this.end_time !== null)
			params.end_time = this.end_time;
		if(next_token !== null)
			params.next_token = next_token;
		
		let response = await this.downloader.full_archive(params);
		
		if(response == null) {
			l.log(`Response was null, giving up`)
			return this.sym_give_up;
		}
		
		if(response.statusCode < 200 || response.statusCode >= 300) {
			l.error("Encountered error when making Twitter API request");
			l.error("Response body: ", response.body);
			if(response.statusCode == 429) {
				l.error("Too many requests response detected, waiting 1 minute");
				await sleep_async(60 * 1000);
				return this.sym_retry;
			}
		}
		return response.body;
	}
}

TweetDownloadManager.Create = async (filename_credentials, output) => {
	let result = new TweetDownloadManager(output);
	await result.setup(filename_credentials);
	return result;
}

export default TweetDownloadManager;
