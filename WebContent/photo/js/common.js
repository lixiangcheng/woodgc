//取消确定弹出框
function confirm   (message, callback){
    var shade = $('<div class="popbg">' +
        '<div class="container">' +
        '<span class="text">' + message + '</span>' +
        '<div class="btngroup">' +
        '<button class="submit">确定</button>' +
        '<button class="close">取消</button>' +
        '</div></div></div>');

    $('body').append(shade);
    $('.popbg').height($(document).height());

    $('.close',shade).bind('click',function(){
        $('.popbg').remove();
    });
    $('.submit',shade).bind('click',function(){
        callback();
        $('.popbg').remove();
    });

    var re = /\d+/;
    var conWidth = $('.container',shade).css('height');
    var usew = re.exec(conWidth);
    var npd = ($(window).height() - usew)/2 + $(document).scrollTop();
    shade.css({'padding-top': npd +'px'});//垂直居中
}

//自动消失提示框
function message(message, time){
    var shade = $('<div class="popbgshade">' +
        '<div class="container">' +
        '<span class="text">' + message + '</span>' +
        '</div></div>');

    if(time){
        time = time * 1000;
    }else{
        time = 1000;
    }

    $('body').append(shade);
    shade.css({'margin-top':$(window).scrollTop()});
    setTimeout(function(){
        $(shade).fadeOut(function(){
            $(shade).remove();
        });
    },time);
}




//正在加载...
function bindScrollNextPage(url){
    $(document).bind('scroll',function(url){
        loadNextPage(url);
    });
}

var loadingIcon = $('<li class="work-item loading"><img src="img/loading.gif" style="width:1.8em;"/>正在加载...</li>');
var loadingFail = $('<li class="work-item loading">加载失败</li>');
function loadNextPage(url){
    function showLoadingIcon(url){
        $('.work-item-container').append(loadingIcon);
    }
    function hideLoadingIcon(){
        loadingIcon.remove();
    }
    var winHei = $(window).height();
    var docHei = $(document).height();
    var sT = $(document).scrollTop();

    //if(sT >= (docHei-winHei)){
    //    $(document).unbind('scroll');//解绑，防止多次触发
    //    console.log($('work-item-container'));
    //    alert(1);
    //    showLoadingIcon();
    //    $(document).scrollTop($(document).height());//滚到底部
    //    $.ajax({
    //        url:url,
    //        success:function(data){
    //            bindScrollNextPage();
    //        },
    //        error:function(){
    //            bindScrollNextPage();
    //        }
    //    });
    //}
}

//full-loading的高度
$(document).ready(function(){
    var fuH = $(window).height() - $('.mytab').height() + $('.turnback').height();
    $('.full-loading').height(fuH - 30);
    $('.full-loading').css({'padding-top' : fuH/2 + 'px'});
});


//全屏正在加载...
var strDOM = 	'<div class="G-loading-mask">'+
    '<img src="img/loading.gif" alt=""/>'+
    '</div>';
$('.G-loading-mask').height($(document).height());
var gpt = $(window).scrollTop() + ($(window).height()-$('.G-loading-mask img').height())/2 + 'px';
$('.G-loading-mask').css({'padding-top':gpt});
