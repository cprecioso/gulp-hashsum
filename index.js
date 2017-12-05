'use strict';

var crypto = require('crypto');
var gutil = require('gulp-util');
var _ = require('lodash');
var slash = require('slash');
var through = require('through');

var path = require('path');

function hashsum(options) {
	options = _.defaults(options || {}, {
		dest: process.cwd(),
		hash: 'sha1',
		delimiter: '  ',
		json: false
	});
	options = _.defaults(options, { filename: options.hash.toUpperCase() + 'SUMS' });

	var hashesFilePath = path.resolve(options.dest, options.filename);
	var hashes = {};

	function processFile(file) {
		if (file.isNull()) {
			return;
		}
		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-hashsum', 'Streams not supported'));
			return;
		}
		var filePath = path.resolve(options.dest, file.path);
		hashes[slash(path.relative(path.dirname(hashesFilePath), filePath))] = crypto
			.createHash(options.hash)
			.update(file.contents, 'binary')
			.digest('hex');

		this.push(file);
	}

	function writeSums() {
		var contents;
		if (options.json) {
			contents = JSON.stringify(hashes);
		}
		else {
			var lines = _.keys(hashes).sort().map(function (key) {
				return hashes[key] + options.delimiter + key + '\n';
			});
			contents = lines.join('');
		}
		var data = new Buffer(contents);

		this.push(new gutil.File({
			path: hashesFilePath,
			contents: data
		}));

		this.emit('end');
	}

	return through(processFile, writeSums);
}

module.exports = hashsum;
