function showWeixin(obj){
	var placement = 'bottom';
	$(obj).popover({
		placement:placement,
		//animation:true,
		html:true,
		//content:'<img  width="256" height="256" src="/images/weixin.png">'
		content:'<img  width="192" height="192" src="/images/weixin.jpg">'
	})
	$(obj).popover('show');
	//$('.popover-content').css('padding','4px');
	$('.popover-content').css('padding','0px');
}

function hideWeixin(obj){
	//setTimeout($(obj).popover('hide'), 300);
	$(obj).popover('hide');
}