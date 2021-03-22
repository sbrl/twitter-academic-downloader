"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/*
 * A pair of functions to make writing to streams in Node.js less painful.
 * I've used these in a number of different projects so far, and they both
 * *appear* to be stable.
 * @licence	MPL-2.0
 * 
 * Changelog
 *********************************
 * 22nd March 2021
	* We should have brought this into our code snippet library *ages* ago lol :P
 */


/**
 * Writes data to a stream, automatically waiting for the drain event if asked.
 * @param	{stream.Writable}			stream_out	The writable stream to write to.
 * @param	{string|Buffer|Uint8Array}	data		The data to write.
 * @return	{Promise}	A promise that resolves when writing is complete.
 */
function write_safe(stream_out, data) {
	return new Promise(function (resolve, reject) {
		// console.log(`Beginning write`);
		// Handle errors
		let handler_error = (error) => {
			stream_out.off("error", handler_error);
			// console.log(`Error received, handler detached, rejecting`);
			reject(error);
		};
		stream_out.on("error", handler_error);
		
		let returnval = typeof data == "string" ? stream_out.write(data, "utf-8") : stream_out.write(data);
		// console.log(`Write returned`, returnval);
		if(returnval) {
			// We're good to go
			stream_out.off("error", handler_error);
			// console.log("We're good to go, handler detached, resolving");
			resolve();
		}
		else {
			// We need to wait for the drain event before continuing
			// console.log(`Waiting for drain event`);
			stream_out.once("drain", () => {
				stream_out.off("error", handler_error);
				// console.log(`Drain event received, handler detached, resolving`);
				resolve();
			});
		}
	});
}

/**
 * Waits for the given stream to end and finish writing data.
 * @param  {stream.Writable} stream            The stream to end.
 * @param  {Buffer|string} [chunk=undefined] Optional. A chunk to write when calling .end().
 * @return {Promise}                   A Promise that resolves when writing is complete.
 */
function end_safe(stream) {
	return new Promise((resolve, _reject) => {
		// Handle streams that have already been closed
		if(stream.writableFinished) resolve();
		stream.once("finish", resolve);
		stream.end();
	});
}

export {
	write_safe, end_safe
};
