function showWeixin(obj){
	var placement = 'bottom';
	$(obj).popover({
		placement:placement,
		//animation:true,
		html:true,
		content:'<img  width="256" height="256" src="/images/weixin.png">'
	})
	$(obj).popover('show');
	$('.popover-content').css('padding','4px');
}

function hideWeixin(obj){
	//setTimeout($(obj).popover('hide'), 300);
	$(obj).popover('hide');
}