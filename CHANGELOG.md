# Changelog
This is the changelog for [`twitter-academic-downloader`](https://npmjs.org/package/twitter-academic-downloader).


Release template text:

-----

Install or update from npm:

```bash
npm install --save twitter-academic-downloader
```

-----


## v1.4.1 (unreleased)
 - Update dependencies
 - Update FAQ with section on downloading media
 - Add `TIME_DOWNLOADED` to output file `properties.tsv`
 - Remove `dynamic flood mapping` from user agent string


## v1.4
 - Really fix `--no-replies` not doing anything
 - Ensure tweets are actually unique in `post-process.sh`
 - Add new `properties.tsv` output artefact, which contains useful info about that downloading run:
     - Original search query
     - Set set/end dates
     - Calculated start/end dates based on tweets downloaded


## v1.3.1
 - Bugfix: Fix `--no-replies` argument to the `download` subcommand, which previously had no effect


## v1.3
 - Bugfix: Properly strip old-style retweets that start with `RT `


## v1.2
 - Also download, process, & anonymise attached media


## v1.1.1
 - Default to 100 tweets per request, because we request `context_annotations`


## v1.1
 - Update broken URLs in README & package.json
 - Also download attached media data


## v1.0
 - Initial release!
