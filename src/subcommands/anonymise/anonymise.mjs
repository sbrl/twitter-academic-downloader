"use strict";

import fs from 'fs';
import path from 'path';

import nexline from 'nexline';
import pretty_ms from 'pretty-ms';

import l from '../../lib/io/Log.mjs';
import settings from '../../settings.mjs';

import TwitterApiCredentials from '../../lib/download/TwitterApiCredentials.mjs'; 
import TweetAnonymiser from '../../lib/tweets/TweetAnonymiser.mjs';
import { write_safe, end_safe } from '../../lib/io/StreamHelpers.mjs';

export default async function () {
	if(typeof settings.cli.input !== "string")
		throw new Error(`Error: No input file specified (try --input path/to/tweets.jsonl)`);
	if(!fs.existsSync(settings.cli.input))
		throw new Error(`Error: The input file at '${settings.cli.input}' doesn't exist. Have you checked the spelling and file permissions?`);
	
	if(typeof settings.cli.credentials !== "string")
		throw new Error(`Error: No credentials file specified (try --credentials path/to/file.toml)`);
	if(!fs.existsSync(settings.cli.credentials))
		throw new Error(`Error: The credentials file at '${settings.cli.credentials}' doesn't exist. Have you checked the spelling and file permissions?`);
	
	if(![ "tweet", "user" ].includes(settings.cli.type))
		throw new Error(`Error: Unknown item type '${settings.cli.type}'. Valid values: tweet (the default), user.`);
	
	let credentials = await TwitterApiCredentials.Load(settings.cli.credentials);
	
	let anonymiser = new TweetAnonymiser(
		credentials.anonymise_salt
	);
	
	let basename = path.basename(settings.cli.input);
	let basename_match = basename.match(/\.([a-z0-9+]+)$/i);
	let ext = basename_match == null ? "" : basename_match[1];
	let target_filepath = path.join(
		path.dirname(settings.cli.input),
		`${basename.substr(0, basename_match.index)}-anonymised.${ext}`
	);
	l.log(`Writing to '${target_filepath}'`);
	
	let reader = nexline({
		input: fs.createReadStream(settings.cli.input)
	});
	let writer = fs.createWriteStream(target_filepath);
	
	let i = 0, time = new Date();
	while(true) {
		let line = await reader.next();
		if(line == null || line.length == 0) break;
		i++;
		
		let obj = JSON.parse(line);
		
		switch(settings.cli.type) {
			case "tweet":
				anonymiser.anonymise_tweet(obj);
				break;
			case "user":
				anonymiser.anonymise_user(obj);
				break;
		}
		
		await write_safe(writer, `${JSON.stringify(obj)}\n`);
		
		if(i % 1000 == 0) process.stdout.write(`\rAnonymising tweets: ${i}...`)
	}
	await end_safe(writer);
	
	time = new Date() - time;
	
	console.log(`done, ${i} ${settings.cli.type}s anonymised in ${pretty_ms(time)} (~${(i / time * 1000).toFixed(0)} tweets / sec)`);
}
