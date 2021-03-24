"use strict";

import toml_settings_read from '../io/TomlSettings.mjs';

class TwitterApiCredentials {
	constructor() {
		
	}
	
	async load(filename) {
		let result = toml_settings_read(filename);
		if(typeof result.api_key !== "string")
			throw new Error(`Error: No api_key specified.`);
		if(typeof result.api_secret_key !== "string")
			throw new Error(`Error: No api_secret_key specified.`);
		if(typeof result.bearer_token !== "string")
			throw new Error(`Error: No bearer_token specified.`);
		// You *really* should be polite when querying the API.
		if(typeof result.contact_address !== "string") {
			if(typeof process.env.CONTACT_ADDRESS !== "string")
				throw new Error(`Error: No contact_address was specified. This email address or URL is sent in the user agent string for informational/contact/abuse purposes.`);
		}
		if(typeof result.anonymise_salt !== "string")
			throw new Error(`Error: No anonymise_salt specified.`);
		
		// Note that the 1st 3 here are too sensitive to be stored in an
		// environment variable, because *anyone* can read the environment of
		// another process O.o
		this.api_key = result.api_key;
		this.api_secret_key = result.api_secret_key;
		this.bearer_token = result.bearer_token;
		this.contact_address = result.contact_address || process.env.CONTACT_ADDRESS;
		this.anonymise_salt = result.anonymise_salt;
	}
}

TwitterApiCredentials.Load = async (filename) => {
	let result = new TwitterApiCredentials();
	await result.load(filename);
	return result;
}

export default TwitterApiCredentials;
