var superagent = require('superagent');
var cheerio = require('cheerio');
var async = require('async');
var Url = require('url');
var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index');
});

/* GET home page. */
router.get('/getimdbInfo', function(req, res) {
	var params = Url.parse(req.url,true).query; 
	var imdb_url = params.url;
	if(imdb_url !== ''){
		superagent.get(imdb_url).end(function (err, imdb) {
			if(err){
				console.log(err);
				res.send({status:'fail'});
			}else{
				var $_imdb = cheerio.load(imdb.text);
				var flag = false;
				var imdb_score = $_imdb('div.ratingValue span').first().html();
				if(imdb_score !== null && imdb_score !== ''){
				    imdb_score = imdb_score.trim();
				}else{
				    flag = true;
				}
				var imdb_user = $_imdb('span.small').html();
				if(imdb_user !== null && imdb_user !== ''){
				    imdb_user = imdb_user.trim();
				}else{
				    flag = true;
				}
				//var imdb_movie_pic = $_imdb('div.poster > a > img ').attr('src');
				if(flag){
				    res.send({status:'fail'});
				}else{
				    res.send({status:'success',imdb_score:imdb_score,imdb_user:imdb_user});
				}
			}	
		});
	} else {
		res.send({status:'fail'});
	}
});

/* GET main page. */
router.get('/main', function(req, res) {
	var params = Url.parse(req.url,true).query; 
	var key = params.key;
	console.log('==================='+key+'===================');
	if(typeof(key) === 'undefined' || key === '' || key === null ){
		res.render('error');
	} else {
		superagent.get('https://api.douban.com/v2/movie/search').query({ q: key }).end(function (err, sres) {
			try{
				var r_obj = JSON.parse(sres.text);
			}catch(e){
				console.error(e);
				res.render('error',{ key:key});
				return;
			}
			var film_arr = r_obj.subjects;
			if(typeof(film_arr) === 'undefined' || film_arr === null || film_arr.length === 0){
				res.render('error', { key:key});
			} else {
				var filelist = [];
				for(var i in film_arr){
					var film = film_arr[i];
					var id = film.id;
					var subtype = film.subtype;
					var year = film.year;
					var score = film.rating.average;
					var org_title = film.original_title;
					var title = film.title;
					var img = film.images.large;
					var g_arr = film.genres;
					var genres = g_arr.join(" / ");
					var c_arr = film.casts;
					var casts = '';
					for(var k in c_arr){
						casts += ' / ' + c_arr[k].name ;
					}
					if(casts.length>0){
						casts = casts.substring(3);
					}
					var d_arr = film.directors;
					var directors = '';
					for(var v in d_arr){
						directors += ' / ' + d_arr[v].name ;
					}
					if(directors.length>0){
						directors = directors.substring(3);
					}
					var obj = {};
					obj.id = id;
					obj.subtype = subtype;
					obj.year = year;
					obj.score = score;
					obj.org_title = org_title;
					obj.title = title;
					obj.img = img;
					obj.genres = genres;
					obj.casts = casts;
					obj.directors = directors;
					filelist.push(obj);
				}
				res.render('main', { list:filelist, key:key });
			}
		});
	}
});


