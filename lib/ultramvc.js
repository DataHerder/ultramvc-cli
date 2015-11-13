#!/usr/bin/env node

/*
 * ultramvc
 * https://github.com/DataHerder/ultramvc-cli
 *
 * Copyright (c) 2015 Paul Carlton
 * Licensed under the MIT license.
 */

'use strict';

var user_args = process.argv.slice(2);
var nodegit = require("nodegit");
var q = require("q");
var github_repo = "https://github.com/DataHerder/UltraMVC";
var dependencies = {
	'Library/Framework/SqlBuilder': 'https://github.com/DataHerder/Sql-Build'
}

if (user_args[0] == 'new') {
	var directory_name = user_args[1];
	var path = directory_name;
	cloneRepo(path + ':::' + github_repo).then(function(repo) {
		console.log('Successfully loaded main framework');
		var paths = []
		for (var j in dependencies) {
			paths.push(directory_name + '/' + j + ':::' + dependencies[j])
		}
		q.all(paths.map(cloneRepo)).then(function() {
			console.log("Successfully created new UltraMVC application: " + directory_name);
		}).catch(function(err) {
			console.log(err);
		});
	}).catch(function(err) {
		console.log("Error fetching repo");
	});
}

function rollback()
{

}

function cloneRepo(path_and_repo)
{
	var tmp = path_and_repo.split(':::');
	var path = tmp[0];
	var github_repo = tmp[1];
	var dep_name = github_repo.split('/').pop();
	console.log('Loading dependency: ' + dep_name)
	return nodegit.Clone(github_repo, path, {remoteCallbacks: {certificateCheck: function() {
		return 1;
	}}});
}