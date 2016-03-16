;(function($){
    var FullLoading = function(message){
        var self = this;//保存构造函数

        // 创建遮罩和弹出框
        this.text = '加载中...';
        this.msg = $('<div class="msg"></div>');
        this.popupMask = $('<div class="G-loading-mask"></div>');
        if(message){
            this.text = message;
        }

        // 保存body
        this.bodyNode = $(document.body);

        // 渲染剩余DOM，并插入到body
        this.renderDOM();
        this.hideFullLoading();
    };

    FullLoading.prototype = {
        setMsg : function(msg){
            this.text = msg;
            this.renderDOM();
        },
        rendDOMStyle :function(){
            var winHeight = $(window).height();
            var pt = (winHeight - 84)/2 + $(document).scrollTop();
            this.popupMask.css({'padding-top': pt + 'px'});
        },
        renderDOM: function (){
            //先清空
            this.popupMask.remove();
            //插入body
            this.bodyNode.append(this.popupMask);
            this.popupMask.append(this.msg);
            this.msg.html(this.text);
        },
        hideFullLoading: function(){//隐藏
            this.pagescrollAble();
            this.popupMask.hide();
        },
        showFullLoading: function(){//显示
            this.pagescrollDisable();
            this.popupMask.height($(document).height());
            this.popupMask.show();
            this.rendDOMStyle();
        },
        pagescrollDisable: function(){
            //禁止页面滑动
            document.body.addEventListener('touchmove', stopScroll, false);
        },
        pagescrollAble: function(){
            //允许页面滑动
            document.body.removeEventListener('touchmove', stopScroll, false);
        }
    };
    function stopScroll(event){
        event.preventDefault();
    }
    window['FullLoading'] = FullLoading;
})(jQuery);