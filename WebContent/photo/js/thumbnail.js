;(function($){
    var Thumbnail = function(obj,options){
        var self = this;//保存构造函数

        var range = obj;

        var deafultOptions = {
            editable : true,
            delete : function(){
            }
        }

        this.options = $.extend({ },deafultOptions,options);

        // console.log(self.options);

        // 创建遮罩
        this.popupMask = $('<div class="thumbnail-phoPanel"></div>');

        //保存数据
        this.curImgSrc = null;
        this.currentPhomini = null;//当前选中的phomini元素

        // 保存body
        this.bodyNode = $(document.body);

        // 渲染剩余DOM，并插入到body
        this.renderDOM();
        this.hideBigPho();

        //得到页面中的DOM
        this.loadingImg = this.popupMask.find('img');
        this.bigImg = this.popupMask.find('.pho-big');
        this.delBtn = this.popupMask.find('.thumbnail-btn-delete');
        if(!self.options.editable){
            this.popupMask.find('.btn').hide();
        }

        this.phoMini = $('.thumbnail-container .pho-mini',range);
        //绑定事件
        this.phoMini.bind('click',function(){
            self.curImgSrc = $(this).attr('src');
            self.bigImg.attr('src',self.curImgSrc);
            self.currentPhomini = $(this);
            self.showBigPho();
        });
        this.popupMask.bind('click',function(){
            self.hideBigPho();
        });
        this.delBtn.bind('click',function(){
            self.options.delete(self.currentPhomini);//callback
            self.currentPhomini.remove();
        });

    };

    Thumbnail.prototype = {
        rendDOMStyle :function(){
            var self = this;
            var winHeight = $(window).height();
            this.popupMask.css({'top':$(document).scrollTop(),
                                  'padding-top': (winHeight - self.popupMask.find('.pho-big').height())/2 + 'px',
                                  'height':winHeight
                            });

        },
        renderDOM: function (){
            var strDOM =    '<img src="img/ph.png" alt="" class="pho-big">'+
                            '<div class="btn-group"><button class="btn btn-primary">确定</button> <button class="btn btn-danger thumbnail-btn-delete">删除</button>'+
                            '</div>';
            //插入body
            this.bodyNode.append(this.popupMask);
            this.popupMask.append(strDOM);

            //调整样式
            this.rendDOMStyle();
        },
        hideBigPho: function(){//隐藏
            this.pagescrollAble();
            this.popupMask.hide();
        },
        showBigPho: function(){//显示
            this.pagescrollDisable();
            this.popupMask.show();
            this.rendDOMStyle();//调整样式
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
    $.fn.extend({
        thumbnail : function(opts){
            return this.each(function(){
                new Thumbnail(this, opts);
            });
        }
    })
    window['Thumbnail'] = Thumbnail;
})(jQuery);