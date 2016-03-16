var satisfyController = {
    openId : null,
    rtx : null,
    satisfactionBwrId : 0, //评价页面，bwr_id
    satisfactionMap : [], //评价的数据字典
    serverAddr : 'http://127.0.0.1:8180',

    init : function(){
        //初始化评价页面
        satisfyController.initSatisfactionPage();

        //初始化fullLoading
        satisfyController.fullLoading = new FullLoading();
        satisfyController.fullLoading.setMsg("提交中...");

        //绑定提交评价按钮
        $("#satisfactionSubmit").click(satisfyController.doSatisfaction);
    },

    //初始化评价页面
    initSatisfactionPage : function(){
        var url = satisfyController.serverAddr + "/archibus/cxf/weChatWorkOrderService/getWeChatSatisfaction";
        $.ajax({
            url: url,
            type: 'POST',
            // data: JSON.stringify(dto),
            contentType : "application/json",
            success: function (returndata) {
                var ok = true;
                if(returndata == null) {
                    ok = false;
                }
                console.log(returndata);

                var contents = returndata.data.contents;
                if(contents == null) {
                    ok = false;
                }

                if(ok){
                    satisfyController.satisfactionMap = contents;
                    var html = satisfyController.generateSatisfactionHtml(contents);
                    $("#satisfactionLevels").html(html);
                }
            },
            error: function (returndata) {

            }
        });
    },

    //生成评价页面html
    generateSatisfactionHtml : function(data){
        var html = "";
        for(var key in data){
            var value = data[key];
            var radio = '<div class="raidogop">'
                +'<input value="' + key + '" type="radio" name="satisfaction"/>'
                + '<span>' + value + '</span></div>';

            html += radio;
        }
        html += '<textarea name="description" rows="4" placeholder="有什么想说的尽管来吐槽吧！"></textarea>';
        return html;
    },

    //评价
    doSatisfaction : function(){
        //获取评价信息
        var level = $('#satisfactionLevels input[name="satisfaction"]:checked').val();
        var description = $('#satisfactionLevels textarea[name="description"]').val();

        //验证评价信息
        if(level == null || level == ""){
            // alert("请选择满意度");
            satisfyController.message("请选择满意度");
            return;
        }
        // if(description == null || description == ""){
        //  // alert("描述不能为空");
        //  satisfyController.message("描述不能为空");
        //  return;
        // }
        var descLen = description.length;
        if(descLen > 200){
            // alert("描述最多200个字符");
            satisfyController.message("描述最多200个字符");
            return;
        }

        //获取评价中文
        var satisfactionCh = satisfyController.satisfactionMap[level];
        if(description != null && descLen > 0){
            satisfactionCh += "(" + description + ")";
        }

        //提交评价
        var data = {};
        data["level"] = level;
        data["description"] = description;
        data["rtx"] = satisfyController.rtx;
        data["openId"] = satisfyController.openId;

        satisfyController.confirm("你确定要提交评价吗？",function(){
            satisfyController.fullLoading.showFullLoading();

            var bwrId = satisfyController.satisfactionBwrId;
            var url = satisfyController.serverAddr + "/archibus/cxf/weChatWorkOrderService/doWeChatSatisfaction/" + bwrId;
            $.ajax({
                url: url,
                type: 'POST',
                data: JSON.stringify(data),
                contentType : "application/json",
                success: function (returndata) {
                    console.log(returndata);
                    if(returndata.status == true){

                        //清空并隐藏评价页面
                        $('#satisfactionLevels input[name="satisfaction"]').removeAttr('checked');
                        $('#satisfactionLevels textarea[name="description"]').val('');
                        $('#myModal').modal('hide');
                        
                        //隐藏详情页面评价按钮
                        if(satisfyController.bwrId == satisfyController.satisfactionBwrId){
                            $("#detailPageSatisfyBtn").remove();
                        }
                        //隐藏list中，对应的评价按钮
                        var bwr_id_class = 'bwr_id_' + bwrId;
                        $(".work-item-container .work-item ." + bwr_id_class).remove();
                        //更新详情和list中，对应的评价信息
                        var bwr_id_val_class = 'bwr_id_val_' + bwrId;
                        $("." + bwr_id_val_class).html(satisfactionCh);

                        satisfyController.message("评价成功");
                    }else{
                        var errorMsg = '';
                        if(returndata.message == 'noRecord'){
                            errorMsg = '工单不存在';
                        }else if(returndata.message == 'notComplete'){
                            errorMsg = '工单未完成，暂时不能评价';
                        }else if(returndata.message == 'haveEvaluation'){
                            errorMsg = '您已评价过此工单';
                        }else if(returndata.message == 'errorSatisfaction'){
                            errorMsg = '工单未完成，暂时不能评价';
                        }else if(returndata.message == 'badParameter'){
                            errorMsg = '评价失败：参数不完整';
                        }else if(returndata.message == 'notRequestor'){
                            errorMsg = '您不是此工单的保障人，不能评价';
                        }else{
                            errorMsg = '评价失败：' + returndata.message;
                        }
                        satisfyController.message(errorMsg);
                    }
                    satisfyController.fullLoading.hideFullLoading();
                },
                error: function (returndata) {
                    satisfyController.fullLoading.hideFullLoading();
                    satisfyController.message("评价失败，请重试");
                }
            });
        });
    },

    //确定or取消
    confirm : function(message, callback){
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
            shade.remove();
        });
        $('.submit',shade).bind('click',function(){
            shade.remove();
            callback();
        });

        var re = /\d+/;
        var conWidth = $('.container',shade).css('height');
        var usew = re.exec(conWidth);
        var npd = ($(window).height() - usew)/2 + $(document).scrollTop();
        shade.css({'padding-top': npd +'px'});//垂直居中
    },

    //消息通知
    message : function(message, time){
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
    },

    getRtxOpenID : function(){
        var strUrl = window.location.href;
        var arrUrl = strUrl.split("/");
        var strPage = arrUrl[arrUrl.length-1];
        var indexof = strPage.indexOf("?");
        var rtx = "";
        var openId = "";
        var bwrId = "";
        if(indexof != -1){
            strPage = strPage.substr(indexof+1, strPage.length);
            var params = strPage.split('&');
            if(params == null || params.length <= 0){
                satisfyController.showBodyPage(false);
                return;
            }

            for(var i=0; i<params.length; i++){
                var param = params[i];
                if(param.indexOf("rtx=") != -1){
                    rtx = param.substr(param.indexOf("rtx=")+4);
                }
                if(param.indexOf("openId=") != -1){
                    openId = param.substr(param.indexOf("openId=")+7);
                }
                if(param.indexOf("bwrId=") != -1){
                    bwrId = param.substr(param.indexOf("bwrId=")+6);
                    satisfyController.satisfactionBwrId = bwrId;
                }
            }
            if(rtx == '' || openId == ''){
                satisfyController.showBodyPage(false, 'notLogin');
            }else if(bwrId == ''){
                satisfyController.showBodyPage(false, 'noBwrId');
            }else{
                satisfyController.openId = openId;
                satisfyController.rtx = rtx;

                satisfyController.showBodyPage(true);
                satisfyController.init();
            }
        }else{
            satisfyController.showBodyPage(false);
            return;
        }
    },

    showBodyPage : function(ok, type){
        if(ok){
            $("body").show();
        }else{
            if(type == 'noBwrId'){
                $("body").html("参数错误");
                $("body").show();
            }else{
                $("body").html("未登录");
                $("body").show();
            }
        }
    }
}
satisfyController.getRtxOpenID();