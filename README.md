# PhD-Social-Media

> Twitter Academic API tweet downloader

The project downloads tweets from twitter and saves them to ab output directory. It can:

 - Anonymise all tweets downloaded (this is automatic can _cannot_ be disabled)
 - Downloads all replies to tweets matched (optional)

Note that the users and places are **not unique** until they are deduplicated by the post-processing script `post-process.sh` - more information about this in the [usage section below](#usage)

## System Requirements
 - Linux (Windows might work too, but is untested)
 - [Node.js](https://nodejs.org/) (and `npm`, which is bundled automatically with Node.js)
 - [`jq`](https://stedolan.github.io/jq/) (for post-processing tweets to deduplicate them)
 - Bash (for running the post-processing script; Windows users may be able to use Git Bash)


## Usage
TODO: write usage here.

Don't forget about `post-process.sh` that needs to be run manually after the script finishes (recommend Windows users use the Windows Subsystem for Linux)


## Exit codes

Exit code	| Meaning
------------|----------------
0			| Success
1			| General error
3			| Gave up downloading more tweets because of an error parsing a response Twitter sent us


## Analysing the data

### Plot a frequency graph
Run the following command:

```bash
cat tweets.jsonl | jq --raw-output .created_at | awk 'BEGIN { FS="T" } { print $1 }' | sort | uniq -c | sed -e 's/\s\s*/ /g' -e 's/^\s//g' | tr ' ' '\t' >frequencies.tsv
```

...replacing `tweets.jsonl` and `frequencies.tsv` with the input and output files respectively.

Then, open the resulting file in your favourite editor (e.g. Libreoffice Calc) to plot the graph (swap the columns around).

## Useful Links
 - `phin` (the HTTP client library we're using) docs: https://ethanent.github.io/phin/global.html
 - Twitter API full archive search reference: https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-all
 - Twitter API building queries: https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query
