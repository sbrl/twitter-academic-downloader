"use strict";

import path from 'path';
import fs from 'fs';
import os from 'os';

import phin from 'phin';

import postify from '../formatters/postify.mjs';
import l from '../io/Log.mjs';

// HACK: Make sure __dirname is defined when using es6 modules. I forget where I found this - a PR with a source URL would be great :D
const __dirname = import.meta.url.slice(7, import.meta.url.lastIndexOf("/"));

const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../package.json"))).version;

const endpoint = `https://api.twitter.com`;

export default async function(credentials, path, get_params) {
	const url = `${endpoint}${path}?${postify(get_params)}`;
	let response = await phin({
		url,
		headers: {
			authorization: `Bearer ${credentials.bearer_token}`,
			"user-agent": `twitter-academic-downloader/${version} (Node.js/${process.version}; ${os.platform()} ${os.arch()}; ${credentials.contact_address})`
		}
	});
	l.debug(`[DEBUG:download_json_twitter] GET ${response.statusCode} ${url}`);
	
	// If it's a buffer, convert it to a string
	if (response.body instanceof Buffer)
		response.body = response.body.toString("utf-8");
	
	try {
		response.body = JSON.parse(response.body);
	}
	catch(error) {
		// It might be a 429
		if(response.statusCode < 200 || response.statusCode >= 300)
			return response;
		l.error(`[download_json_twitter] Failed to parse response as JSON.`);
		l.error(`[download_json_twitter] Response:`, response);
		l.error(`[download_json_twitter] URL:`, url);
		l.error(`[download_json_twitter] Status code:`, response.statusCode);
		l.error(`[download_json_twitter] Response text:`, response.body);
		return null;
	}
	
	return response;
}
