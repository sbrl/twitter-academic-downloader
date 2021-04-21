"use strict";

export default function(cli) {
	cli.subcommand("download", "Downloads & anonymises Twitter data from the Academic API (not guaranteed to be downloaded in chronological order)")
		.argument("search", "The search string to query the Twitter API with", null, "string")
		.argument("start-time", "The start time to start downloading tweets from", null, "date")
		.argument("end-time", "Optional. The end time to finish downloading tweets at", null, "date")
		.argument("credentials", "Path to a (TOML formatted) credentials file to use. See the README for more information on the format.")
		.argument("output", "Path to the directory to write the output to", null, "string")
		.argument("max-query-length", "The maximum query length. Default: 1024. This only needs changing if you're not on the academic product track (which is the only track supported by this tool at the current time)", 1024, "number");
}
