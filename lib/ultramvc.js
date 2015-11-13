#!/usr/bin/env node

/*
 * ultramvc
 * https://github.com/DataHerder/ultramvc-cli
 *
 * Copyright (c) 2015 Paul Carlton
 * Licensed under the MIT license.
 */

'use strict';

var nodegit = require("nodegit"),
	help = require('./ultrahelp.js'),
	remove = require("remove"),
	colors = require('colors'),
	q = require("q"),
	argv = require('yargs').argv,
	github_repo = "https://github.com/DataHerder/UltraMVC",
	dependencies = {
		'Library/Framework/SqlBuilder': 'https://github.com/DataHerder/Sql-Build'
	};



try {
	if (argv._.length < 2) {
		if ((argv._.length == 1 && (argv._[0] == '?' || argv._[0] == 'help')) || (argv.h || argv.help)) {
			help();
			return;
		} else {
			throw new Error('Error: ultramvc expects parameters');
		}
	}
	var TOP_DIRECTIVE = argv._[0],
		TOP_VALUE = argv._[1],
		FLAG_ROLLBACK = (argv.r || argv.rollback) || false;

	if (TOP_DIRECTIVE == 'new') {
		try {
			new_project(TOP_VALUE);
		} catch (e) {
			console.log(e.message.red.bold);
			if (!argv.r && !argv.rollback) {
				rollback(TOP_VALUE);
			}
		}
	}
} catch (e) {
	console.log(e.message.red.bold);
}


/**
 *
 * @param directory_name
 */
function new_project(directory_name)
{
	var d = directory_name || false;
	if (typeof d !== 'string' || d === false) {
		throw new Error('Not a valid directory name.');
	}

	cloneRepo(directory_name + ':::' + github_repo).then(function(repo) {
		console.log('Successfully loaded main framework'.green.bold);
		var paths = [];
		for (var j in dependencies) {
			paths.push(directory_name + '/' + j + ':::' + dependencies[j])
		}
		q.all(paths.map(cloneRepo)).then(function() {
			console.log("Successfully created new UltraMVC application: " + directory_name);
		}).catch(function(err) {
			console.log('There was an error fetching the repo: '.red.bold + err[0].red.bold);
			console.log(err[1]);
			if (!argv.r && !argv.rollback) {
				rollback(directory_name);
			}
		});
	}).catch(function(err) {
		console.log("Error fetching repo".red.bold);
		if (!argv.r && !argv.rollback) {
			rollback(directory_name);
		}
	});
}


/**
 *
 * @param top_level_dir
 */
function rollback(top_level_dir)
{
	remove(top_level_dir, function(err) {
		if (err) {
			console.log('Rollback unsuccessful');
		} else {
			console.log('Rollback complete');
		}
	});
}


/**
 *
 * @param path_and_repo
 * @returns {*|promise}
 */
function cloneRepo(path_and_repo)
{
	var tmp = path_and_repo.split(':::');
	var path = tmp[0];
	var github_repo = tmp[1];
	var dep_name = github_repo.split('/').pop();

	console.log('Loading dependency: ' + dep_name);

	var defer = q.defer();
	nodegit.Clone(github_repo, path, {remoteCallbacks: {certificateCheck: function() {
		return 1;
	}}}).then(function() {
		defer.resolve('Success');
	}).catch(function(err) {
		defer.reject([dep_name, err]);
	});
	return defer.promise
}