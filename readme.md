<a name="start"></a>

# cargobox 0.1.0 #

Express-like web development framework for Node.JS with better OOP

Dependencies

* classful 1.1.2
* connect 2.0.3
* mime 1.2.5

### intallation [↑](#start) ###

		npm install cargobox

### setup [↑](#start) ###

		var cargobox = require('cargobox');
		var app = new cargobox();

### templating [↑](#start) ###

		app.engine("html", require("ejs").__express);
		app.set("views", __dirname + '/views');
		app.set('view layout', 'layout');
		app.set('view engine', 'html');

### middleware configuration [↑](#start) ###

		app.use(app.plugins.favicon());
		app.use(app.plugins.logger('dev'));
		app.use(app.plugins.static(__dirname + '/cdn'));
		app.use(app.plugins.cookieParser(GLOBAL.cfg.cookie_secret))
		app.use(app.plugins.session())
		app.use(app.plugins.bodyParser())
		app.use(app.router);

### routing [↑](#start) ###

		app.get('/test', function(req, res) { 
			res.end('<form method="post"><input name="xzy" type="text" /><button type="submit">Send</button></form>')
		});

		app.post('/test', function(req, res) { 
			console.log('we have received data over post: ', req.body.xzy);
			res.redirect(301, '/1');
		});

### starting the server [↑](#start) ###
		
		var port = process.env.PORT || 3000;
		app.listen(port, function() {
		  console.log("Listening on " + port);
		});

### documentation [↑](#start) ###

[MIT License](https://github.com/inruntime/cargobox/blob/master/LICENSE)