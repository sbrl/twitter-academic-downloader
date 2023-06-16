#!/usr/bin/env bash

target_dir="${1}";
flag="${2}";

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

mv_safe() {
	source="$1";
	target="$2";
	
	if [[ -z "$source" ]]; then
		echo "mv_safe error: no source file specified." >&2;
		return 1;
	fi
	if [[ -z "$target" ]]; then
		echo "mv_safe error: no target file specified." >&2;
		return 1;
	fi
	if [[ ! -e "$source" ]]; then
		echo "mv_safe error: the source file doesn't exist." >&2;
		return 2;
	fi
	if [[ -s "$source" ]]; then
		echo "mv_safe error: refusing to move empty source file." >&2;
		return 3;
	fi
	
	mv -f "${source}" "${target}";
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
exit_code="$?";
echo -n "places:";
if [[ "$exit_code" -ne 0 ]]; then
	echo "error code $exit_code while sorting.";
else
	display_ratio "places.jsonl" "places-unique.jsonl";
	mv_safe places-unique.jsonl places.jsonl;
fi


jq --slurp -c 'unique_by(.id) | .[]' <users.jsonl >users-unique.jsonl;
exit_code="$?";
echo -n "users:";
if [[ "$exit_code" -ne 0 ]]; then
	echo "error code $exit_code while sorting.";
else
	display_ratio "users.jsonl" "users-unique.jsonl";
	mv_safe users-unique.jsonl users.jsonl;
fi

if [[ "${flag}" != "notweets" ]]; then
	jq --slurp -c 'unique_by(.id) | .[]' <tweets.jsonl >tweets-unique.jsonl;
	exit_code="$?";
	echo -n "tweets:";
	if [[ "$exit_code" -ne 0 ]]; then
		echo "error code $exit_code while sorting.";
	else
		display_ratio "tweets.jsonl" "tweets-unique.jsonl";
		mv_safe tweets-unique.jsonl tweets.jsonl;
	fi
fi