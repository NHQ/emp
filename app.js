
/**
 * Module dependencies.
 */

var express = require('express'),
	jade = require('jade'),
 	redis = require("redis"),
    client = redis.createClient();

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

function epoch(){return Math.round(new Date().getTime()/1000.0)};

function ago (time){
	var now = function(){return Math.round(new Date().getTime()/1000.0)};
	var ago = now() - time;
	console.log(now());
	var plural = function(num){
		if (num > 1) return 's'
		else return ""
	};
	if(ago < 3600){ return 'very recently'};
	if (ago < 86400){ return '~ '+Math.round(ago/3600)+' hour'+plural(Math.round(ago/2629743))+' ago'};
	if (ago > 86400 && ago < 604800){ return '~ '+Math.round(ago/86400)+' days'+plural(Math.round(ago/2629743))+' ago'};
	if (ago > 604800 && ago < 2629743){return '~ '+Math.round(ago/604800)+' week'+plural(Math.round(ago/2629743))+' ago'};
	if (ago > 2629743 && ago < 31556926){return '~ '+Math.round(ago/2629743)+' month'+plural(Math.round(ago/2629743))+' ago'};
}


// Routes

app.post('/pantry', function(req, res){
	console.log(req.body);
	req.body.score = epoch();
	client.zadd('pantry', epoch(), JSON.stringify(req.body), function(err, call){
		console.log(err+'\n'+call)
	});
	res.redirect('/')
});
app.post('/del', function(req,res){
	console.log(req.body);
	client.zremrangebyscore('pantry', req.body.score, req.body.score, function(e,r){
		res.redirect('/')
	})
	//res.redirect('/')
})
app.get('/', function(req, res){
	client.zrevrangebyscore('pantry', epoch(), -1, function(err, items){
		console.log(items);
		res.render('index', {
		    title: 'Express',
			locals: {
				pantry: items,
				ago: ago
			}
		  });
	})
});

app.listen(3001);
console.log("Express server listening on port %d", app.address().port);
