"use strict";

import path from 'path';
import fs from 'fs';
import os from 'os';

import got from 'got';

import postify from '../formatters/postify.mjs';
import l from '../io/Log.mjs';

// HACK: Make sure __dirname is defined when using es6 modules. I forget where I found this - a PR with a source URL would be great :D
const __dirname = import.meta.url.slice(7, import.meta.url.lastIndexOf("/"));

const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../package.json"))).version;

const endpoint = `https://api.twitter.com`;

export default async function(credentials, path, get_params) {
	const url = `${endpoint}${path}?${postify(get_params)}`;
	l.debug(`[download_json_twitter] Fetching URL`, url);
	
	// You *really* should be polite when querying the API.
	if(typeof process.env.CONTACT_ADDR !== "string")
		throw new Error(`[download_json_twitter] Error: CONTACT_ADDR environment variable not set to an email address or URL. This email address or URL is sent in the user agent string for informational/contact/abuse purposes.`);
	
	return JSON.parse(await got(url, {
		headers: {
			authorization: `Bearer ${credentials.bearer_token}`,
			"user-agent": `AcademicTweetDownloader/${version} (Node.js/${process.version}; ${os.platform()} ${os.arch()}; ${process.env.CONTACT_ADDR||""}) dynamic-flood-mapping`
		}
	}));
}
