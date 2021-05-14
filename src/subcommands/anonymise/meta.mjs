"use strict";

export default function(cli) {
	cli.subcommand("anonymise", "Anonymises tweets in a jsonl file. Output file is <filename_without_ext>-anonymised.<ext>. Note that this is done automatically on download - you do NOT need to run this manually unless you have data from elsewhere.")
		.argument("input", "Path to the input file to anonymise.", null, "string")
		.argument("type", "The type of object to anonymise. Default: tweet. Possible values: tweet, user.", "tweet", "string")
		.argument("credentials", "Path to a (TOML formatted) credentials file that contains the salt to use for anonymisation. See the README for more information on the format.")
}
