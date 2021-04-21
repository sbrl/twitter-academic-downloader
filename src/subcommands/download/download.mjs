"use strict";

import fs from 'fs';
import path from 'path';

import settings from '../../settings.mjs';

import TweetDownloadManager from '../../lib/download/TweetDownloadManager.mjs';

export default async function () {
	if(typeof settings.cli.search !== "string")
		throw new Error(`Error: No search string specified (try --search "query string here").`);
	if(typeof settings.cli.credentials !== "string")
		throw new Error(`Error: No credentials file specified (try --credentials path/to/file.toml)`);
	if(!(settings.cli.start_time instanceof Date))
		throw new Error(`Error: No time to start downloading tweets froms pecified (type --start-time "YYYY-MM-DD HH:MM")`);
	if(!fs.existsSync(settings.cli.credentials))
		throw new Error(`Error: The credentials file at '${settings.cli.credentials}' doesn't exist. Have you checked the spelling and file permissions?`);
	if(typeof settings.cli.output !== "string")
		throw new Error(`Error: No output directory specified (try --output path/to/directory)`);
	if(settings.cli.tweets_per_request < 10 || settings.cli.tweets_per_request > 500)
		throw new Error(`Error: The twitter API only allows retrieving between 10 and 500 tweets per api call (you asked for ${settings.cli.tweets_per_request}).`);
	if(settings.cli.max_query_length <= 0)
		throw new Error(`Error: Invalid max query length ${settings.cli.tweets_per_request} - the value must be a positive integer.`);
	
	let downloader = await TweetDownloadManager.Create(
		settings.cli.credentials,
		settings.cli.output,
		settings.cli.download_replies,
		settings.cli.tweets_per_request
	);
	
	await downloader.download_archive(
		settings.cli.search,
		settings.cli.start_time,
		settings.cli.end_time
	);
}
