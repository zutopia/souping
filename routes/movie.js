var superagent = require('superagent');
var cheerio = require('cheerio');
var Url = require('url');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	var params = Url.parse(req.url,true).query; 
	var city = params.city;
	if(typeof(city) === 'undefined' || city === '' || city === null ){
		city = '武汉';
	}
	var url = 'https://api.douban.com/v2/movie/in_theaters';
	superagent.get(url).query({ city: city }).end(function (err, sres) {
		var obj = JSON.parse(sres.text);
		var n_obj = {};
		n_obj.title = obj.title;
		var subjects = obj.subjects;
		var mlist = [];
		for(var i in subjects){
			var m = subjects[i];
			mlist.push(analysis(m));
		}
		n_obj.list = mlist;
		res.render('movielist/list',{obj:n_obj});
	});
});

router.get('/coming', function(req, res) {
	var url = 'https://api.douban.com/v2/movie/coming_soon';
	getMovies(url,function(err,obj){
		res.render('movielist/coming_list',{obj:obj});
	});
});

router.get('/boxlist', function(req, res) {
	var url = 'https://api.douban.com/v2/movie/us_box';
	getMovieBoxes(url,function(err,obj){
		res.render('movielist/box_list',{obj:obj});
	});
});

router.get('/top100', function(req, res) {
	var douban = 'https://api.douban.com/v2/movie/top250?start=0&count=250';
	var imdb = 'http://www.imdb.com/chart/top?ref_=ft_250';
	var mlist = [];
	superagent.get(douban).end(function (err, sres) {
		var d_obj = JSON.parse(sres.text);
		var subjects = d_obj.subjects;
		for(var i in subjects){
			var m = subjects[i];
			var douban_id = m.id;
			var douban_title = m.title;
			var douban_year = m.year;
			var douban_img = m.images.small;
			var douban_rating = m.rating.average;
			var obj = {};
			obj.douban_id = douban_id;
			obj.douban_title = douban_title;
			obj.douban_year = douban_year;
			obj.douban_img = douban_img;
			obj.douban_rating = douban_rating;
			/*
			obj.imdb_href = '';
			obj.imdb_img = '';
			obj.imdb_year = '';
			obj.imdb_title = '';
			obj.imdb_rating = '';
			*/
			mlist.push(obj);

		}
		superagent.get(imdb).end(function (err, ires) {
			if(err){
				console.log(err);
				res.render('movielist/top250',{list:mlist});
			}else{
				var $ = cheerio.load(ires.text);
				$('table.chart tr').each(function(i,tr){
					if(i === 0){
						return true;
					}
					if(i === 101){
						return false;
					}
					var posterColumn = $(tr).find('td.posterColumn');
					var imdb_href = $(posterColumn).find('a').attr('href');
					var imdb_img = $(posterColumn).find('img').attr('src');
					var titleColumn = $(tr).find('td.titleColumn');
					var imdb_title = $(titleColumn).find('a').text();
					var imdb_year = $(titleColumn).find('span.secondaryInfo').text();
					var ratingColumn = $(tr).find('td.ratingColumn.imdbRating');
					var imdb_rating = $(ratingColumn).text().trim();
					var j = i -1;
					mlist[j].imdb_href = imdb_href;
					mlist[j].imdb_img = imdb_img;
					mlist[j].imdb_year = imdb_year;
					mlist[j].imdb_title = imdb_title;
					mlist[j].imdb_rating = imdb_rating;
				});
				res.render('movielist/top100',{list:mlist});
			}
		});
	});
});


var getMovies = function(url,callback){
	superagent.get(url).end(function (err, sres) {
		var obj = JSON.parse(sres.text);
		var n_obj = {};
		n_obj.title = obj.title;
		var subjects = obj.subjects;
		var mlist = [];
		for(var i in subjects){
			var m = subjects[i];
			mlist.push(analysis(m));
		}
		n_obj.list = mlist;
		callback(null,n_obj);
	});
}

var getMovieBoxes = function(url,callback){
	superagent.get(url).end(function (err, sres) {
		var obj = JSON.parse(sres.text);
		var n_obj = {};
		n_obj.title = obj.title;
		n_obj.date = obj.date;
		var subjects = obj.subjects;
		var mlist = [];
		for(var i in subjects){
			var m = analysis(subjects[i].subject);
			m.box = stringWithDot(subjects[i].box);
			if(subjects[i].new){
				m.new = '是';
			}else{
				m.new = '否';
			}
			m.rank = subjects[i].rank;
			mlist.push(m);
		}
		n_obj.list = mlist;
		callback(null,n_obj);
	});
}

var analysis = function(m){
	var id = m.id;
	var title = m.title;
	var original_title = m.original_title;
	var year = m.year;
	var img = m.images.large;
	var rating = m.rating.average;
	var genres = m.genres.join(" / ");
	var c_arr = m.casts;
	var casts = '';
	for(var k in c_arr){
		casts += ' / ' + c_arr[k].name ;
	}
	if(casts.length>0){
		casts = casts.substring(3);
	}
	var d_arr = m.directors;
	var directors = '';
	for(var v in d_arr){
		directors += ' / ' + d_arr[v].name ;
	}
	if(directors.length>0){
		directors = directors.substring(3);
	}

	var m_obj = {};
	m_obj.id = id;
	m_obj.year = year;
	m_obj.rating = rating;
	m_obj.original_title = original_title;
	m_obj.title = title;
	m_obj.img = img;
	m_obj.genres = genres;
	m_obj.casts = casts;
	m_obj.directors = directors;

	return m_obj;
}

function stringWithDot(s,n){
    if( arguments.length === 0 ){
        return '';
    }
    if( arguments.length === 1 ){
        n = 3;
    }
    n = parseInt(n);
    s += '';
    var i = s.length%n === 0 ? Math.floor(s.length/n) : (Math.floor(s.length/n) + 1);
    var arr = [];
    for(var j = 0; j<i ; j++){
        arr.push(s.substring((s.length-(j+1)*n)<0?0:(s.length-(j+1)*n),s.length-j*n));
    }
    return arr.reverse().join(",");
}

module.exports = router;
