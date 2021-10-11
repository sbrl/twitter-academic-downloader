"use strict";
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';

import l from '../io/Log.mjs';
import { write_safe, end_safe } from '../io/StreamHelpers.mjs';
import TweetAnonymiser from '../tweets/TweetAnonymiser.mjs';

// HACK: Make sure __dirname is defined when using es6 modules. I forget where I found this - a PR with a source URL would be great :D
const __dirname = import.meta.url.slice(7, import.meta.url.lastIndexOf("/"));

class TwitterResponseProcessor extends EventEmitter {
	constructor(output_dir, anon_salt) {
		super();
		
		this.output_dir = output_dir;
		this.filepath_properties = path.join(output_dir, "properties.tsv");
		
		this.anonymiser = new TweetAnonymiser(anon_salt);
		
		if(!fs.existsSync(output_dir))
			fs.mkdirSync(output_dir, { recursive: true, mode: 0o700 });
		
		fs.copyFileSync(
			path.join(__dirname, "post-process.sh"),
			path.join(output_dir, "post-process.sh")
		);
		
		
		this.stream_tweets = fs.createWriteStream(path.join(
			output_dir,
			"tweets.jsonl"
		));
		this.stream_users = fs.createWriteStream(path.join(
			output_dir,
			"users.jsonl"
		));
		this.stream_places = fs.createWriteStream(path.join(
			output_dir,
			"places.jsonl"
		));
		
		this.date_start = null;
		this.date_end = null;
		// 
		// this.stream_tweets_with_replies = fs.createWriteStream(path.join(
		// 	output_dir,
		// 	"conversation_ids_with_replies.txt"
		// ));
	}
	
	async properties(query, start_time, end_time) {
		await fs.promises.writeFile(
			this.filepath_properties,
			`PROPERTY\tVALUE\n`+
			[
				["QUERY", query || "***UNKNOWN***"],
				["TIME_START", start_time.toISOString()],
				["TIME_END", end_time instanceof Date ? end_time.toISOString() : ""]
			].map(item => `${item[0]}\t${item[1]}`).join("\n")
		)
	}
	
	async process(response) {
		// console.log(response.includes)
		let media_map = new Map();
		if(typeof response.includes !== "undefined"
			&& response.includes.media instanceof Array
			&& response.includes.media.length > 0) {
			media_map = this.media_map(response.includes.media);
		}
		
		for(let tweet of response.data) {
			if(this.tweet_has_media(tweet)) {
				tweet.media = [];
				for(let media_key of tweet.attachments.media_keys) {
					let media_def = media_map.get(media_key);
					if(typeof media_def !== "object") {
						l.warn(`Warning: media_key ${media_key} not found in media key map`);
						continue;
					}
					tweet.media.push(media_def);
				}
				
				delete tweet.attachments.media_keys;
			}
			await this.process_tweet(tweet);
		}
		
		for(let user of response.includes.users)
			await this.process_user(user);
		if(response.includes.places instanceof Array) {
			for(let place of response.includes.places)
				await this.process_place(place);
		}
	}
	
	async end() {
		const date_start = this.date_start instanceof Date ? this.date_start.toISOString() : "";
		const date_end = this.date_end instanceof Date ? this.date_end.toISOString() : "";
		
		await Promise.all([
			fs.promises.appendFile(this.filepath_properties, `\nTWEETS_START\t${date_start}\nTWEETS_END\t${date_end}\n`),
			end_safe(this.stream_tweets),
			end_safe(this.stream_users),
			end_safe(this.stream_places),
			// end_safe(this.stream_tweets_with_replies),
		]);
	}
	
	/**
	 * Determines whether we actually want to keep the specified tweet or not.
	 * @param	{Object}		tweet	The tweet to operate on.
	 * @return	{Boolean}	Whether this tweet should be kept or not. true = keep, false = discard
	 */
	filter_tweet(tweet) {
		if(tweet.text.match(/^RT\s+[^\s]/i)) return false;
		
		return true;
	}
	
	media_map(media) {
		let media_map = new Map();
		for(let item of media) {
			media_map.set(item.media_key, item);
		}
		return media_map;
	}
	
	/**
	 * Determines whether the given tweet has any attached media or not.
	 * @param	{Object}		tweet	The tweet to analyse.
	 * @return	{Boolean}	Whether the given tweet has any attached media or not.
	 */
	tweet_has_media(tweet) {
		return typeof tweet.attachments == "object"
			&& tweet.attachments.media_keys instanceof Array
			&& tweet.attachments.media_keys.length > 0
	}
	
	async process_tweet(tweet) {
		if(!this.filter_tweet(tweet)) return;
		
		const tweet_date = new Date(tweet.created_at);
		if(this.date_start == null) this.date_start = tweet_date;
		if(this.date_end == null) this.date_end = tweet_date;
		if(this.date_start > tweet_date) this.date_start = tweet_date;
		if(this.date_end < tweet_date) this.date_end = tweet_date;
		
		if(tweet.public_metrics.reply_count > 0) {
			// l.log(`Tweet id ${tweet.id} has metrics`, tweet.public_metrics);
			this.emit("tweet_with_reply", tweet.id);
			// await write_safe(this.stream_tweets_with_replies, `${tweet.id}\n`);
		}
		this.anonymiser.anonymise_tweet(tweet);
		await write_safe(this.stream_tweets, JSON.stringify(tweet));
		await write_safe(this.stream_tweets, "\n");
	}
	
	async process_user(user) {
		this.anonymiser.anonymise_user(user);
		await write_safe(this.stream_users, JSON.stringify(user));
		await write_safe(this.stream_users, "\n");
	}
	
	async process_place(place) {
		await write_safe(this.stream_places, JSON.stringify(place));
		await write_safe(this.stream_places, "\n");
	}
}

export default TwitterResponseProcessor;
