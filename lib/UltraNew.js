"use strict";

var UltraLib = require('./UltraLib.js'),
	//nodegit = require("nodegit"),
	q = require('q'),
	remove = require('remove')
;

/**
 *
 * @type {UltraNew}
 */
var UltraNew = class UltraNew {
	constructor() {}

	/**
	 *
	 * @param directory_name
	 * @param augment_project
	 */
	static project(directory_name, augment_project)
	{
		var d = directory_name || false,
			ag = augment_project || false
			;

		if (typeof d !== 'string' || d === false) {
			throw new Error('Not a valid directory name.');
		}

		UltraLib.cloneRepo(directory_name + ':::' + UltraLib.github_repo).then(function(repo) {
			console.log('Successfully loaded main framework'.green.bold);
			var paths = [];
			for (var j in UltraLib.dependencies) {
				paths.push(directory_name + '/' + j + ':::' + UltraLib.dependencies[j])
			}
			q.all(paths.map(UltraLib.cloneRepo)).then(function() {
				console.log("Successfully created new UltraMVC application: " + directory_name);
			}).catch(function(err) {
				console.log('There was an error fetching the repo: '.red.bold + err[0].red.bold);
				console.log(err[1]);
				if (!FLAG_SKIP_ROLLBACK) {
					UltraNew.rollback(directory_name);
				}
			});
		}).catch(function(err) {
			console.log("Error fetching repo ".red.bold + err[0].red.bold);
			console.log(err);
			if (!FLAG_SKIP_ROLLBACK) {
				UltraNew.rollback(directory_name);
			}
		});
	}

	static rollback(top_level_dir)
	{
		remove(top_level_dir, function(err) {
			if (err) {
				console.log('Rollback unsuccessful');
			} else {
				console.log('Rollback complete');
			}
		});
	}
};

module.exports = UltraNew;