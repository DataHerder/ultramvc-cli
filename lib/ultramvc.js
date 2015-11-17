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
	fs = require('fs'),
	argv = require('yargs').argv,
	Template = require('./Template.js'),
	github_repo = "https://github.com/DataHerder/UltraMVC",
	exec = require('child_process').exec,
	mkdirp = require('mkdirp'),
	rimraf = require('rimraf'),
	mv = require('mv'),
	dependencies = {
		'Library/Framework/SqlBuilder': 'https://github.com/DataHerder/Sql-Build'
	};



try {
	if (argv._.length < 2) {
		if ((argv._.length == 1 && (argv._[0] == '?' || argv._[0] == 'help')) || (argv.h || argv.help)) {
			help();
			process.exit();
		} else {
			throw new Error('Error: ultramvc expects parameters');
		}
	}
	var TOP_DIRECTIVE = argv._[0],
		TOP_VALUE = argv._[1],
		FLAG_SKIP_ROLLBACK = (argv.r || argv.rollback) || false,
		TOP_VERBOSE = (argv.v || argv.verbose) || false
	;

	if (TOP_DIRECTIVE == 'new') {
		try {
			new_project(TOP_VALUE, TOP_VERBOSE);
		} catch (e) {
			console.log(e.message.red.bold);
			if (!argv.r && !argv.rollback) {
				rollback(TOP_VALUE);
			}
		}
	} else if (TOP_DIRECTIVE == 'create') {
		try {
			create(TOP_VALUE, argv._[2]);
		} catch (e) {
			console.log(e.message.red.bold);
		}
	} else if (TOP_DIRECTIVE == 'update') {
		try {
			update(TOP_VALUE, argv._.slice(2));
		} catch (e) {
			console.log(e.message.red.bold);
		}
	} else {
		throw new Error('Unknown directive type, please access help or type "ultramvc ?"');
	}
} catch (e) {
	console.log(e.message.red.bold);
}



function mkdirp_q(directory_name)
{
	var defer = q.defer();
	mkdirp(directory_name, function(err) {
		if (err) {
			defer.reject(err);
		} else {
			defer.resolve('success');
		}
	});
	return defer.promise;
}

function rmdir(directory_name)
{
	var defer = q.defer();
	rimraf(directory_name, function(err) {
		if (err) {
			defer.reject(err);
		} else {
			defer.resolve('success');
		}
	});
	return defer.promise;
}

function update(update_which, args)
{
	var uw = update_which || '',
		argv = args || []
	;

	if (uw == 'library') {
		var directory_name = '.__ultra__dev/ultra-update';
		// now we update the library to the latest repo without
		if (isDirectory(directory_name)) {
			var go = rmdir(directory_name);
		} else {
			// sim q
			var d = q.defer();
			go = d.promise;
			d.resolve('success');
		}

		go.then(function() {
			mkdirp_q('.__ultra_archive__')
				.then(function (resp) {
					return mkdirp_q('.__ultra__dev');
				}).then(function (resp) {
					cloneRepo(directory_name + ':::' + github_repo).then(function() {
						console.log('Successfully loaded main framework'.green.bold);
						var paths = [];
						for (var j in dependencies) {
							paths.push(directory_name + '/' + j + ':::' + dependencies[j])
						}
						q.all(paths.map(cloneRepo)).then(function () {
							console.log("Successfully downloaded UltraMVC update");
							console.log('Updating .... ');
							// first archive and move the Library folder
							// console.log('hi');
							var archive_location = '.__ultra_archive__/Library_backup_' + (new Date()).toMysqlFormat().replace(/\D/g,'');
							mv('Library', archive_location, function (err) {
								if (err) {
									throw new Error(err);
								}
								console.log('Finished backup file at: ' + archive_location);
								mv(directory_name + '/Library', 'Library', function (err) {
									if (err) {
										console.log(err);
									} else {
										console.log('Finished updating!!');
									}
								});
							});
						}).catch(function (err) {
							console.log('There was an error fetching the repo: '.red.bold + err[0].red.bold);
						});
					}).catch(function (err) {
						console.log(err);
					});
				});
		}).catch(function(err) {
			throw new Error(err);
		});

	} else {
		throw new Error('Invalid update type: library is only supported');
	}
}




/**
 * The Function for Creating
 *
 * @param create_type
 * @param create_name
 */
