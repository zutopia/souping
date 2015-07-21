$(function(){
	var imdb_url = $('#imdb_url').val();
	if(typeof(imdb_url) !== 'undefined' && imdb_url !== null && imdb_url !==''){
		$.ajax({
			type: "GET",
			url: "/getimdbInfo",
			data: {url:imdb_url},
			dataType: "json",
			success: function(json){
				var data=eval(json)
				if(data.status==='success'){
					//$('#imdb_score').html(data.imdb_score+' / 10');
					var m = data.imdb_score.split('.')[0];
					var n = data.imdb_score.split('.')[1];
					$('#imdb_score').html('<span style="color:#f0ad4e;font-weight:600;font-size:20px;">'+m+'</span><span style="color:#f0ad4e;font-weight:600;">.'+n+'</span>');
					$('#imdb_user').html('<span style="color:#5cb85c;font-weight:600;">'+data.imdb_user+'</span>');
				}else{
					$('#imdb_score').html('获取失败');
					$('#imdb_user').html('获取失败');
				}
			},
			error: function(){
				$('#imdb_score').html('获取失败');
				$('#imdb_user').html('获取失败');
			}
		})
	}
})