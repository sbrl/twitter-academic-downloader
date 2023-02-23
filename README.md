# twitter-academic-downloader

> Twitter Academic API tweet downloader

This command-line program downloads tweets from twitter using the academic full-archive search endpoint and saves them to an output directory. It can:

 - Anonymise all tweets downloaded (this is automatic and can _cannot_ be disabled)
 - Downloads all replies to tweets matched (optional)

Note that tweets, users, and places are **not unique** until they are deduplicated by the post-processing script `post-process.sh` - more information about this in the [usage section below](#usage)

 - **Current version:** ![current npm version - see the GitHub releases](https://img.shields.io/npm/v/twitter-academic-downloader)
 - **Changelog:** https://github.com/sbrl/twitter-academic-downloader/blob/main/CHANGELOG.md

Are you using twitter-academic-downloader for your research? Please let me know that this has helped you by [replying to this GitHub discussion](https://github.com/sbrl/twitter-academic-downloader/discussions/2)!

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

The purpose of this script is to deduplicate downloaded tweets, users, and places after the downloader has finished. `post-process.sh` can be safely deleted once it has been executed. Windows users should investigate the Windows Subsystem for Linux or Git Bash.


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

Please don't ask me to add a feature to bypass the anonymisation. Such requests will not be considered, and any pull requests implementing this will unfortunately be closed with being merged.

### How can I download pictures attached to the tweets I've downloaded?
Downloading media isn't included in the default `twitter-academic-downloader` program (though it might in future), but that doesn't mean to say that you can't download it. I've written a script for doing just this:

[`download-media.sh`](https://github.com/sbrl/twitter-academic-downloader/blob/main/download-media.sh) ([direct link](https://raw.githubusercontent.com/sbrl/twitter-academic-downloader/main/download-media.sh))

It's designed for Linux systems - Windows users will need to use the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install). Start by downloading the script. Skip this step if you've cloned this git repository.

```bash
curl -OL https://raw.githubusercontent.com/sbrl/twitter-academic-downloader/main/download-media.sh
chmod +x download-media.sh; # Make it executable
```

The following dependencies are required to run the script. Installation commands are provided for `apt`-based systems - if you're isn't please translate commands for your system.

 - `awk` - for text processing - installed by default on most systems (if not, `sudo apt install gawk`)
 - [`jq`](https://stedolan.github.io/jq/) - for JSON handling - `sudo apt install jq`
 - [`deface`](https://github.com/ORB-HD/deface) - for blurring faces - `sudo python3 -m pip install deface`
 - [ImageMagick](https://imagemagick.org/) - for image handling - `sudo apt install imagemagick`

Optional dependencies:

 - [`jpegoptim`](https://github.com/tjko/jpegoptim) - For losslessly optimising the filesize of downloaded JPEGs to save disk space
 - [`oxipng`](https://github.com/shssoichiro/oxipng) - For losslessly optimising the filesize of downloaded PNGs to save disk space
     - Install <https://rustup.rs/> (no admin required), then do `cargo install oxipng` (CPU intensive)
     - Alternatively, install `optipng` instead - `sudo apt install optipng`
         - Not as good as `oxipng` and not multithreaded, but easier to install

The script will complain at you if you're missing a dependency. Read the error message it generates and this should tell you what you're missing.

To use the script, you must first create the directory to download media files into and `cd` into it. I'm calling it `media_files` for the purposes of this tutorial, but you can call it whatever you like and put it wherever you like (I recommend making sure you keep your downloaded data organised - it can quickly become a mess :P).

```bash
mkdir media_files
cd media_files
```

Then, do this to download the media files referenced by the given `tweets.jsonl` file into the current directory:

```bash
../download-media.sh path/to/tweets.jsonl
```

...where `path/to/tweets.jsonl` is the path to the `tweets.jsonl` file that `twitter-academic-downloader` has downloaded. `../download-media.sh` is the (relative or absolute, it doesn't matter) path to the script you downloaded earlier.

This script will:

 - Download all images marked as a `photo` referenced by the given `tweets.jsonl` file
 - If `jpegoptim` and/or `oxipng`/`optipng` are installed, losslessly optimise the size of all images downloaded
 - Blur all faces in all downloaded images
 - Strip the alpha channel from all downloaded images (`deface` doesn't like transparent images :-/)
 - Discard all invalid images
 - Discard all images that `deface` doesn't like (can't risk keeping any potentially non-anonymised images)

Note that while all invalid images are discarded, Tensorflow, Keras, and other frameworks have a much narrower view of what's a valid image than ImageMagick, jpegoptim, oxipng/optipng etc, so you'll still need to properly handle errors when loading images into your framework of choice.

Also note that any requests to remove automatic `deface` support for blurring images that do not suggest an alternative program for performing the same thing will be rejected because of aforementioned ethical concerns.

### But wait, I want to download videos attached to tweets too!
This is easily done, but it hasn't been implemented yet as I haven't yet needed that for my project. If you need this, please [open an issue](https://github.com/sbrl/twitter-academic-downloader/issues/new)! `deface` apparently supports videos, so this shouldn't be too difficult to add to `download-media.sh`.

### Why is it taking ages to download tweets / media?
Twitter implements a rate limiting policy, which `twitter-academic-downloader` must abide by. Consider using something like [GNU screen](https://www.gnu.org/software/screen/) to run jobs in the background.

Despite this, when downloading tweets `twitter-academic-downloader` does it's best to make as few requests as possible to get the job done as fast as possible. It downloads 100 tweets at a time (the max allowed consistently by Twitter's API consistently), and it also batches the download of replies to fill the query length limit for each request - and tweets with no replies listed in the data returned from the API aren't queued for the downloading for replies.

### Wow, that's a lot of asynchronous code. I want to extend / modify twitter-academic-downloader, but I don't understand it!
Ah, sorry about that! twitter-academic-downloader is heavily asynchronous because of the inherent complexities involved in the downloading process (see the answer directly above this one for an idea as to the complexities involved). Because the task is IO heavy, it lends itself rather well to being asyncified. If you have a specific question about the codebase, please do [open a discussion](https://github.com/sbrl/twitter-academic-downloader/discussions/2).

Do note though that to use twitter-academic-downloader, you do not need to understand the neither Javascript nor twitter-academic-downloader's codebase.


## Analysing the data
Useful commands and quick Bash one-liners. It is recommended that you are confident with Bash to use this section. If you aren't, please skip this section and continue reading the useful links,  contributing, and licence sections.

These commands may look long and complicated, but they really aren't. Some good resources on the subject:

 - [explainshell.com](https://explainshell.com/)
 - [Learn your terminal (or command line)](https://starbeamrainbowlabs.com/blog/article.php?article=posts/242-Learn-Your-Terminal.html) on [my blog](https://starbeamrainbowlabs.com/blog/)


### Extract only replies / non-replies
If you downloaded replies as well as the original tweets, they are all stored in the same file `tweets.jsonl`. There is, however, a way to distinguish between them with the `referenced_tweets` property.

Print only non-replies (beware, this also excludes original top-level tweets from the perspective of the original query you searched for that were themselves replies to other tweets):

```bash
jq --raw-output 'select(.referenced_tweets == null or ([ .referenced_tweets[].type ] | index("replied_to") == null))' <tweets.jsonl
```

Print only replies (as above, this includes original tweets captured by the search query that were replies to other tweets):

```bash
jq --raw-output 'select(.referenced_tweets != null) | select([ .referenced_tweets[].type ] | index("replied_to") != null)' <tweets.jsonl
```


### Plot a frequency graph
Run the following command:

```bash
cat tweets.jsonl | jq --raw-output .created_at | awk 'BEGIN { FS="T" } { print $1 }' | sort | uniq -c | sed -e 's/\s\s*/ /g' -e 's/^\s//g' | tr ' ' '\t' >frequencies.tsv
```

...replacing `tweets.jsonl` and `frequencies.tsv` with the input and output files respectively.

Then, open the resulting file in your favourite editor (e.g. Libreoffice Calc) to plot the graph (swap the columns around).

#### ....with sentiment

To plot it with positive/negative sentiment (AFTER labelling a given dataset, labeller is in [this repository](https://github.com/sbrl/research-smflooding.git)), do the following to generate a tab-separated values (TSV) file:

```bash
jq --raw-output '[ .created_at, .label ] | @tsv' < "path/to/tweets-labelled.jsonl" | awk '{ gsub("T.*", "", $1); print( $1 "\t" $2); }' | sort | uniq -c | awk 'BEGIN { OFS="\t"; printf("DATE\tPOSITIVE\tNEGATIVE"); } { date=$2; sent=$3; count=$1; if(date != last_date) print(last_date, acc_positive, acc_negative); if(sent == "positive") acc_positive=count; else acc_negative=$1; last_date=$2; }' > "path/to/sentiment.tsv";
```

...replacing `path/to/tweets-labelled.jsonl` with the path to your labelled tweets file, and `path/to/output_sentiment.tsv` with the path to the output file to create (or replace).

To do the same for multiple downloads at a time, save this as a script and `chmod +x` it:

```bash
#!/usr/bin/env bash

# This script generates a tab-separated values list of rows, 1 for each flood.
# For each flood, totals are calculated and the positive and negative sentiment
# are converted to percentages.

replies="${1:-yes}";

generate() {
	filename="${1}";
	
	# Environment variables:
	# 
	# replies		Whether replies should be included in the analysis or not [default: yes]
	
	dir="$(dirname "${filename}")";
	target="${dir}/$(basename "${dir}")-sentiment.tsv";
	
	jq_query_a="[ .created_at ] | @tsv";
	jq_query_b="[ .created_at, .label ] | @tsv";
	jq_query_noreply_filter="select(.referenced_tweets == null or ([ .referenced_tweets[].type ] | index(\"replied_to\") == null)) | ";
	if [[ "${replies}" == "no" ]]; then
		jq_query_a="${jq_query_noreply_filter}${jq_query_a}";
		jq_query_b="${jq_query_noreply_filter}${jq_query_b}";
	fi
	
	max_per_bin="$(jq --raw-output "${jq_query_a}" < "${filename}" | awk '{ gsub("T.*", "", $1); print($1); }' | sort | uniq -c | awk '{ print $1 }' | sort -nr | head -n1)";
	# echo "MAX_PER_BIN $filename is $max_per_bin";
	jq --raw-output "${jq_query_b}" < "${filename}" | awk '{ gsub("T.*", "", $1); print( $1 "\t" $2); }' | sort | uniq -c | awk -v "max_per_bin=${max_per_bin}" 'BEGIN { if(max_per_bin == "" || max_per_bin == "0") max_per_bin=1; acc_positive=0; acc_negative=0; OFS="\t"; print("DATE\tPOSITIVE\tNEGATIVE\tTOTAL\tTOTAL_NORM\tPERCENT_POSITIVE\tPERCENT_NEGATIVE\tPERCENT_TOTAL"); } { date=$2; sent=$3; count=$1; if(date != last_date && last_date != "") { total=acc_positive+acc_negative; if(total == 0) total=1; print(last_date, acc_positive, acc_negative, total, total/max_per_bin*100, acc_positive/total*100, acc_negative/total*100, 100); acc_positive=0; acc_negative=0; } if(sent == "positive") acc_positive=count; else acc_negative=$1; last_date=$2; }' > "${target}";	
	echo "DONE $filename";
}

export replies;
export -f generate;

find . -iname 'tweets-labelled.jsonl' -print0 | xargs -P "$(nproc)" -0 -I {} bash -c 'generate "{}"';
```

<!-- We have saved ours as research-data:twitter/sources/make-frequencies-sentiment.tsv -->

...and then `cd` to the directory containing the tweets in question, and then run it like this:

```bash
path/to/your_script.sh
```

Then, to generate a graph with [Gnuplot](http://gnuplot.info/), download [`sentiment-frequency.plt`](https://raw.githubusercontent.com/sbrl/twitter-academic-downloader/main/sentiment-frequency.plt) and run this:

```bash
gnuplot -e "graph_subtitle='YOUR_SUBTITLE'" -e "data_filename='path/to/sentiment.tsv'" -e "graph_title='YOUR_TITLE'" path/to/sentiment-frequency.plt >"graph.png";
```

Again, for multiple runs at once:

```bash
find . -iname '*sentiment.tsv' | while read -r filename; do title="$(basename "${filename}")"; title="${title%-sentiment.tsv}"; out="${filename%.*}.png"; gnuplot -e "graph_subtitle='YOUR_TITLE'" -e "data_filename='$filename'" -e "graph_title='$title'" path/to/sentiment-frequency.plt >"${out}"; done
```

#### ....for many datasets at once

```bash
#!/usr/bin/env bash

# Make a temporary directory [and delete it after we're done]
temp_dir="$(mktemp --tmpdir -d "twitter-frequencies-XXXXXXX")";
on_exit() { rm -rf "${temp_dir}"; }
trap on_exit EXIT;

# Get a frequency column for a single file
freq() { filepath="${1}"; echo "$(basename "$(dirname "${filepath}")")"; cat "${filepath}" | jq --raw-output .created_at | awk 'BEGIN { FS="T" } { print $1 }' | sort | uniq -c | awk '{print $1}'; }

export -f freq;
export temp_dir;

# Generate columns for all datasets in question
find . -type f -iname "tweets.jsonl" -print0 | xargs -0 -P "$(nproc)" -I {} bash -c 'filepath="{}"; freq "${filepath}" >"${temp_dir}/$(basename "$(dirname "${filepath}")").txt";';

readarray -t filepaths < <(find "${temp_dir}" -type f -iname '*.txt');
paste "${filepaths[@]}";
```


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
jq --raw-output '.created_at' <"StormDennis/tweets.jsonl" | xargs -n1 date +%s --date | sort -n | head -n1 | xargs -I {} date --rfc-3339=seconds --date @{}
```

For multiple files, do this:

```bash
find . -name 'tweets.jsonl' -print0 | xargs -I{} -P "$(nproc)" -0 bash -c 'in="{}"; echo -e "$(dirname "$in")\t$(jq --raw-output .created_at <"$in" | xargs -n1 date +%s --date | sort -n | head -n1 | xargs -I {} date --rfc-3339=seconds --date @{})";' | tee start-times-fixed.txt
```

To get the end date instead of the start date, change the `sort -n` to `sort -nr` (i.e. reverse the sort direction).


### Count positive/negative sentiment
AFTER you have labelled the dataset with the sentiment analysis tweet labeller [in a separate repository - link coming soon], then the sentiments can be tallied like so:

```bash
cat tweets-labelled.jsonl | jq --raw-output '.label' | sort | uniq -c | tr "\n" " "
```

For a directory of runs, you can mass-evaluate all of them at once like this:


```bash
find . -type f -iname 'tweets-labelled.jsonl' -print0 | xargs -I{} -0 bash -c 'echo -ne "$(basename "$(dirname "{}")")\t$(cat {} | jq --raw-output .label | sort | uniq -c | tr "\n" " ")\n";' | awk 'BEGIN { print("PLACE\tNEGATIVE\tPOSITIVE\tTOTAL\tNEGATIVE_PERCENT\tPOSITIVE_PERCENT\tORDER"); RS="\n"; OFS="\t"; } { total=$2+$4; if(total > 0) print($1, $2, $4, total, $2 / total*100, $4 / total*100, $3 "-" $5); else print($1, 0, 0, 0); }'
```

If you'd like to filter out replies (see "extract only replies" above for caveats), do this instead:

```bash
cat tweets-labelled.jsonl | jq --raw-output 'select(.referenced_tweets == null or ([ .referenced_tweets[].type ] | index(\"replied_to\") == null)) | .label' | sort | uniq -c | tr "\n" " "
```

To filter out replies for a directory of runs:

```bash
find . -type f -iname 'tweets-labelled.jsonl' -print0 | xargs -I{} -0 bash -c 'echo -ne "$(basename "$(dirname "{}")")\t$(cat {} | jq --raw-output '"'select(.referenced_tweets == null or ([ .referenced_tweets[].type ] | index(\"replied_to\") == null)) | .label'"' | sort | uniq -c | tr "\n" " ")\n";' | awk 'BEGIN { print("PLACE\tNEGATIVE\tPOSITIVE\tTOTAL\tNEGATIVE_PERCENT\tPOSITIVE_PERCENT\tORDER"); RS="\n"; OFS="\t"; } { total=$2+$4; if(total > 0) print($1, $2, $4, total, $2 / total*100, $4 / total*100, $3 "-" $5); else print($1, 0, 0, 0); }'
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
