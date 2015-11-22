#!/usr/bin/env node

/*
 * ultramvc
 * https://github.com/DataHerder/ultramvc-cli
 *
 * Copyright (c) 2015 Paul Carlton
 * Licensed under the MIT license.
 */

'use strict';

var UltraNew = require('./UltraNew.js'),
	UltraLib = require('./UltraLib.js'),
	UltraCreate = require('./UltraCreate.js'),
	UltraUpdate = require('./UltraUpdate.js'),
	colors = require('colors'),
	argv = require('yargs').argv,
	q = require('q'),
	remove = require('remove')
;



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
			UltraNew.project(TOP_VALUE, TOP_VERBOSE);
		} catch (e) {
			console.log(e.message.red.bold);
			if (!argv.r && !argv.rollback) {
				rollback(TOP_VALUE);
			}
		}
	} else if (TOP_DIRECTIVE == 'create' || TOP_DIRECTIVE == 'add') {
		try {
			UltraCreate.create(TOP_VALUE, argv._[2])
		} catch (e) {
			console.log(e.message.red.bold);
		}
	} else if (TOP_DIRECTIVE == 'update') {
		try {
			UltraUpdate.update(TOP_VALUE, argv._.slice(2));
		} catch (e) {
			console.log(e.message.red.bold);
		}
	} else {
		throw new Error('Unknown directive type, please access help or type "ultramvc ?"');
	}
} catch (e) {
	console.log(e.message.red.bold);
}


function munge_func_name(func_name)
{
	var fn = func_name || '';
	return fn.replace(/-/, '_').toLowerCase();
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
