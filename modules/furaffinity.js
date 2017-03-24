/* jshint esversion: 6 */
const events = require('events');
const util = require('util');

var Request = require('request').Request;
var sax = require('sax');

var furaffinity = {};

function getSubmissionEmitter (options) {
	if (!options) options = {};

	var start = null;
	var response = null;
	var finishparse = null;

	var withinUsernameDiv = false;
	var withinUsernameSpan = false;
	var caseCorrectedUsername = null;

	var EventEmitter = events.EventEmitter;
	var saxStream = require("sax").createStream();
	var withinSection = false;
	var curTagIsUser = false;
	var curTagIsTitle = false;
	var curTagText = null;

	var currentSubmission = {};
	var url = 'https://furaffinity.net/';
	if (options.user) {
		url += 'gallery/' + options.user + '/';
	}
	var req = new Request({
		method: 'GET',
		url: url,
		headers: {
			Cookie: options.cookie
		}
	});
	function ee() {
		EventEmitter.call(this);
	}

	util.inherits(ee, EventEmitter);

	var fa = this;

	ee.prototype.begin = function () {
		start = Date.now();
		var forceClose = false;

		saxStream.on("error", function (e) {
			if (!forceClose) callback(e);
		});

		saxStream.on('opentagstart', function (node) {
			if (!response) response = Date.now();
			switch (node.name) {
				case 'SECTION':
					withinSection = true;
					break;
			}
		});

		saxStream.on('opentag', function (node) {
			if (withinSection) {
				switch (node.name) {
					case 'A':
						if (node.attributes.HREF.startsWith('/view/')) {
							var id = /\/view\/(\d+)\//.exec(node.attributes.HREF)[1];
							currentSubmission.id = id;
							curTagIsTitle = true;
						} else if (!options.user && node.attributes.HREF.startsWith('/user/')) {
							curTagIsUser = true;
						}
						break;
					case 'FIGURE':
						currentSubmission.rating = /r-(\w+)/.exec(node.attributes.CLASS)[1];
						break;
					case 'IMG':
						currentSubmission.thumbnail = 'https:' + node.attributes.SRC;
						break;
				}
			} else {
				switch (node.name) {
					case 'DIV':
						if (options.user && !caseCorrectedUsername && (node.attributes.CLASS === 'user-name')) withinUsernameDiv = true;
						break;
					case 'SPAN':
						if (options.user && !caseCorrectedUsername && withinUsernameDiv) withinUsernameSpan = true;
						break;
				}
			}
		});

		saxStream.on('text', function (text) {
			if (!options.user && curTagIsUser) currentSubmission.user = text;
			else if (curTagIsTitle) currentSubmission.title = text;
			else if (options.user && withinUsernameDiv && withinUsernameSpan) {
				caseCorrectedUsername = /~(.*)'s Gallery/.exec(text)[1];
				withinUsernameDiv = false;
				withinUsernameSpan = false;
			}
		});

		saxStream.on('closetag', function (name) {
			switch (name) {
				case 'SECTION':
					withinSection = false;
					forceClose = true;
					saxStream._parser.close();
					break;
				case 'FIGURE':
					currentSubmission.page = 'https://www.furaffinity.net/view/' + currentSubmission.id + '/';
					if (options.user) currentSubmission.user = caseCorrectedUsername;
					ee.emit('submission', null, currentSubmission);
					currentSubmission = {};
					break;
				case 'A':
					curTagIsTitle = false;
					curTagIsUser = false;
			}
		});

		saxStream.on('end', function () {
			var finishparse = Date.now();
			console.error((response - start) + 'ms between request and response');
			console.error((finishparse - response) + 'ms between response and end of parse');
			ee.emit('end');
		});

		req.pipe(saxStream);
		var ee = this;
	};

	return new ee();
}

furaffinity.getFrontpage = function (options) {
	return getSubmissionEmitter(options);
};

furaffinity.getUser = function (user, options) {
	options.user = user;
	return getSubmissionEmitter(options);
};

module.exports = furaffinity;
