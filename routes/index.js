var superagent = require('superagent');
var cheerio = require('cheerio');
var Url = require('url');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index');
})

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
				var imdb_score = $_imdb('div.titlePageSprite.star-box-giga-star').html();
				if(imdb_score !== null && imdb_score !== ''){
				    imdb_score = imdb_score.trim();
				}else{
				    flag = true;
				}
				var imdb_user = $_imdb('div.star-box-details > a').first().children('span').html();
				if(imdb_user !== null && imdb_user !== ''){
				    imdb_user = imdb_user.trim();
				}else{
				    flag = true;
				}
				var imdb_movie_pic = $_imdb('#img_primary > div.image > a > img ').attr('src');
				if(flag){
				    res.send({status:'fail'});
				}else{
				    res.send({status:'success',imdb_score:imdb_score,imdb_user:imdb_user});
				}
			}	
		})
	} else {
		res.send({status:'fail'});
	}
})

/* GET main page. */
router.get('/main', function(req, res) {
	var params = Url.parse(req.url,true).query; 
	var key = params.key;
	console.log(key);
	if(key === '' || key === null ){
		res.render('error');
	} else {
		superagent.get('https://api.douban.com/v2/movie/search?q='+key).end(function (err, sres) {
			var r_obj = JSON.parse(sres.text);
			var film_arr = r_obj.subjects;
			if(typeof(film_arr) === 'undefined' || film_arr === null || film_arr.length === 0){
				res.render('error', { key:key});
			} else {
				var filelist = new Array();
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
					var genres = '';
					for(var i in g_arr){
						genres += ' / ' + g_arr[i] ;
					}
					if(genres.length>0){
						genres = genres.substring(3);
					}
					var c_arr = film.casts;
					var casts = '';
					for(var i in c_arr){
						casts += ' / ' + c_arr[i].name ;
					}
					if(casts.length>0){
						casts = casts.substring(3);
					}
					var d_arr = film.directors;
					var directors = '';
					for(var i in d_arr){
						directors += ' / ' + d_arr[i].name ;
					}
					if(directors.length>0){
						directors = directors.substring(3);
					}
					var obj = new Object();
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
		})
	}
})


/* GET detail page. */
router.get('/detail', function(req, res) {
	var params = Url.parse(req.url,true).query; 
	var id = params.id;
	var subtype = '';
	var title = '';
	superagent.get('https://api.douban.com/v2/movie/subject/'+id).end(function (err, m) {
		var s_obj = JSON.parse(m.text);
		var douban_url = s_obj.alt;
		var movie_obj = new Object();
		subtype = s_obj.subtype;
		title = s_obj.title;
		//链接
		movie_obj.douban_url = s_obj.alt;
		//封面图
		movie_obj.douban_src = s_obj.images.large;
		//评分
		movie_obj.douban_score = s_obj.rating.average;
		//评分人数
		movie_obj.douban_user = stringWithDot(s_obj.ratings_count);

		var film_info = new Object();
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
		var genres = '';
		for(var g in g_arr){
			genres += ' / ' + g_arr[g] ;
		}
		if(genres.length>0){
			genres = genres.substring(3);
		}
		film_info.genres = genres;
		//制片国家/地区
		var c_arr = s_obj.countries;
		var countries = '';
		for(var c in c_arr){
			countries += ' / ' + c_arr[c] ;
		}
		if(countries.length>0){
			countries = countries.substring(3);
		}
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
			var s_comments = new Array();
			$('div#hot-comments.tab div.comment-item').each(function(i,sc){
				var s_comment = new Object();
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
			})



			//抓取长评
			var l_comments = new Array();
			$('div#review_section div.review').each(function(i,lc){
				var l_comment = new Object();
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
			})

			$('div#info span.attrs').each(function(i,e){
				var ele = $(e);
				var s = '';
				ele.children('a').each(function(ai,ae){
					var aele = $(ae);
					s += ' / ' + aele.text() ;
				})
				if(s.length>0){
					s = s.substring(3);
				}
				var p = ele.prev().text()
				if(p === '导演'){
					film_info.directors = s;
				}
				if(p === '编剧'){
					film_info.writers = s;
				}
				if(p === '主演'){
					film_info.casts = s;
				}
			})
			
			var imdb_url = '';
			$('div#info span.pl').each(function(i,e){
				var ele = $(e);
				var k = ele.text();
				var t = ele.next().text()
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
			})
			
			if(imdb_url !== ''){	
				movie_obj.imdb_url = imdb_url;
			}
			res.render('detail', {  l_comments:l_comments, s_comments:s_comments ,subtype:subtype,title:title, movie_obj:movie_obj , film_info:film_info });			
		})
	})
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
	var arr = new Array();
	for(var j = 0; j<i ; j++){
		var start = s.length-(j+1)*3;
		start = start<0?0:start;
		var end = s.length-j*3;
		var c = s.substring(start,end);
		arr.push(c);
	}
	var s_arr = new Array();
	for(var k = arr.length-1 ; k >-1 ; k--){
		s_arr.push(arr[k])
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
    var arr = new Array();
    for(var j = 0; j<i ; j++){
        arr.push(s.substring((s.length-(j+1)*n)<0?0:(s.length-(j+1)*n),s.length-j*n));
    }
    return arr.reverse().join(",");
}

var re = "";
function stringWithDot3(s,n){
	if(s.length > n){
		re = "," + s.substring(s.length-n) + re;
		stringWithDot3(s.substring(0,s.length-n),n)
	}else{
		re = s + re;
	}
}


module.exports = router;
