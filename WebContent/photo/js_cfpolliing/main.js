requirejs.config({
    paths:{
        jquery:'jquery-2.1.4.min'
    }
});

requirejs(['jquery','dropdownSelect'],function($,dropdownSelect){
   var a = $('.dropdownSelect-container').dropdownSelect();
   console.log(a);
});