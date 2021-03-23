"use strict";

import crypto from 'crypto';

/**
 * Converts the input data to a string, hashes it, and returns the value.
 * @param	{any}		data	The data to hash.
 * @param	{string}	salt	The salt to hash the data with.
 * @return	{string}	A hash of the input data.
 */
export default function(data, salt) {
	return crypto.createHash("shake128")
		.update("|")
		.update(data.toString())
		.update(salt)
		.digest()
		.toString("base64")
		.replace(/\+/g, "_")
		.replace(/\//g, "-")
		.replace(/=/g, "");
}
