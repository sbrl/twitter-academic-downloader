#!/usr/bin/env bash

target_dir="${1}";

if [[ -z "${target_dir}" ]]; then
	echo "Error: No target directory specified." >&2;
	exit 1;
fi

if ! which jq >/dev/null 2>&1; then
	echo "Error: jq not found in PATH. Is it installed correctly?" >&2;
	echo "Try 'sudo apt install jq', or downloading jq from <https://stedolan.github.io/jq/download/> and then doing export PATH=\$PATH:path/to/dir, where path/to/dir is the direcotry you downloaded jq to.";
fi

cd "${target_dir}" || { echo "Error: Failed to cd to target_dir '${target_dir}'"; exit 1; };

###############################################################################

get_length() {
	target="${1}";
	if [[ -z "${target}" ]]; then
		echo "[get_length] Error: No target specified." >&2;
		return 1;
	fi
	
	wc -l "${target}" | cut -d' ' -f1;
}

display_ratio() {
	a="${1}";
	b="${2}";
	
	if [[ -z "${a}" ]]; then
		echo "[display_ratio] Error: No source file specified." >&2;
		return 1;
	fi
	if [[ -z "${b}" ]]; then
		echo "[display_ratio] Error: No target file specified." >&2;
		return 1;
	fi
	
	length_a="$(get_length "${a}")";
	length_b="$(get_length "${b}")";
	
	dupes_removed="$((length_a-length_b))";
	echo "${length_a} → ${length_b}: ${dupes_removed} dupes removed ($(printf '%.2f' "$(echo "scale=9; (${dupes_removed}/${length_a})*100" | bc)")%)"
}

###############################################################################

jq --slurp -c 'unique_by(.id) | .[]' <places.jsonl >places-unique.jsonl;
echo -n "places:";
display_ratio "places.jsonl" "places-unique.jsonl";

rm places.jsonl;
mv places-unique.jsonl places.jsonl;


jq --slurp -c 'unique_by(.id) | .[]' <users.jsonl >users-unique.jsonl;
echo -n "users:";
display_ratio "users.jsonl" "users-unique.jsonl";

rm users.jsonl;
mv users-unique.jsonl users.jsonl;


jq --slurp -c 'unique_by(.id) | .[]' <tweets.jsonl >tweets-unique.jsonl;
echo -n "tweets:";
display_ratio "tweets.jsonl" "tweets-unique.jsonl";

rm tweets.jsonl;
mv tweets-unique.jsonl tweets.jsonl;
