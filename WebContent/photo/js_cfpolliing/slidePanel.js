;(function($){
    var slidePanel = function(obj,options){

        var self = this;//���湹�캯��

        var range = obj;

        var deafultOptions = {

        }

        this.options = $.extend({ },deafultOptions,options);

        console.log(self.options);

        // ����body
        this.bodyNode = $(document.body);

        //�õ�ҳ���е�DOM
        this.container = $('.slidePanel-container',range);
        this.panel = $('.slidePanel-panel',range);
        this.slideBtn = $('.slidePanel-slideBtn',range);

        var clickFlag = 1;//����������

        //���¼�
        this.slideBtn.bind('click',function(){
            if(clickFlag%2 == 1){//����
                self.up();
            }
            else{
                self.down();
            }
            clickFlag ++;
        });
    };

    slidePanel.prototype = {
        up: function(){//����
            var self = this;
            self.panel.slideUp('fast');
            self.slideBtn.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
        },
        down: function(){//��ʾ
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