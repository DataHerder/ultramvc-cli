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
var github_repo = "https://github.com/DataHerder/UltraMVC";
// console.log(user_args);
if (user_args[0] == 'new') {
	var directory_name = user_args[1];

	var path = directory_name;
	nodegit.Clone(
		github_repo,
		path,
		{
			remoteCallbacks: {
				certificateCheck: function() {
					return 1;
				}
			}
		}
	).then(function(repo) {
		console.log("Successfully created new UltraMVC application: " + directory_name);
	}).catch(function(err) {
		console.log("Error fetching repo");
	});
}