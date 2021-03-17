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
		
		this.api_key = result.api_key;
		this.api_secret_key = result.api_secret_key;
		this.bearer_token = result.bearer_token;
	}
}

TwitterApiCredentials.Load = async (filename) => {
	let result = new TwitterApiCredentials();
	await result.load(filename);
}

export default TwitterApiCredentials;
