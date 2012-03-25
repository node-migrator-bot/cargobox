#cargobox 0.1.0

Express-like web development framework for Node.JS with better OOP

Dependencies:
- classful 1.1.2
- connect 2.0.3
- mime 1.2.5

## intallation

		npm install cargobox

## setup

		var cargobox = require('cargobox');
		var app = new cargobox();

### templating

		app.engine("html", require("ejs").__express);
		app.set("views", __dirname + '/views');
		app.set('view layout', 'layout');
		app.set('view engine', 'html');

### middleware configuration

		app.use(app.plugins.favicon());
		app.use(app.plugins.logger('dev'));
		app.use(app.plugins.static(__dirname + '/cdn'));
		app.use(app.plugins.cookieParser(GLOBAL.cfg.cookie_secret))
		app.use(app.plugins.session())
		app.use(app.plugins.bodyParser())
		app.use(app.router);

### routing

		app.get('/test', function(req, res) { 
			res.end('<form method="post"><input name="xzy" type="text" /><button type="submit">Send</button></form>')
		});

		app.post('/test', function(req, res) { 
			console.log('we have received data over post: ', req.body.xzy);
			res.redirect(301, '/1');
		});

### start the server
		
		var port = process.env.PORT || 3000;
		app.listen(port, function() {
		  console.log("Listening on " + port);
		});