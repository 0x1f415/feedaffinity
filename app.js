/* jshin esversion: 6 */
'use sctrict';

var fs = require('fs');

var express = require('express');
var app = express();
app.set('view engine', 'ejs');

var fa = require('./modules/furaffinity.js');

var ejs = require('ejs');
var rss_header = ejs.compile(fs.readFileSync(__dirname + '/templates/head.ejs', { encoding: 'utf8' }));
var rss_footer = ejs.compile(fs.readFileSync(__dirname + '/templates/footer.ejs', { encoding: 'utf8' }));
var rss_item   = ejs.compile(fs.readFileSync(__dirname + '/templates/item.ejs', { encoding: 'utf8' }));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/index.html');
});

app.get('/frontpage/:cookie', function (req, res) {
	res.set('Content-Type', 'text/xml');
	var start = Date.now();
	var cookie = req.params.cookie;
	var frontpage = fa.getFrontpage({ cookie: cookie });

			res.write(rss_header());

	frontpage.on('submission', function (err, submission) {
		res.write(rss_item({
			title: '[' + submission.rating + '] ' + submission.title,
			page: submission.page,
			thumbnail: submission.thumbnail,
			id: submission.id
		}));
	});

	frontpage.on('end', function (err, submission) {
		var end = Date.now();
		var diff = end - start;
		console.error('whole request took ' + diff + ' ms');
		res.write(rss_footer());
		res.end();
	});

	frontpage.begin();
});

app.get('/user/:user/:cookie', function (req, res) {
	res.set('Content-Type', 'text/xml');
	var start = Date.now();
	var user = fa.getUser(req.params.user, { cookie: req.params.cookie });

	var hadWrittenHead = false;

	user.on('submission', function (err, submission) {
		if (!hadWrittenHead) {
			res.write(rss_header());
			hadWrittenHead = true;
		}
		res.write(rss_item({
			title: '[' + submission.rating + '] ' + submission.title,
			page: submission.page,
			thumbnail: submission.thumbnail,
			id: submission.id
		}));
	});

	user.on('end', function (err, submission) {
		var end = Date.now();
		var diff = end - start;
		console.error('whole request took ' + diff + ' ms');
		res.write(rss_footer());
		res.end();
	});

	user.begin();
});

app.listen(3000, function () {
	console.log('listening on 3000');
});
