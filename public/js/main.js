//判断浏览器 
var Browser=new Object(); 
Browser.userAgent=window.navigator.userAgent.toLowerCase(); 
Browser.ie=/msie/.test(Browser.userAgent); 
Browser.Moz=/gecko/.test(Browser.userAgent); 
//判断是否加载完成 
function Imagess(url,obj,callback){    
    var val=url; 
    var img=new Image(); 
    if(Browser.ie){ 
        img.onreadystatechange =function(){  
            if(img.readyState=="complete"||img.readyState=="loaded"){ 
                callback(img,obj); 
            } 
        }        
    }else if(Browser.Moz){ 
        img.onload=function(){ 
            if(img.complete==true){ 
                callback(img,obj); 
            } 
        }        
    }    
    //如果因为网络或图片的原因发生异常，则显示该图片 
    //img.onerror=function(){img.src='http://www.baidu.com/img/baidu_logo.gif'} 
    img.src=val; 
} 
//显示图片 
function checkimg(obj,obj2){ 
//	$(obj2).css('margin-top','0px');
	$(obj2).animate({width:'120',height:'180'});
//	$(obj2).attr('width',160);
//	$(obj2).attr('height',230);
	$(obj2).attr('src',obj.src); 
} 

function showPop(id,imgurl,order,title){
	var placement = 'right';
	$('#'+id).popover({
		placement:placement,
		//animation:true,
		html:true,
		//content:'<div style="width:160px;height:230px;text-align:center;" ><img style="margin-top:100px;" id="img_'+id+'" width="25" height="25" src="/images/loading3.gif"></div>'
		//content:'<img  id="img_'+id+'" width="120" height="90" src="/images/loading2.gif">'
		content:'<a href="/detail?id='+id+'" target="_blank"><img  id="img_'+id+'"  onmouseover="showThis()" onmouseout="hidePop(\''+id+'\')" width="120" height="180" src="/images/loading3.gif" title="'+title+'"></a>'
	})
	$('#'+id).popover('show');
	Imagess(imgurl,$('#img_'+id),checkimg);
}

function hidePop(id){
	setTimeout('hideThis("'+id+'")', 300);
}

function hideThis(id){
	if(!flag){
		$('#'+id).popover('hide');
	}else{
		flag = false;
	}
	
}

var flag = false;
function showThis(){
	flag = true;
}