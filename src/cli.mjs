"use strict";

import path from 'path';
import fs from 'fs';

import CliParser from 'applause-cli';

import l from './lib/io/Log.mjs';
import a from './lib/io/Ansi.mjs';

const __dirname = import.meta.url.slice(7, import.meta.url.lastIndexOf("/"));

async function load_subcommands(cli) {
	let dirs = await fs.promises.readdir(path.join(__dirname, "subcommands"));
	for(let dir of dirs) {
		(await import(path.join(__dirname, "subcommands", dir, `meta.mjs`))).default(cli);
	}
}

export default async function () {
	let cli = new CliParser(path.resolve(__dirname, "../package.json"))
		cli.argument("verbose", "Enable verbose debugging output", null, "boolean");
	
	await load_subcommands(cli);
	
	let settings_cli = cli.parse(process.argv.slice(2));
	
	if(cli.current_subcommand == null)
		cli.write_help_exit();
	
	let subcommand_file = path.join(
		__dirname,
		"subcommands",
		cli.current_subcommand,
		`${cli.current_subcommand}.mjs`
	);
	
	if(!fs.existsSync(subcommand_file)) {
		l.error(`Error: The subcommand '${cli.current_subcommand}' doesn't exist (try --help for a list of subcommands and their uses).`);
		process.exit(1);
	}
	
	let settings = (await import("./settings.mjs")).default;
	settings.cli = settings_cli;
	console.log(settings);
	
	try {
		await (await import(subcommand_file)).default();
	}
	catch(error) {
		console.error();
		if(settings.cli.verbose) {
			l.error(error);
		}
		else {
			console.error(`${a.fred}${a.hicol}${error.message}${a.reset}`);
		}
		process.exit(1);
		throw error;
	}
}