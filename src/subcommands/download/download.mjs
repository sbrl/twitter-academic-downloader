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
	
	let downloader = await TweetDownloadManager.Create(
		settings.cli.credentials,
		settings.cli.output
	);
	
	await downloader.download_archive(
		settings.cli.search,
		settings.cli.start_time,
		settings.cli.end_time
	);
}
