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
	if(!(setings.cli.start_time instanceof Date))
		throw new Error(`Error: No time to start downloading tweets froms pecified (type --start-time "YYYY-MM-DD HH:MM")`);
	if(!fs.existsSync(settings.cli.credentials))
		throw new Error(`Error: The credentials file at '${settings.cli.credentials}' doesn't exist. Have you checked the spelling and file permissions?`);
	
	let output = process.stdout;
	if(typeof settings.cli.output === "string") {
		if(!fs.existsSync(path.dirname(settings.cli.output)))
			throw new Error(`Error: The directory '${path.dirname(settings.cli.output)}' doesn't exist, so the output can't be written to it (have you checked the spelling and directory permissions? On Linux directories need the execute permission as well as the read permission)`);
		
		output = fs.createWriteStream(settings.cli.output);
	}
	
	let downloader = await TweetDownloadManager.Create(settings.cli.credentials, output);
	await downloader.download(
		settings.cli.search,
		settings.cli.start_time,
		settings.cli.end_time
	);
}
