"use strict";

export default function(cli) {
	cli.subcommand("download", "Downloads & anonymises Twitter data from the Academic API (not guaranteed to be downloaded in chronological order)")
		.argument("search", "The search string to query the Twitter API with", null, "string")
		.argument("start-time", "The start time to start downloading tweets from", null, "date")
		.argument("end-time", "Optional. The end time to finish downloading tweets at", null, "date")
		.argument("credentials", "Path to a (TOML formatted) credentials file to use. See the README for more information on the format.")
		.argument("output", "Path to the directory to write the output to", null, "string")
		.argument("tweets-per-request", "Max number of tweets to ask for per api call. Default: 500, can range from 10 to 500. Keep at a low value during testing, then bump it to max for the actual run.", 500, "number")
		.argument("no-replies", "Do not download replies to tweets. Speeds up execution, but of course yields less data.", false, "boolean");
}
