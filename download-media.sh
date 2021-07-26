#!/usr/bin/env bash

target="${1:--}";

if [[ "${target}" == "--help" ]]; then
	echo "download-media.sh
	By Starbeamrainbowlabs

This script downloads media from twitter data that has been downloaded with the main twitter-academic-downloader program into the current working directory.

Usage:
	path/to/download-media.sh [<tweets_filepath>]

....where:
	<tweets_filepath>	is the path to the file contianing the JSON-formatted tweets to analyse (defaults to reading from the standard input).

";
	exit 0;
fi

###############################################################################

check_command() {
	if ! which $1 >/dev/null 2>&1; then
		echo -e "Error: Couldn't locate $1. Make sure it's installed and in your path.";
		exit 1;
	fi
}
command_exists() {
	if which $1 >/dev/null 2>&1; then return 0; else return 1; fi
}

###############################################################################

check_command curl;
check_command jq;
check_command awk;
check_command deface;
check_command mogrify;

optimise_png_binary=oxipng;
optimise_png_flags="-omax -Dp --fix";
optimise_jpeg_binary=jpegoptim;
if ! command_exists jpegoptim; then
	echo "jpegoptim not detected, not optimising JPEG images" >&2;
	unset optimise_jpeg_binary;
fi
if ! command_exists oxipng; then
	if command_exists optipng; then
		echo "Using optipng instead of oxipng. For better performance, please install oxipng: <https://github.com/shssoichiro/oxipng>.";
		optimise_png_binary=optipng;
		optimise_png_flags="-preserve";
	else
		unset optimise_png_binary;
		echo "Neither oxipng (preferred) or optipng (fallback) could be found - not optimising PNG images";
	fi
fi

delay="1";	# The delay between requests - in seconds
curl_user_agent="twitter-academic-downloader (Bash; $(uname) $(arch); +https://www.npmjs.com/package/twitter-academic-downloader) curl/$(curl --version | awk '{ print $2; exit }')";

downloaded_count="0";

###############################################################################

# Extracts the URLs from tweet JSON objects read from stdin.
extract_urls() {
	jq --raw-output 'select(.media != null) | .media[] | select(.type == "photo") | .url'
}

# Optimises a single image file.
optimise_image() {
	filepath="${1}";
	extension="${filepath##*.}";
	case "${extension}" in
		jpeg|jpg|JPEG|JPG )
			if [[ -z "${optimise_jpeg_binary}" ]]; then return 0; fi
			"${optimise_jpeg_binary}" --all-progressive --preserve "${filepath}";
			;;
		png|PNG )
			# Strip all alpha - deface doesn't like transparent PNGs apparently
			mogrify -background white -alpha remove -alpha off "${filepath}";
			if [[ -z "${optimise_jpeg_binary}" ]]; then return 0; fi
			"${optimise_png_binary}" ${optimise_png_flags} "${filepath}";
			;;
		* )
			echo "Warning: Unknown file extension for '${filepath}', not optimising" >&2;
			return 0;
			;;
	esac
}

# Downloads a single item to the current directory - but only if the filename doesn't already exist.
# $1	The URL of the image to download.
download_single() {
	local url; local filename;
	local time_start; local time_elapsed;
	local time_to_wait;
	
	url="${1}";
	filename="$(basename "${url}")";
	
	# Don't download things twice
	if [[ -e "${PWD}/${filename}" ]]; then return 0; fi
	
	# Download the image
	# By default an exponential backoff algorithm is used
	# curl will also comply with the Retry-After HTTP header.
	curl --retry 7 --user-agent "${curl_user_agent}" -sSL "${url}" -o "${filename}";
	
	
	time_start="$(date +%s%N)"; # nanoseconds
	
	deface -o "${filename}" "${filename}";	# Blur faces
	optimise_image "${filename}";			# Optimise the image to reduce filesize
	
	downloaded_count="$((downloaded_count + 1))";
	echo -ne "${downloaded_count} downloaded so far; latest: ${url}\r";
	
	# Calculate the time remaining we need to wait before making the next request
	time_elapsed="$((($(date +%s%N) - time_start) / 1000000))";
	time_to_wait="$(jq -n "${delay} - (${time_elapsed} / 1000)")";
	
	# If we took longer than 1 second, return immediately
	if [[ "${time_to_wait}" == *-* ]]; then return 0; fi
	
	sleep "${time_to_wait}";
}

download_images() {
	while read -r url; do
		download_single "${url}";
	done
}

do_download() {
	extract_urls | download_images;
}


if [[ "${target}" == "-" ]]; then
	do_download;
else
	do_download <"${target}";
fi
