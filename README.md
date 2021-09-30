# twitter-academic-downloader

> Twitter Academic API tweet downloader

This command-line program downloads tweets from twitter using the academic full-archive search endpoint and saves them to an output directory. It can:

 - Anonymise all tweets downloaded (this is automatic can _cannot_ be disabled)
 - Downloads all replies to tweets matched (optional)

Note that the users and places are **not unique** until they are deduplicated by the post-processing script `post-process.sh` - more information about this in the [usage section below](#usage)

 - **Current version:** ![current npm version - see the GitHub releases](https://img.shields.io/npm/v/twitter-academic-downloader)
 - **Changelog:** https://github.com/sbrl/twitter-academic-downloader/blob/main/CHANGELOG.md
 
<!-- Original package.json description: Social Media analysis for the dynamic mapping of floods -->

## System Requirements
 - Linux (Windows might work too, but is untested and the following usage guide is written with Linux users in mind)
 - [Node.js](https://nodejs.org/) (and `npm`, which is bundled automatically with Node.js)
 - [`jq`](https://stedolan.github.io/jq/) (for post-processing tweets to deduplicate them)
 - Bash (for running the post-processing script; Windows users may be able to use Git Bash)

Also, basic Linux command-line experience is required. I have a list of links in the following blog post that might be helpful to learn this:

[Learn your terminal (or command line)](https://starbeamrainbowlabs.com/blog/article.php?article=posts/242-Learn-Your-Terminal.html)

On apt-based systems such as Debian and Ubuntu, do this to install dependencies:

```bash
sudo apt install jq curl
```

Then, to install Node.js if you don't have it already you can use the [Node Version Manager](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
exec bash
nvm install node
```


## Usage
First, install using npm:

```bash
npm install twitter-academic-downloader
```

Then, you need to obtain the API credentials. To do this, you need to first apply to Twitter for Academic access. Do that here: <https://developer.twitter.com/en/portal/products/academic>

Once you have access approved, create a project and app here: <https://developer.twitter.com/en/portal/projects-and-apps>

This will give you 3 things:

 - An API key
 - An API secret key
 - A bearer token

Store all 3 of these securely. It is recommended that you use a password manager such as [Keepass](https://keepass.info/), [Bitwarden](https://bitwarden.com/), or similar.

Then, you need to create a credentials file for `twitter-academic-downloader` to read. Currently twitter-academic-downloader only uses the bearer token. Such a configuration file is written in [TOML](https://toml.io/en/).

Linux users can create the file securely like so:

```bash
touch credentials.toml
chmod 0700 credentials.toml
```

By creating the the file and applying permissions to it _before_ putting private information in the file, it is more secure. Open the file for editing, and paste in the following:

```toml
bearer_token = "BEARER_TOKEN_HERE"

# This can be any string, but must include either a URL or an email address. For example:
#contact_address = "Bob's research program about rockets; contact: <bob@bobsrockets.com>"s
contact_address = "CONTACT_ADDRESS_HERE"

# An unpredictable string that's used to anonymise downloaded data.
# For example, given the same salt the same username will be anonymised to the
# same string every time, allowing for datasets to be built through multiple
# runs of this program on differetn occasions. Once the downloading of a
# dataset is complete, this string should be destroyed for security.
# It is suggested that the string be at least 32 characters long. 
# random.org is a good place to get randomness from if you're not on Linux:
# https://www.random.org/strings/?num=10&len=10&digits=on&upperalpha=on&loweralpha=on&unique=on&format=plain&rnd=new
# Alternatively on Linux execute this:
# 	dd if=/dev/urandom bs=1 count=32 2>/dev/null | base64 | tr -d '+/='
anonymise_salt = "SALT_HERE"
```

There are 3 properties here that need changing.

 - `BEARER_TOKEN_HERE` needs replacing with the bearer token you obtained from Twitter earlier.
 - `CONTACT_ADDRESS_HERE` needs replacing with some kind of contact details. Be  it an email or website address. This is sent in all requests in the [user agent string](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) to be polite. Alternatively, this can be omitted and the `CONTACT_ADDRESS` environment variable set instead.
 - `SALT_HERE` needs replacing with a long, random, and unguessable string. This Bash command can generate an appropriate one: `dd if=/dev/urandom bs=1 count=32 2>/dev/null | base64 | tr -d '+/='`. Alternatively, [random.org can be used instead](https://www.random.org/passwords/?num=1&len=24&format=html&rnd=new). See the [section on data anonymisation](#data-anonymisation) for more information.

Once done, you can download data from Twitter like so:

```bash
twitter-academic-downloader download --credentials path/to/credentials.toml --output path/to/output_dir --start-time '2019-01-01 01:00' --search 'insert query here'
```

Let's break down the above piece by piece:

 - `twitter-academic-downloader`: This is the name of the command we want to call. In this case, we are calling the `twitter-academic-downloader`.
 - `download`: This is the subcommand we are calling. In this case, we are calling the `download` subcommand.
 - `--credentials path/to/credentials.toml`: This specifies the location of the credentialsl file we created earlier. Replace `path/to/credentials.toml` with the path to your `credentials.toml` file.
 - `--output path/to/output_dir`: The path to the output directory to which the downloaded data will be written. Replace `path/to/output_dir` with the path to the output directory you'd like to download the data to. It will be created if it doesn't already exist.
 - `--start-time '2019-01-01 01:00'`: Specifies the start time to look for tweets. The Twitter academic API requires that a start time be specified when downloading tweets from the full archive search endpoint. The start time should be in the format `YYYY-MM-DD HH:MM` (or anything that can be parsed in javascript via `new Date(thing)`).
 - `--search 'insert query here'`: The query you want to search twitter for. Can be any valid twitter search query - ` -is:retweet` will automatically be appended. See the [Twitter docs for more information](https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query)

Some additional options are also supported - do `twitter-academic-downloader --help` for more information. Some additional notes about some them are detailed below:

 - `--tweets-per-request`: This controls the maximum number of tweets to download per request. Defaults to 500, which is the maximum possible value. If you're testing, try a lower number to start with (minimum: 10)
 - `--no-replies`: Disables the downloading of replies. By default, all the replies to tweets downloaded are downloaded too, which from casual observation yields on average about double the number of tweets in total.
 - `--max-query-length`: This is used to batch the download of replies. You should not need to change it unless the max query length is not 1024 for your api endpoint.

Once the downloader has finished, you'll be prompted to execute a Bash script to post-process the data. By default this script is called `post-process.sh`, and you should be prompted as to the exact command you need to copy and paste to run it - regardless of your current working directory.

The purpose of this script is to deduplicate downloaded users and places after the downloader has finished. `post-process.sh` can be safely deleted once it has been executed. Windows users should investigate the Windows Subsystem for Linux or Git Bash.


## Data anonymisation
All data downloaded is fully anonymised. This is done by hashing sensitive data with a provided salt. In this fashion, it is ensured that while the data is anonymised a given username or id for example yields the exact same hash every time, thereby preserving relationships in the dataset downloaded.

The same hashes will be yielded even on multiple runs of twitter-academic-downloader so long as you use the same salt. Once you're confident you've downloaded all the data you need, delete the salt value from the credentials file above to ensure that the data is permanently anonymised.


## Data format
Data downloaded from the Twitter API is kept as close to the original data format received from the API as possible, aside from anonymisation which is [described above](#data-anonymisation). Notable changes include the stripping of start / end indexes from various items, in order to prevent leaks of username lengths.

The following files will be present in the output directory:

 - `post-process.sh`: The post-processing script - see above. Once run, this can be safely deleted.
 - `tweets.jsonl`: The tweets downloaded, in [line-delimited JSON](https://jsonlines.org/). In other words, 1 JSON object per line with a line delimiter of `\n`.
 - `users.json`: The users associated with the tweets, again in line-delimited JSON. **Not unique until `post-process.sh` is run!**
 - `places.json`: The places associated with the tweets, again in line-delimited JSON. **Not unique until `post-process.sh` is run!**


## Exit codes
twitter-academic-downloader will exit with the following status codes:

Exit code	| Meaning
------------|----------------
0			| Success
1			| General error
3			| Gave up downloading more tweets because of an error parsing a response Twitter sent us


## Frequently Asked Questions

### Why can't I download data without anonymising it?
It was determined by the ethics panel at my University that all social media data downloaded *must* be completely anonymised. To accomplish this and ensure there's no trace of data that hasn't yet been anonymised on disk, twitter-academic-downloader anonymises data before writing it to disk.


## Analysing the data
Useful commands and quick Bash one-liners. It is recommended that you are confident with Bash to use this section. If you aren't, please skip this section and continue reading the useful links,  contributing, and licence sections.

These commands may look long and complicated, but they really aren't. Some good resources on the subject:

 - [explainshell.com](https://explainshell.com/)
 - [Learn your terminal (or command line)](https://starbeamrainbowlabs.com/blog/article.php?article=posts/242-Learn-Your-Terminal.html) on [my blog](https://starbeamrainbowlabs.com/blog/)


### Plot a frequency graph
Run the following command:

```bash
cat tweets.jsonl | jq --raw-output .created_at | awk 'BEGIN { FS="T" } { print $1 }' | sort | uniq -c | sed -e 's/\s\s*/ /g' -e 's/^\s//g' | tr ' ' '\t' >frequencies.tsv
```

...replacing `tweets.jsonl` and `frequencies.tsv` with the input and output files respectively.

Then, open the resulting file in your favourite editor (e.g. Libreoffice Calc) to plot the graph (swap the columns around).

#### ....with sentiment

To plot it with positive/negative sentiment (AFTER labelling a given dataset), do the following to generate a tab-separated values (TSV) file:

```bash

```

To do the same for multiple downloads at a time, save this as a script and `chmod +x` it:
```bash
#!/usr/bin/env bash

generate() {
	filename="${1}";
	dir="$(dirname "${filename}")";
	target="${dir}/$(basename "${dir}")-sentiment.tsv";
	jq --raw-output '[ .created_at, .label ] | @tsv' < "${filename}" | awk '{ gsub("T.*", "", $1); print( $1 "\t" $2); }' | sort | uniq -c | awk 'BEGIN { OFS="\t"; printf("DATE\tPOSITIVE\tNEGATIVE"); } { date=$2; sent=$3; count=$1; if(date != last_date) print(last_date, acc_positive, acc_negative); if(sent == "positive") acc_positive=count; else acc_negative=$1; last_date=$2; }' > "${target}";
}

export -f generate;

find . -iname 'tweets-labelled.jsonl' -print0 | xargs -P "$(nproc)" -0 -I {} bash -c 'generate "{}"';

```

...and then `cd` to the directory containing the tweets in question, and then 

### Various useful `jq` things

 - Filter by English tweets: `select(.lang == "en")`


### List all emojis
Extracting emojis is a complex task. The following will extract all emojis, and return a ranked list of how many instances were found thereof:

```bash
jq --raw-output '.text' <tweets-all.jsonl | sed -e 's/[][{}()"+|&^\/@#?!_:;*’“”[:alnum:][:space:][:blank:]….:'"'"',=–‘%&$⁰7£¥€₹½²₂³⁶℃㏄℅™¤❝❞¡§©®»\x{00A0}\x{1680}\x{180E}\x{2000}\x{2001}\x{2002}\x{2003}\x{2004}\x{2005}\x{2006}\x{2007}\x{2008}\x{2009}\x{200A}\x{200B}\x{200C}\x{200D}\x{2028}\x{2029}\x{202F}\x{205F}\x{2060}\x{3000}\x{FEFF}\r«—~-]//g' -e '/^$/d' -e 's/./\0\n/g' | sort | uniq -c | sort -nr
```

Note that this isn't perfect - some manual cleaning will be required, as even the [wikipedia list of whitespace characters](https://en.wikipedia.org/wiki/Whitespace_character) appears to be incomplete O.o


### Extract start date
Extract the earliest date a tweet was made in a given dataset like so:

```bash
jq --raw-output '.created_at' <"StormDennis/tweets.jsonl" | head | xargs -n1 date +%s --date | sort -n | head -n1 | xargs -I {} date --rfc-3339=seconds --date @{}
```

For multiple files, do this:

```bash
find . -name 'tweets.jsonl' -print0 | xargs -I{} -P "$(nproc)" -0 bash -c 'in="{}"; echo -e "$(dirname "$in")\t$(jq --raw-output .created_at <"$in" | xargs -n1 date +%s --date | sort -n | head -n1 | xargs -I {} date --rfc-3339=seconds --date @{})";' | tee start-times-fixed.txt
```

To get the end date instead of the start date, change the `sort -n` to `sort -nr` (i.e. reverse the sort direction).


### Count positive/negative sentiment
AFTER you have labelled the dataset with the sentiment analysis tweet labeller [in a separate repository - link coming soon], then the sentiments can be tallied like so:

```bash
cat tweets-labelled.jsonl | jq --raw-output .label | sort | uniq -c | tr "\n" " "
```

For a directory of runs, you can mass-evaluate all of them at once like this:


```bash
find . -type f -iname 'tweets-labelled.jsonl' -print0 | xargs -I{} -0 bash -c 'echo -ne "$(basename "$(dirname "{}")")\t$(cat {} | jq --raw-output .label | sort | uniq -c | tr "\n" " ")\n";' | awk 'BEGIN { print("PLACE\tNEGATIVE\tPOSITIVE\tTOTAL\tNEGATIVE_PERCENT\tPOSITIVE_PERCENT\tORDER"); RS="\n"; OFS="\t"; } { total=$2+$4; if(total > 0) print($1, $2, $4, total, $2 / total*100, $4 / total*100, $3 "-" $5); else print($1, 0, 0, 0); }'
```


### Keyword extraction
To extract a list of key words in a downloaded dataset, it is recommended you first download a [stop words](https://en.wikipedia.org/wiki/Stop_word) list to make the resulting word list more meaningful. I got mine from here: <https://countwordsfree.com/stopwords>. In the unlikely event the site goes down, here's a link to it in the Wayback Machine: <https://web.archive.org/web/20210119165857/https://countwordsfree.com/stopwords>.

Think careful about which list you download, as stop word lists are language-specific.

To generate a list of keywords, do this:

```bash
jq --raw-output .text <path/to/tweets.jsonl | tr ' [:upper:]' '\n[:lower:]' | grep -ivP "^($(cat path/to/stop_words_english.txt | tr '\n' '|')|-|&[a-z]+;)$" | sort | uniq -c | sort -n;
```


## Useful Links
 - `phin` (the HTTP client library we're using) docs: https://ethanent.github.io/phin/global.html
 - Twitter API full archive search reference: https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-all
 - Twitter API building queries: https://developer.twitter.com/en/docs/twitter-api/tweets/search/integrate/build-a-query


## Contributing
Contributions are welcome as [pull requests](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests)! Don't forget to say that you donate your contribution under the _Mozilla Public License 2.0_ in your PR comment, otherwise I won't be able to merge it.


## Licence
This project is licensed under the _Mozilla Public License 2.0_. See the `LICENSE` file in this repository for the full text. Tldr legal have a [great summary](https://tldrlegal.com/license/mozilla-public-license-2.0-(mpl-2)) of the license if you're interested.

The English stop words list in `stop_words_english.txt` is not covered by this licence.
