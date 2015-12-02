"use strict";

var nodegit = require("nodegit"),
	q = require('q'),
	remove = require('remove'),
	exec = require('child_process').exec,
	fs = require('fs'),
	mkdirp = require('mkdirp'),
	rimraf = require('rimraf')
;

/**
 *
 * @type {UltraLib}
 */
var UltraLib = class UltraLib {
	constructor() {}

	static get github_repo() {
		return "https://github.com/DataHerder/UltraMVC";
	}

	static get dependencies() {
		return {
			'Application/Modules/SqlBuilder': 'https://github.com/DataHerder/Sql-Build'
		};
	}

	/**
	 *
	 * @param path_and_repo
	 * @returns {*|promise}
	 */
	static cloneRepo(path_and_repo)
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

	static checkValidDirectory()
	{
		try {
			if (!fs.lstatSync('Library/UltraMVCBootstrap.php').isFile()) {
				return false;
			}
		} catch (e) {
			throw new Error('Not a UltraMVC directory.  Please navigate to your application\'s root directory.');
		}
	}


	static isFile(file_name)
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
	static isDirectory(directory_name)
	{
		try {
			if (fs.lstatSync(directory_name).isDirectory()) {
				return true;
			}
		} catch (e) {
			return false;
		}
	}


	/**
	 *
	 * @param directory_name
	 * @returns {*}
	 */
	static mkdirp_q(directory_name)
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


	/**
	 *
	 * @param directory_name
	 * @returns {*}
	 */
	static rmdir(directory_name)
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


	/**
	 *
	 * @param func_name
	 * @returns {string}
	 */
	static munge_func_name(func_name)
	{
		var fn = func_name || '';
		return fn.replace(/-/, '_').toLowerCase();
	}

};



module.exports = UltraLib;