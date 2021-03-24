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
			"user-agent": `AcademicTweetDownloader/${version} (Node.js/${process.version}; ${os.platform()} ${os.arch()}; ${credentials.contact_address}) dynamic-flood-mapping`
		}
	});
	try {
		response.body = JSON.parse(response.body);
	}
	catch(error) {
		l.error(`[download_json_twitter] Failed to parse response as JSON.`);
		l.error(`[download_json_twitter] URL:`, url);
		l.error(`[download_json_twitter] Status code:`, response.statusCode, "headers:", response.getHeaders());
		l.error(`[download_json_twitter] Response text:`, response.body);
		return null;
	}
}
