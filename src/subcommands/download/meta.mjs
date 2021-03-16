"use strict";

export default function(cli) {
	cli.subcommand("download", "Downloads & anonymises Twitter data from the Academic API")
		.argument("search", "The search string to query the Twitter API with", null, "string")
		.argument("credentials", "Path to a (TOML formatted) credentials file to use. See the README for more information on the format.")
		.argument("output", "Path to the file to write the output to (default: stdout)");
}
