"use strict";

var UltraLib = require('./UltraLib.js'),
	Template = require('./Template.js'),
	fs = require('fs')
;

/**
 *
 * @type {UltraCreate}
 */
var UltraCreate = class UltraCreate {

	/**
	 * The Function for Creating
	 *
	 * @param create_type
	 * @param create_name
	 */
	static create(create_type, create_name)
	{
		// first check that we have a valid
		UltraLib.checkValidDirectory();
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

			if (UltraLib.isFile(old_namespace.join('/') + '.php')) {
				throw new Error('You have already specified this ' + create_type + '.  Go to ' + old_namespace.join('/') + '.php');
			} else if (UltraLib.isFile(full_namespace.join('/') + '.php')) {
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
					var write_file_name = full_namespace.join('/') + '/' + func_name + '.php';
					fs.writeFile(write_file_name, "<?php\n\n" + template, function(err) {
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
};


module.exports = UltraCreate;
