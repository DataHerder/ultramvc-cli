"use strict";

var q = require('q'),
	fs = require('fs')
;

/**
 *
 * @type {Template}
 */
var Template = class Template {

	constructor() {
		this.template = null;
		this.parsed_template = null;
	}


	getTemplate(template_type) {
		var defer = q.defer();
		var tt = template_type || false;

		if (tt == 'model') {
			fs.readFile('Library/Models/UltraModelTemplate.php', 'utf8', (err, data) => {
				if (err) {
					defer.reject(err);
				} else {
					this.template = data;
					defer.resolve(data);
				}
			});
		} else if (tt == 'controller') {
			fs.readFile('Library/Controllers/UltraControllerTemplate.php', 'utf8', (err, data) => {
				if (err) {
					defer.reject(err);
				} else {
					this.template = data;
					defer.resolve(data);
				}
			});
		} else {
			throw new TemplateError('Wrong template type');
		}
		return defer.promise;
	}

	static getPartial(template_type) {
		var defer = q.defer();
		var tt = template_type || false;

		if (tt == 'controller') {
			defer.resolve("\n\n\tpublic function {{func_name}} () {\n\t\t$this->Load->view('{{view_name}}');\n\t}\n\n");
		} else {
			defer.reject('Unfortunately extending an already existing model is not allowed at this time.');
		}
		return defer.promise;
	}

	static parseTemplate(parse_variables, template)
	{
		var pvar = parse_variables || {},
			regex = /\{\{\w+\}\}/g,
			m,
			t = template || this.template
		;

		this.parsed_template = t;
		while (m = regex.exec(this.parsed_template)) {
			if (m !== undefined) {
				var parse_name = m[0].replace(/\{|\}/g, '');
				var reg = new RegExp("\{\{" + parse_name + "\}\}");
				if (pvar[parse_name]) {
					this.parsed_template = this.parsed_template.replace(reg, pvar[parse_name])
				} else {
					this.parsed_template = this.parsed_template.replace(reg, '');
				}
			}
		}
		return this.parsed_template;
	}
};


class ExtendableError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		this.message = message;
		Error.captureStackTrace(this, this.constructor.name);
	}
}

class TemplateError extends Error {
	constructor(m) {
		super(m);
	}
}

module.exports = Template;