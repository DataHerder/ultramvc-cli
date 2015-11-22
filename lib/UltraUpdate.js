"use strict";

var UltraLib = require('./UltraLib.js'),
	q = require('q'),
	mv = require('mv')
;

/**
 *
 * @type {UltraUpdate}
 */
var UltraUpdate = class UltraUpdate {

	/**
	 *
	 * @param update_which
	 * @param args
	 */
	static update(update_which, args)
	{
		var uw = update_which || '',
			argv = args || []
			;

		if (uw == 'library') {
			var directory_name = '.__ultra__dev/ultra-update';
			// now we update the library to the latest repo without
			if (UltraLib.isDirectory(directory_name)) {
				var go = UltraLib.rmdir(directory_name);
			} else {
				// sim q
				var d = q.defer();
				go = d.promise;
				d.resolve('success');
			}

			go.then(function() {
				UltraLib.mkdirp_q('.__ultra_archive__')
					.then(function (resp) {
						return UltraLib.mkdirp_q('.__ultra__dev');
					}).then(function (resp) {
						UltraLib.cloneRepo(directory_name + ':::' + UltraLib.github_repo).then(function() {
							console.log('Successfully loaded main framework'.green.bold);
							var paths = [];
							for (var j in UltraLib.dependencies) {
								paths.push(directory_name + '/' + j + ':::' + UltraLib.dependencies[j])
							}
							q.all(paths.map(UltraLib.cloneRepo)).then(function () {
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

};

module.exports = UltraUpdate;

