/*
ra--DOM元素的id;
da--imgUrl数组;
editable--是否可编辑;
UpLimit--文件上限;
CallBack--超过上限的回调
*/
function initIslider(ra, da, Editable, UpLimit, CallBack){
    var range = $( '#' + ra );
    var addBtn = $('.imgUpLoad').get(0);
    var btnbar = $('.islide-btnbar');
    var fi = document.getElementById('imgUpLoadInput');//上传按钮
    var windowURL = window.URL || window.webkitURL;
    var data = [];//url数据
    var islider = null;
    var firstClick = true;
    var editable = Editable||false;
    var uplimit = UpLimit||10;
    var callBack = CallBack||function(){alert('超过上限！');};

    if(!editable){//如果不可以编辑（删除）
        $('#deleteISliderImg').hide();
        $(addBtn).hide();
    }

    if(da){//如果有预加载数据
        $(da).each(function(i,ele){
            data.push({content:ele});
        });
        rendThum(data);//渲染预加载数据
    }

    //绑定小图片的点击放大事件
    $('body').on('click','#'+ ra +' .pho-mini',function(){
        var that = $(this);
        phominiClick(that);
    });

    //用户选择完图片后
    $("#imgUpLoadInput").change(function(){

        if(fi.files.length + data.length > uplimit){//文件数超过上限
            callBack();//提示
            return false;
        }

        if(fi.files.length + data.length == uplimit){//文件达到上限
            $(addBtn).hide();//隐藏上传按钮
        }

        //获取本地url到data中
        for(var i = 0; i < fi.files.length; i++ ){
            var url = windowURL.createObjectURL(fi.files[i]);
            data.push({content:url});
        }

        //渲染缩略图
        rendThum(data);

        //第一次点击时为缩略图绑定事件
//			if(firstClick){
//				//委托在body上
//				$('body').on('click','#'+ ra +' .pho-mini',function(){
//					console.log(this);
//					var that = $(this);
//					phominiClick(that);
//				});
//			}
    });

    function rendThum(data){//渲染缩略图
        $('.pho-mini',range).remove();
        $(data).each(function(i,ele){
            var thumImg = $('<img src="'+ ele.content +'" class="pho-mini"/>');//生成图片DOM
            thumImg.insertBefore(addBtn);
        });
    }

    function phominiClick(that){

        //如果是第一次点击 初始化islider
        if(firstClick){
            islider = new iSlider({
                dom : document.getElementById('iSlider-wrapper'),
                data : data,
                isOverspread : false
            });
            firstClick = false;

            //返回按钮
            $('#closeISlider').click(function(){
                rendThum(islider.data);
                $('#iSlider-wrapper').hide();
            });

            //删除按钮
            $('#deleteISliderImg').click(function(){
                //删除相册里的内容
                var curIndex = islider.slideIndex;
                console.log('当前:' + islider.slideIndex);
                data.splice(curIndex,1);
                islider.loadData(data);//重新加载数据
                //相册位置调整
                islider.slideTo(curIndex-1);
                btnbar.css({'margin-top':$(document).scrollTop() + 'px'});
                $('.islider-outer > li').css({'margin-top':$(document).scrollTop() + 'px'});

                $(addBtn).show();//显示上传按钮
            });
        }else{
            islider.loadData(data);
        }

        btnbar.show();
        //跳转到当前图片
        var ind = that.index();
        if(ind != 0){
            islider.slideTo(ind);
        }
        //相册位置调整
        btnbar.css({'margin-top':$(document).scrollTop() + 'px'});
        $('.islider-outer > li').css({'margin-top':$(document).scrollTop() + 'px'});
        //显示相册
        $('#iSlider-wrapper').show();
    }
    return data;
}