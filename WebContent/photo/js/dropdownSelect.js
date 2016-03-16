(function($){
    function DropdownSelect(el,options){//构造函数 传入元素
        var self = this;
        var status = 'close'; //open

        var deafultOptions = {
            selectCallback : function(){
            }
        }

        this.options = $.extend({ },deafultOptions,options);
        this.$menu = $('.dropdownSelect-menu',el);
        this.$valCon = $('.value-container',el);
        this.$choseItem = $('.dropdownSelect-menu li',el);
        this.$arrowflag = $('.arrowflag',el);
        this.$hidebar = $('.hidebar',el);
        this.clickflag = 1;//标记点击的奇偶

        //保存数据
        this.choseItem = null;//当前选中的li项
        this.value = null;//当前选中的li项的value

        //DOM绑定

        this.$choseItem.bind('click',function(){ //选中某个li
          self.choseItem = $(this);
          $.proxy(self._changeVal(),self);
          self.options.selectCallback(self.choseItem);//回调
        });

        $(el).bind('click',function(){
            if(self.status == 'open'){
              $.proxy(self._close(),self);
            }else{
              $.proxy(self._open(),self);
            }
        });

        self._init();
    }

    DropdownSelect.prototype._init = function(){//初始化
        this.$menu.hide();
        this.$hidebar.hide();

        //数据初始化
        this.choseItem = this.$choseItem.first();
        this.value = this.choseItem.attr('value');
        this.$valCon.attr('value',this.value);
        this.$valCon.html(this.value);
    };

    DropdownSelect.prototype._changeVal = function (){
         this.$choseItem.show();//显示所有项（之前被隐藏掉的选中项）
         var self = this.choseItem;
         var newVal = self.attr('value');
         this.$valCon.attr('value',newVal);
         this.$valCon.html(newVal);
         self.hide();//隐藏掉当前被选上去的项
         this.value = newVal;
     };

    DropdownSelect.prototype._open = function(){
        this.status = 'open';
        this.$menu.show();
        this.$hidebar.show();
        this.$arrowflag.addClass('glyphicon-triangle-top').removeClass('glyphicon-triangle-bottom');
    }

    DropdownSelect.prototype._close = function(){
        this.status = 'close';
        this.$menu.hide();
        this.$hidebar.hide();
        this.$arrowflag.addClass('glyphicon-triangle-bottom').removeClass('glyphicon-triangle-top');
    }
    $.fn.extend({
        DropdownSelect : function(opts){
            return this.each(function(){
                new DropdownSelect(this, opts);
            });
        }
    })
    window['DropdownSelect'] = DropdownSelect;
})(jQuery);;