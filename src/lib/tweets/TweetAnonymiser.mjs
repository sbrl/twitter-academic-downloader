"use strict";

import anonymise_hash from '../formatters/anonymise_hash.mjs';

class TweetAnonymiser {
	constructor(salt) {
		if(typeof salt !== "string")
			throw new Error(`[TweetAnonymiser] Error: No salt specified.`);
		
		this.salt = salt;
	}
	
	/**
	 * Rounds the given date to the nearest minute.
	 * @param	{Date|string}	d	The date to round.
	 * @return	{Date}			The rounded date.
	 */
	round_date(d) {
		if(!(d instanceof Date))
			d = new Date(d);
		
		d.setSeconds(0);
		d.setMilliseconds(0);
		return d;
	}
	
	/**
	 * Randomly jitters a given number by adding or subtracting another number to it.
	 * @param  {[type]} n          [description]
	 * @param  {Number} [range=10] [description]
	 * @return {[type]}            [description]
	 */
	jitter_number(n, range = 10) {
		return Math.max(
			0,
			n + Math.floor((Math.random() * range * 2) - range)
		);
	}
	
	/**
	 * Anonymises a tweet by hashing all the personally identifiable data in it.
	 * Note that this mutates the original tweet.
	 * Anonymisation is done by doing the following:
	 *  - Hashing with a salt personally-identifiable information
	 *  - Rounding dates to the nearest minute
	 * Despite this, the hash algorithm used is *deterministic*. This means
	 * that if the same username for example is hashed multiple times, it will
	 * always return the same result, allowing relational information to be
	 * retained.
	 * @param	{object}	tweet	The tweet to anonymise.
	 * @return	{void}
	 */
	anonymise_tweet(tweet) {
		// Anonymise the tweet itself
		tweet.id = anonymise_hash(tweet.id, this.salt);
		tweet.conversation_id = anonymise_hash(tweet.conversation_id, this.salt);
		tweet.author_id = anonymise_hash(tweet.author_id, this.salt);
		tweet.created_at = this.round_date(tweet.created_at).toISOString();
		tweet.text = tweet.text.replace(/@(\S+)/g, (_, username) => `@${anonymise_hash(username, this.salt)}`);
		
		// Anonymise any referenced tweets data
		if(typeof tweet.referenced_tweets === "object") {
			for(let item of tweet.referenced_tweets) {
				item.id = anonymise_hash(item.id, this.salt);
			}
		}
		
		
		if(typeof tweet.entities === "object") {
			// Delete start & end indexes, because they could leak information about an @mention
			for(let key in tweet.entities) {
				for(let item in tweet.entities[key]) {
					delete item.start;
					delete item.end;
				}
			}
			
			// Anonyise all mentions & convert to a list of strings instead
			if(typeof tweet.entities.mentions === "object") {
				let mentions = [];
				for(let mention of tweet.entities.mentions) {
					mentions.push(anonymise_hash(mention.username, this.salt));
				}
				tweet.entities.mentions = mentions;
			}
		}
	}
	
	anonymise_user(user) {
		user.id = anonymise_hash(user.id, this.salt);
		user.username = anonymise_hash(user.username, this.salt);
		user.public_metrics.followers_count =
			this.jitter_number(user.public_metrics.followers_count);
		user.public_metrics.following_count =
			this.jitter_number(user.public_metrics.following_count);
		user.public_metrics.tweet_count = 
			this.jitter_number(user.public_metrics.tweet_count);
		user.public_metrics.listed_count =
			this.jitter_number(user.public_metrics.listed_count, 3);
		delete user.name;
	}
}

export default TweetAnonymiser;
