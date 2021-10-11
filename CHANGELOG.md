# Changelog
This is the changelog for [`twitter-academic-downloader`](https://npmjs.org/package/twitter-academic-downloader).


Release template text:

-----

Install or update from npm:

```bash
npm install --save twitter-academic-downloader
```

-----


## v1.3.1 (unreleased)
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
