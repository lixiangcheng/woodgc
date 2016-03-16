;(function($){
    var slidePanel = function(obj,options){

        var self = this;//保存构造函数

        var range = obj;

        var deafultOptions = {

        }

        this.options = $.extend({ },deafultOptions,options);

        console.log(self.options);

        // 保存body
        this.bodyNode = $(document.body);

        //得到页面中的DOM
        this.container = $('.slidePanel-container',range);
        this.panel = $('.slidePanel-panel',range);
        this.slideBtn = $('.slidePanel-slideBtn',range);

        var clickFlag = 1;//保存点击次数

        //绑定事件
        this.slideBtn.bind('click',function(){
            if(clickFlag%2 == 1){//奇数
                self.up();
            }
            else{
                self.down();
            }
            clickFlag ++;
        });
    };

    slidePanel.prototype = {
        up: function(){//隐藏
            var self = this;
            self.panel.slideUp('fast');
            self.slideBtn.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
        },
        down: function(){//显示
            var self = this;
            self.panel.slideDown('fast');
            self.slideBtn.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
        }
    };
    $.fn.extend({
        slidePanel : function(opts){
            return this.each(function(){
                new slidePanel(this, opts);
            });
        }
    })
    window['slidePanel'] = slidePanel;
})(jQuery);