/* GET detail page. */
router.get('/detail', function(req, res) {
	var params = Url.parse(req.url,true).query; 
	var id = params.id;
	if(typeof(id) === 'undefined' || id === '' || id === null ){
		res.render('error');
	} else {
		var subtype = '';
		var title = '';
		superagent.get('https://api.douban.com/v2/movie/subject/'+id).end(function (err, m) {
			try{
				var s_obj = JSON.parse(m.text);
			}catch(e){
				console.error(e);
				res.render('error');
				return;
			}
			var douban_url = s_obj.alt;
			var movie_obj = {};
			subtype = s_obj.subtype;
			title = s_obj.title;
			//链接
			movie_obj.douban_url = s_obj.alt;
			//封面图
			movie_obj.douban_src = s_obj.images.large;
			//评分
			movie_obj.douban_score = s_obj.rating.average;
			var score_arr = (s_obj.rating.average+'').split('.');
			movie_obj.douban_score_1 = score_arr[0];
			movie_obj.douban_score_2 = '';
			if(score_arr.length>1)
				movie_obj.douban_score_2 = score_arr[1];
			//评分人数
			movie_obj.douban_user = stringWithDot(s_obj.ratings_count);

			var film_info = {};
			//名称
			film_info.title = s_obj.title;
			//年代
			film_info.year = s_obj.year;
			//导演
			film_info.directors;
			//编剧
			film_info.writers;
			//主演
			film_info.casts;
			//影片类型
			var g_arr = s_obj.genres;
			var genres = g_arr.join(" / ");
			film_info.genres = genres;
			//制片国家/地区
			var c_arr = s_obj.countries;
			var countries = c_arr.join(" / ");
			film_info.countries = countries;
			//语言
			film_info.languages;
			//上映日期
			film_info.pubdates;
			//片长
			film_info.durations;
			//简介
			film_info.summary = s_obj.summary;

			superagent.get(douban_url).end(function (err, douban) {
				var $ = cheerio.load(douban.text);
				
				//抓取短评
				var s_comments = [];
				$('div#hot-comments.tab div.comment-item').each(function(i,sc){
					var s_comment = {};
					var short_comment = $(sc);
					var comment_content = short_comment.find('p').text();
					var comment_vote = short_comment.find('span.comment-vote');
					var comment_info = short_comment.find('span.comment-info').children();
					var votes = comment_vote.children().first().html();
					var user_url = comment_info.first().attr('href');
					var user_name = comment_info.first().text();
					var comment_time = comment_info.last().text().trim();
					var rate = comment_info.first().next().attr('title');
					s_comment.votes = votes;
					s_comment.user_url = user_url;
					s_comment.user_name = user_name;
					s_comment.comment_time = comment_time;
					s_comment.rate = rate;
					s_comment.comment_content = comment_content;
					s_comments.push(s_comment);
				});



				//抓取长评
				var l_comments = [];
				$('div#review_section div.review').each(function(i,lc){
					var l_comment = {};
					var long_comment = $(lc);
					var comment_content = long_comment.find('div.review-bd').children().first().children().first().text();
					var review_hd = long_comment.find('div.review-hd');
					var comment_info = review_hd.children().first().children().last();
					var comment_title = comment_info.attr('title');
					var comment_url = comment_info.attr('href');
					var review_hd_info = long_comment.find('div.review-hd-info').children();
					var user_img = review_hd.children().first().children().first().find('img').attr('src');
					var user_url = review_hd_info.first().attr('href');
					var user_name = review_hd_info.first().text();
					var rate = review_hd_info.last().attr('title');
					l_comment.comment_content = comment_content;
					l_comment.comment_title = comment_title;
					l_comment.comment_url = comment_url;
					l_comment.user_url = user_url;
					l_comment.user_name = user_name;
					l_comment.user_img = user_img;
					l_comment.rate = rate;
					l_comments.push(l_comment);
				});

				$('div#info span.attrs').each(function(i,e){
					var ele = $(e);
					var s = '';
					ele.children('a').each(function(ai,ae){
						var aele = $(ae);
						s += ' / ' + aele.text() ;
					});
					if(s.length>0){
						s = s.substring(3);
					}
					var p = ele.prev().text();
					if(p === '导演'){
						film_info.directors = s;
					}
					if(p === '编剧'){
						film_info.writers = s;
					}
					if(p === '主演'){
						film_info.casts = s;
					}
				});
				
				var imdb_url = '';
				$('div#info span.pl').each(function(i,e){
					var ele = $(e);
					var k = ele.text();
					var t = ele.next().text();
					if(subtype === 'tv'){
						if(k === '首播:'){
							film_info.pubdates = t;
						}
					}else {
						if(k === '上映日期:'){
							film_info.pubdates = t;
						}
						if(k === '片长:'){
							film_info.durations = t;
						}
					}
					if(k === 'IMDb链接:'){
						imdb_url = ele.next().attr('href');
					}
				});
				
				if(imdb_url !== ''){	
					movie_obj.imdb_url = imdb_url;
				}
				
				if(l_comments.length > 0){
					async.map(l_comments,function(l_comment,callback){
						var comment_url = l_comment.comment_url;
						superagent.get(comment_url).end(function (err, comment) {
							var $ = cheerio.load(comment.text, {decodeEntities: false});
							var content = $('div#link-report').children().first().html();
							async.map($(content).children('img'),function(img,callback2){
								var src = $(img).attr('src');
								var name = src.substring(src.lastIndexOf('/')+1);
								var new_name = 'public/images/img/'+name;
								var img_name = 'images/img/'+name;
								if(!fs.existsSync(new_name)){
									console.log('下载图片========'+$(img).attr('src'));
									superagent.get($(img).attr('src')).pipe(fs.createWriteStream(new_name)).on('finish', function() {
										content = content.replace(src,img_name);
										callback2(null);
									});
								}else{
									content = content.replace(src,img_name);
									callback2(null);
								}	
							},function(err){
								l_comment.comment_content = content;
								callback(null,l_comment);
							});
						});
					},function(err, results){
						res.render('detail', {  l_comments:results, s_comments:s_comments ,subtype:subtype,title:title, movie_obj:movie_obj , film_info:film_info });			
					});
				}else{
					res.render('detail', {  l_comments:l_comments, s_comments:s_comments ,subtype:subtype,title:title, movie_obj:movie_obj , film_info:film_info });			
				}
			});
		});
	}
});

function stringWithDot(s){
	if( typeof(s) === 'undefined' || s === null || s === '' ){
		return '';
	}
	s = s+'';
	var i = 0;
	if( s.length%3 === 0 ){
		i = parseInt(s.length/3);
	}else{
		i = parseInt(s.length/3) + 1;
	}
	var arr = [];
	for(var j = 0; j<i ; j++){
		var start = s.length-(j+1)*3;
		start = start<0?0:start;
		var end = s.length-j*3;
		var c = s.substring(start,end);
		arr.push(c);
	}
	var s_arr = [];
	for(var k = arr.length-1 ; k >-1 ; k--){
		s_arr.push(arr[k]);
	}
	return s_arr.join(",");
}


function stringWithDot2(s,n){
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

var re = "";
function stringWithDot3(s,n){
	if(s.length > n){
		re = "," + s.substring(s.length-n) + re;
		stringWithDot3(s.substring(0,s.length-n),n);
	}else{
		re = s + re;
	}
}


module.exports = router;