function create(create_type, create_name)
{
	// first check that we have a valid
	checkValidDirectory();
	var name = create_name.charAt(0).toUpperCase() + create_name.slice(1);
	let Tmp = new Template();

	if (create_type == 'controller' || create_type == 'model') {

		// if does not exist
		var namespace_area = create_type.charAt(0).toUpperCase() + create_type.slice(1);
		var full_namespace = ('Application\\' + namespace_area + 's\\' + create_name.replace(/\//g, '\\')).split('\\');

		// check for full path
		var namespace_regex = new RegExp('^/?Application/' + namespace_area), full_found = false;
		if (namespace_regex.test(create_name)) {
			full_namespace = (create_name.replace(/^\//, '').replace(/\//g, '\\')).split('\\');
			full_found = true;
		}

		var old_namespace = full_namespace.slice();
		var func_name = full_namespace.pop();

		if (isFile(old_namespace.join('/') + '.php')) {
			throw new Error('You have already specified this ' + create_type + '.  Go to ' + old_namespace.join('/') + '.php');
		} else if (isFile(full_namespace.join('/') + '.php')) {
			// the file already exists, add
			// throw new Error('Hey we need to update this part of the **');
			// so here we add to the file
			var full_file = fs.readFileSync(full_namespace.join('/') + '.php', 'utf8').trim();
			var view_name = full_namespace.slice();
			view_name.shift();
			view_name.shift();
			Template.getPartial(create_type).then(function(partial_code) {
				var partial = Template.parseTemplate({
					'func_name': munge_func_name(func_name),
					'view_name': view_name.join('/')
				}, partial_code);
				// TODO - GREATLY INCREASE THIS ALGO
				// this is going to be hectic if more code is added in the controller which will most likely
				// happen so the algorithm WILL NEED TO BE CHANGED HERE
				var new_file = full_file.replace(/\}$/, partial + '}');
				fs.writeFile(full_namespace.join('/') + '.php', new_file, function(err) {
					if (err) {
						throw new Error(err.message);
					}
					console.log('Added new public function to controller ' + full_namespace.join('/') + '.php');
				})
			}).catch(function(err) {
				throw new Error(err);
			});
		} else {
			var full_namespace_string = full_namespace.join('\\');
			var class_name = create_name.split('/').pop();
			class_name = class_name.charAt(0).toUpperCase() + class_name.slice(1);
			Tmp.getTemplate(create_type).then(function(data) {
				var template = Template.parseTemplate({
					'namespace': full_namespace_string,
					'class_name': class_name
				}, data);
				fs.writeFile(full_namespace.join('/') + '/' + func_name + '.php', "<?php\n\n" + template, function(err) {
					if (err) {
						throw new Error(err);
					} else {
						console.log('Created new controller! You can find it here: ' + full_namespace.join('/') + '/' + func_name + '.php');
					}
				});
			});
		}

	} else {
		throw new Error('create type ' + create_type + ' is not supported.  Please see help.');
	}
}


function munge_func_name(func_name)
{
	var fn = func_name || '';
	return fn.replace(/-/, '_').toLowerCase();
}


/**
 * Is File
 *
 * @param file_name
 * @returns {boolean}
 */
function isFile(file_name)
{
	try {
		if (fs.lstatSync(file_name).isFile()) {
			return true;
		}
	} catch (e) {
		return false;
	}
}

/**
 *
 * @param directory_name
 * @returns {boolean}
 */
function isDirectory(directory_name)
{
	try {
		if (fs.lstatSync(directory_name).isDirectory()) {
			return true;
		}
	} catch (e) {
		return false;
	}
}


function checkValidDirectory()
{
	try {
		if (!fs.lstatSync('Library/UltraMVCBootstrap.php').isFile()) {
			return false;
		}
	} catch (e) {
		throw new Error('Not a UltraMVC directory.  Please navigate to your application\'s root directory.');
	}
}

function rm(file_name)
{
	var d = q.defer();
	remove(file_name, function(err) {
		if (err) {
			d.reject(err);
		} else {
			d.resolve('success');
		}
	});
	return d.promise;
}



/**
 *
 * @param directory_name
 * @param augment_project
 */
function new_project(directory_name, augment_project)
{
	var d = directory_name || false,
		ag = augment_project || false
	;

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
			if (!FLAG_SKIP_ROLLBACK) {
				rollback(directory_name);
			}
		});
	}).catch(function(err) {
		console.log("Error fetching repo".red.bold);
		if (!FLAG_SKIP_ROLLBACK) {
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

	console.log('Loading: ' + dep_name);

	var defer = q.defer();
	nodegit.Clone(github_repo, path, {remoteCallbacks: {certificateCheck: function() {
		return 1;
	}}}).then(function() {
		// remove the github repository
		if (dep_name == 'UltraMVC') {
			remove(path + '/README.md', function(err) {
				if (err) {
					throw new Error('Unable to remove .git repo');
				} else {
					exec('touch ' + path + '/README.md', function(err) {
						if (err) {
							console.log('Unable to initiate README file');
						}
					});
				}
				remove(path + '/.git', function(err) {
					if (err) {
						console.log(err);
					}
				});
			});
		}
		defer.resolve('Success');
	}).catch(function(err) {
		defer.reject([dep_name, err]);
	});
	return defer.promise
}



Date.prototype.toMysqlFormat = function() {
	return(
		this.getFullYear() + "-" +
		twoDigits(1 + this.getMonth()) + "-" +
		twoDigits(this.getDate()) + " " +
		twoDigits(this.getHours()) + ":" +
		twoDigits(this.getMinutes()) + ":" +
		twoDigits(this.getSeconds())
	);
	function twoDigits(d) {
		if(0 <= d && d < 10) return "0" + d.toString();
		if(-10 < d && d < 0) return "-0" + (-1*d).toString();
		return d.toString();
	}
};
