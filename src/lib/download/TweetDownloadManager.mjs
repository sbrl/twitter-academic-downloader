"use strict";

import Bottleneck from 'bottleneck';
import pretty_ms from 'pretty-ms';

import l from '../io/Log.mjs';
import sleep_async from '../async/sleep_async.mjs';
import TwitterApiCredentials from './TwitterApiCredentials.mjs';
import AcademicTweetDownloader from './AcademicTweetDownloader.mjs';
import TwitterResponseProcessor from './TwitterResponseProcessor.mjs';

/**
 * Manages the download of tweets from Twitter using Twitter's Academic API.
 * @param	{string}	dir_output			The output directory to write the results to.
 * @param	{boolean}	download_replies	Whether to also download replies to tweets. This is done by downloading all the tweets in the conversation id of a tweet if it has at least 1 reply.
 */
class TweetDownloadManager {
	constructor(dir_output, download_replies = true) {
		this.dir_output = dir_output;
		this.download_replies = download_replies;
		
		this.has_finished = false;
		
		this.query = null;
		this.start_time = null;
		this.end_time = null;
		this.next_token = null;
		
		/**
		 * The conversation ids we've seen so far.
		 * This is a Map because we need to know whether a conversation id has been downloaded yet, rather than iterating through them.
		 * @type {Map}
		 */
		this.seen_conversation_ids = new Map();
		
		this.sym_retry = Symbol.for("SYM_RETRY");
		this.sym_give_up = Symbol.for("SYM_GIVE_UP");
		
		// The cumulative statistics
		this.totals = {
			responses: 0,		// The number of API responses processed
			tweets: 0,			// The number of tweets downloaded
			replies: 0,			// The number of conversations downloaded
			users: 0,			// The number of users downloaded
			places: 0			// The number of places downloaded
		};
	}
	
	/**
	 * Initialises this TweetDownloadManager.
	 * @param  {string}  filename_credentials The name of the file that contains the Twitter API credentials to use when making API requests.
	 * @return {Promise}                      A promise that resolves when the setup process is complete.
	 */
	async setup(filename_credentials) {
		this.credentials = await TwitterApiCredentials.Load(filename_credentials);
		this.downloader = new AcademicTweetDownloader(this.credentials);
		this.processor = new TwitterResponseProcessor(
			this.dir_output,
			this.credentials.anonymise_salt
		);
		this.processor.on("tweet_with_reply", this.download_conversation.bind(this));
		
		let limiter = new Bottleneck({
			minTime: 2000, // 1 request per second (but twitter doesn't like that very much)
			maxConcurrent: 1,
			
			reservoir: 300,
			reservoirRefreshAmount: 300, // 300 requests
			reservoirRefreshInterval: 15 * 60 * 1000 // every 15 minutes
		});
		
		this.download_single_wrapped = limiter.wrap(this.download_single.bind(this));
		
	}
	
	/**
	 * Downloads all the tweets associated with a given query.
	 * The Twitter Academic API is used to do a full-archive search.
	 * @param	{string}	query			The query string to search for. ` -is:retweet` is automatically appended to exclude retweets.
	 * @param	{Date}		start_time		The start time to start looking for tweets at.
	 * @param	{Date}		[end_time=null]	The end time to start looking for tweets at (default: the current time)
	 * @return	{Promise}	A promise that resolves when the downloading process is complete.
	 */
	async download_archive(query, start_time, end_time = null) {
		this.start_time = start_time;
		this.end_time = end_time;
		
		let time_taken = new Date();
		
		await this.do_download_archive(query);
		
		time_taken = new Date() - time_taken;
		
		console.log();
		l.log(`Complete, statistics:
Time taken:				${pretty_ms(time_taken)}
API requests:			${this.totals.responses}
Tweets:					${this.totals.tweets}
Replies:				${this.totals.replies}
Users (non-unique):		${this.totals.users}
Places (non-unique):	${this.totals.places}

Please run the 'post-process.sh' script written to the output directory:

	${this.dir_output}/post-process.sh ${this.dir_output}

Thank you :-)
`);
	}
	
	/**
	 * Downloads all the tweets associated with the given conversation id.
	 * Does not download tweets from a conversation id more than once.
	 * Tweets are written to the main output directory alongside all the other
	 * tweets.
	 * @param	{string}	conversation_id	The conversation id to download from.
	 * @param	{number}	depth			The reply depth at which the conversation was found.
	 * @return	{Promise}	A promise that resolves when the downloading is complete.
	 */
	async download_conversation(conversation_id) {
		// console.log();
		if(this.seen_conversation_ids.has(conversation_id)) {
			// l.info(`Skipping conversation id because we've seen it before`);
			return;
		}
		// l.info(`Downloading conversation replies`);
		let time_taken = new Date();
		
		let count_replies = await this.do_download_archive(`conversation_id:${conversation_id}`);
		this.totals.replies += count_replies;
		
		time_taken = new Date() - time_taken;
		
		// console.log();
		// l.log(`Done in ${pretty_ms(time_taken)}, ${count_replies} replies downloaded`);
	}
	
	/**
	 * Performs the downloading of all the tweets matched by a given query.
	 * All data downloaded is sent to the output directory determined at
	 * initialisation.
	 * Unlike .download_query(), this function doesn't take a start / end Date
	 * objects - instead it uses the Date objects attached to the
	 * TweetDownloadManager object as member variables.
	 * @param	{string}		query	The query string to search for.
	 * @return	{Promise}	A promise that resolves when the downloading process is complete.
	 */
	async do_download_archive(query) {
		query += " -is:retweet"; // Exclude retweets, ref https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query#boolean
		
		// Totals just for this run
		// We could be downloading the tweets for a single conversation
		let tweets = 0;
		
		let next_token = null;
		do {
			let time_api = new Date();
			let response = await this.download_single_wrapped(query, next_token);
			time_api = new Date() - time_api;
			// Guarantee at least 1s between requests
			await sleep_async(1 * 1000);
			
			if(typeof response.data == "undefined") {
				l.warn(`Encountered undefined response (HTTP status code ${response.statusCode}), retrying`);
				continue;
			}
			
			if(response == this.sym_retry) continue;
			if(response == this.sym_give_up) {
				process.exit(3);
			}
			
			next_token = response.meta.next_token || null;
			
			
			// Metrics
			this.totals.responses++;
			this.totals.tweets += response.data.length;
			tweets += response.data.length;
			if(response.includes.users instanceof Array)
				this.totals.users += response.includes.users.length;
			if(response.includes.places instanceof Array)
				this.totals.places += response.includes.places.length;
			
			
			let time_process = new Date();
			await this.processor.process(response);
			time_process = new Date() - time_process;
			
			// Update the CLI
			process.stdout.write(`[ ${(new Date()).toISOString()} ] ${this.totals.responses} API calls made; totals: tweets ${this.totals.tweets} (${this.totals.replies} replies), ${this.totals.users} users, ${this.totals.places} places; timings ${pretty_ms(time_api)} API, ${pretty_ms(time_process)} process \r`);
		} while(next_token !== null);
		
		return tweets;
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
