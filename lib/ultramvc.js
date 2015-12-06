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


var fs = require('fs');
var UltraAdd = class UltraAdd {
	static dependency() {

	}


	static _watchScripts(scripts) {
		//var obj = JSON.parse(fs.readFileSync('ultramvc.json'));
		//console.log(obj['watch']['script']);
		//for (var j = 0; j < scripts.length; j++) {
		//	if (UltraLib.isFile(scripts[j])) {
		//		if (obj['watch']['script'].indexOf(scripts[j]) < 0) {
		//			console.log('Adding: ' + scripts[j]);
		//			obj['watch']['script'].push('./' + scripts[j]);
		//		}
		//	}
		//}
		//fs.writeFileSync('./ultramvc.json', JSON.stringify(obj, null, 2));

		var obj = JSON.parse(fs.readFileSync('ultramvc.json'));
		console.log(obj['watch']['script']);
	}


	/**
	 *
	 * @param args
	 */
	static watch(args) {
		var obj = JSON.parse(fs.readFileSync('ultramvc.json'));
		if (args[0] != 'scripts' && args[0] != 'sass') {
			throw new Error('Unfortunately no other automated watches other than scripts and sass is allowed at this point.');
		} else {
			let new_obj = JSON.parse(JSON.stringify(obj));
			var _type = obj['watch'][args[0]], found = false;
			for (var j = 0; j < _type.length; j++) {
				var script_name = _type[j][0];
				script_name = this._formatName(script_name);
				if (script_name == this._formatName(args[1])) {
					console.log('Already found file to watch:' + args[1]);
					found = true;
				}
			}
			if (!found) {
				if (args[2] == undefined) {
					throw new Error(
						'What files to watch is required.  Ie: \n`ultramvc add watch ' +
						args[0] +
						' destination_file file_to_watch_1 file_to_watch_2`'
					);
				}

				var the_rest = args.slice(2), destination;
				if (args[0] == 'scripts') {
					destination = './resources/app/js';
				} else if (args[0] == 'sass') {
					destination = './resources/app/css';
				}
				var new_args = [
					'./' + this._formatName(args[1]),
					destination,
					the_rest
				];
				new_obj['watch'][args[0]].push(new_args);
			}
			fs.writeFileSync('./ultramvc.json', JSON.stringify(new_obj, null, 2));
		}
	}


	static _rollYourOwn(append, arg) {
		for (var j in arg) {
			if (Array.isArray(arg[j])) {
				console.log('hi');
				console.log(arg[j]);
			} else if (typeof arg[j] == 'object') {
				//append[j] = this._rollYourOwn({}, arg[j]);
			} else {
				//append[j] = arg[j]
			}
		}
		return append;
	}


	static _formatName(name) {
		try {
			return name.toString().replace(/^\.\//, '');
		} catch (e) {
			return '';
		}
	}

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
			UltraNew.project(TOP_VALUE, TOP_VERBOSE);
		} catch (e) {
			console.log(e.message.red.bold);
			if (!argv.r && !argv.rollback) {
				rollback(TOP_VALUE);
			}
		}
	} else if (TOP_DIRECTIVE == 'create') {
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
	} else if (TOP_DIRECTIVE == 'add') {
		var args = argv._.slice(1);
		if (TOP_VALUE == 'watch') {
			UltraAdd.watch(args.slice(1))
		}
	} else {
		throw new Error('Unknown directive type, please access help or type "ultramvc ?"');
	}
} catch (e) {
	console.log('UltraMVC Error:\n***************');
	console.log(e.message.red.bold);
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
