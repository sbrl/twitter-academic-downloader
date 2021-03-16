"use strict";

import fs from 'fs';

import TOML from '@ltd/j-toml';

import { obj_assign_recursive } from '../manip/obj.mjs';

/**
 * Reads a pair of TOML configuration files.
 * @param	{string}		file_default	The path to the default configuration file.
 * @param	{string|null}	file_custom		The path to the custom configuration file.
 * @return	{object}	The parsed settings object.
 */
function toml_settings_read(file_default, file_custom = null) {
	if(!fs.existsSync(file_default))
		throw new Error(`Error: The default settings file at '${file_default}' doesn't exist.`);
	if(file_custom !== null && !fs.existsSync(file_custom))
		throw new Error(`Error: The default settings file at '${file_custom}' doesn't exist.`);
	
	let obj_default = toml_parse(fs.readFileSync(file_default));
	
	if(typeof file_custom === "string") {
		let obj_custom = toml_parse(fs.readFileSync(file_custom));
		obj_assign_recursive(obj_custom, obj_default);
	} 
	
	return obj_default;
}

/**
 * Helper function to parse a given source string of TOML into an object.
 * @param	{string}	source	The source string to parse.
 * @return	{Object}	The resulting object.
 */
function toml_parse(source) {
	return TOML.parse(
		source,					// Source string
		1.0,					// Specification version
		"\n",					// Multi line joiner
		Number.MAX_SAFE_INTEGER	// Use big int
	);
}

export { toml_settings_read, toml_parse };
export default toml_settings_read;
