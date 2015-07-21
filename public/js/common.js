$(function(){
	$('#key').keydown(function(){
        if(event.keyCode=="13"){
            search();
        }
    })
})

function search(){
	$('#loading').show();
	$('#key').attr("readonly","readonly");
	$("#submit").attr('disabled',true);
	var key = $('#key').val();
	if(typeof(key) ==='undefined' || key === null || key ===''){
		window.location.href="/";
	}else{
		window.location.href="/main?key="+encodeURI(key);
		//$('#form').submit();
	}
}