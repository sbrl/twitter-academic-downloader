"use strict";

import path from 'path';
import fs from 'fs';

import { write_safe, end_safe } from '../io/StreamHelpers.mjs';
import TweetAnonymiser from '../tweets/TweetAnonymiser.mjs';

class TwitterResponseProcessor {
	constructor(output_dir, anon_salt) {
		this.output_dir = output_dir;
		
		this.anonymiser = new TweetAnonymiser(anon_salt);
		
		if(!fs.existsSync(output_dir))
			fs.mkdirSync(output_dir, { recursive: true, mode: 0o700 });
		
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
		
		this.stream_tweets_with_replies = fs.createWriteStream(path.join(
			output_dir,
			"conversation_ids_with_replies.txt"
		));
	}
	
	async process(response) {
		for(let tweet of response.data)
			await this.process_tweet(tweet);
		for(let user of response.includes.users)
			await this.process_user(user);
		if(response.includes.places instanceof Array) {
			for(let place of response.includes.places)
				await this.process_place(place);
		}
	}
	
	async process_tweet(tweet) {
		if(tweet.public_metrics.reply_count > 0)
			await write_safe(this.stream_tweets_with_replies, `${tweet.id}\n`);
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
