(function($){
    function dropdownSelect(el){//构造函数 传入元素
        var self = this;
        this.$menu = $('.dropdownSelect-menu',el);
        this.$valCon = $('.value-container',el);
        this.$choseItem = $('.dropdownSelect-menu li',el);
        this.$arrowflag = $('.arrowflag',el);
        this.$hidebar = $('.hidebar',el);
        this.clickflag = 1;//标记点击的奇偶
        this.choseItem;
        this.value;

        //DOM绑定
        this.$choseItem.bind('click',function(){
          self.choseItem = $(this);
          $.proxy(self._changeVal(),self);
        });

        $(el).bind('click',function(){
            if(self.clickflag%2 == 0){//是偶数
                $.proxy(self._close(),self);
            }
            else{
                $.proxy(self._open(),self);
            }
            self.clickflag++;
        });

        self._init();
    }

    dropdownSelect.prototype._init = function(){//初始化
         this.$menu.hide();
        this.$hidebar.hide();
    };

    dropdownSelect.prototype._changeVal = function (){
         this.$choseItem.show();//显示所有项（之前被隐藏掉的选中项）
         var self = this.choseItem;
         var newVal = self.attr('value');
         this.$valCon.attr('value',newVal);
         this.$valCon.html(newVal);
         self.hide();//隐藏掉当前被选上去的项
         this.value = newVal;
     };

    dropdownSelect.prototype._open = function(){
        this.$menu.show();
        this.$hidebar.show();
        this.$arrowflag.addClass('glyphicon-triangle-top').removeClass('glyphicon-triangle-bottom');
    }

    dropdownSelect.prototype._close = function(){
        this.$menu.hide();
        this.$hidebar.hide();
        this.$arrowflag.addClass('glyphicon-triangle-bottom').removeClass('glyphicon-triangle-top');
    }

    $.fn.extend({
        dropdownSelect:function(){
            return this.each(function(){
                new dropdownSelect(this);
            });
        }
    });

     return {
        dropdownSelect : dropdownSelect
     }
})(jQuery);;