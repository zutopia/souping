require('tingyun');  
var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var movielist = require('./routes/movie');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs-mate'));
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/movie', movielist);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('404', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('404', {
        message: err.message,
        error: {}
    });
});

app.listen(process.env.VCAP_APP_PORT || 3000, function () {
    console.log("souping is running ,port " + (process.env.VCAP_APP_PORT || 3000) );
});

//手动gc   间隔时间10s
setInterval(global.gc,10000);

var showMem = function() {
     var mem = process.memoryUsage();
     var format = function(bytes) {
          return (bytes/1024/1024).toFixed(2)+'MB';
     };
	 
     console.log('----------------------------------------');
     console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
     console.log('----------------------------------------');
};
//打印内存信息
//setInterval(showMem,20000);

var delPic = function() {
	var dirpath = 'public/images/img';
    if(fs.existsSync(dirpath)) {
		console.log('--------清除图片---------')
		fs.readdirSync(dirpath).forEach(function(file){
			fs.unlinkSync('public/images/img/'+file);
		});
	}		
};
//清除images/img下面图片   间隔时间一天
setInterval(delPic,30*24*60*60*1000);

module.exports = app;
