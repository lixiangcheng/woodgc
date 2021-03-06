var loadingIcon = $('<li class="work-item loading"><img src="img/loading.gif" style="width:1.8em;"/>正在加载...</li>');
var loadingFail = $('<li class="work-item loading">没有数据</li>');
var wechatController = {
	openId : null,
	rtx : null,
	imgMaxSize : 4, //上传图片size上限，单位MB
	imgCount : 0, //已经选择的图片数量，目前最多4张
	docNames : {"upload_doc1":null,"upload_doc2":null,"upload_doc3":null,"upload_doc4":null}, //标记获取的文件名
	currentPage : 'fast', //当前的页面(fast,my,detail,myModal)
	lastPage : 'fast', //上一个页面(fast,my,detail,myModal)(快速报障、列表、详情、评价)
	bwrId : 0, //详情页面，bwr_id
	lastBwrId : 1, //详情页面，上一个bwr_id，用于判断详情页数据id是否变化
	satisfactionBwrId : 0, //评价页面，bwr_id
	pageNumber : 0,
	pageSize : 10,
	isLastPage : false, //是否已经到最后一页（即返回数据length==0）
	fullLoading : null, //提交报障和评价时，全屏覆盖的loading（提交中...）
	blId : null, //快速报障，选择的大厦bl_id
	flId : null, //快速报障，选择的对应的fl_id
	existFlIds : {}, //在自动获取flIds时，存储已经获取过的大厦的楼层ids
	longitude : 0, //定位 经度
	latitude : 0, //定位 纬度
	satisfactionMap : [], //评价的数据字典
	listScrollHeight : 0, //工单列表，跳转到详情页面之前的滚动高度
	islider : null, //快速保障，大图预览的islider对象
	serverAddr : 'http://oss.esb.oa.com/admzhushouIDC/reoacom',
	agentUrl:'https://xz.m.tencent.com/admwechat/fm/wechat/workOrderData.php',

	init : function(){
		//初始化location页面数据
		WechatLocation.generateBlHtml('mobiBls');

		//获取定位
		wechatController.getGeolocation();

		//初始化fullLoading
		wechatController.fullLoading = new FullLoading();
		wechatController.fullLoading.setMsg("提交中...");

		//绑定添加图片按钮
		$("#upload_img_pick").click(function(){
			if(wechatController.imgCount >= 4){
				return;
			}

			var inputId = "upload_doc1";
			if(wechatController.docNames["upload_doc1"] == null){
				inputId = "upload_doc1";
			}else if(wechatController.docNames["upload_doc2"] == null){
				inputId = "upload_doc2";
			}else if(wechatController.docNames["upload_doc3"] == null){
				inputId = "upload_doc3";
			}else if(wechatController.docNames["upload_doc4"] == null){
				inputId = "upload_doc4";
			}else{
				return;
			}
			wechatController.runClick(inputId);
		});

		//绑定file input的选择事件
		$("#upload_doc1").change(wechatController.showLocalImg);
		$("#upload_doc2").change(wechatController.showLocalImg);
		$("#upload_doc3").change(wechatController.showLocalImg);
		$("#upload_doc4").change(wechatController.showLocalImg);

		//绑定 提交 按钮
		$("#formSubmit").click(function(){
			wechatController.submitForm();
		});

		//绑定tab切换，判断目前处于哪个页面(快速报障、列表页、详情)
		//(显示之前)
		$(".mytab a[data-toggle='tab']").on('show.bs.tab', function(e){
			var currentPage = e.target;
			var lastPage = e.relatedTarget;
			wechatController.currentPage = currentPage.getAttribute("tabname");
			wechatController.lastPage = lastPage.getAttribute("tabname");

			if(wechatController.currentPage == 'detail'){
				//清除原来detail内容
				if(wechatController.bwrId != wechatController.lastBwrId){
					wechatController.clearDetailPage();
				}
			}else if(wechatController.currentPage == 'my'){
				//清空原来的my列表
				if(wechatController.lastPage == 'fast'){
					$("#my_list_ul").html('');
					wechatController.pageNumber = 0;
					wechatController.isLastPage = false;
					wechatController.listScrollHeight = 0;
					wechatController.loadListNextPage();
				}
			}
		});
		//(显示之后)
		$(".mytab a[data-toggle='tab']").on('shown.bs.tab', function(e){
			if(wechatController.currentPage == 'detail'){
				//重新获取detail内容
				if(wechatController.bwrId != wechatController.lastBwrId){
					wechatController.fetchDetailPage();
				}
			}else if(wechatController.currentPage == 'my'){
				if(wechatController.listScrollHeight != 0){
					$(document).scrollTop(wechatController.listScrollHeight);
				}
			}
		});

		//绑定提交评价按钮
		$("#satisfactionSubmit").click(wechatController.doSatisfaction);

		//绑定islder的返回和删除按钮
		wechatController.init_islider_btn();

		//初始化list页面
		// wechatController.loadListNextPage();

		//初始化评价页面
		wechatController.initSatisfactionPage();

		//绑定页面滚动事件(用于列表自动加载更多)
		wechatController.bindScrollNextPage();
	},

	initMobiscroll : function(ok){
		//未定位成功，则只初始化插件
		if(ok == false || (wechatController.longitude==0 && wechatController.latitude==0)){
			wechatController.initMobiBls(null);
			wechatController.initMobiFls(null);
			return;
		}

		//通过定位，获取最近的大厦
		var longitude = wechatController.longitude;
		var latitude = wechatController.latitude;
		// longitude = 113.9297475;
		// latitude = 22.54351631;
		var bl = WechatLocation.getNearestBlId(longitude, latitude);
		wechatController.blId = bl.id;

		//初始化mobi控件(bl)
		var defaultValue = [bl.city, bl.id + WechatLocation.splitStr + bl.name];
		wechatController.initMobiBls(defaultValue);

		//初始化mobi控件(fl)
		wechatController.initMobiFls(wechatController.blId);
	},

	//初始化大厦mobiscroll
	initMobiBls : function(defaultValue){
		$('#mobiBls').mobiscroll().treelist({
			theme: 'mobiscroll',
			display: 'bottom',
			lang: 'zh',
			fixedWidth: [100,160,160],
			placeholder: '请选择...',
			labels: ['城市','大厦'],
			// defaultValue : ['深圳','TX-SZ____腾讯大厦'],
			defaultValue : defaultValue,
			onSelect: function(valueText){
				//在选择的时候，重新获取楼层，并重新初始化mobiFls
				wechatController.initMobiFls(wechatController.blId);
			},
			formatValue: function(data){
				var bl = data[1];
				var splits = bl.split(WechatLocation.splitStr);
				var blId = splits[0];
				wechatController.blId = blId;

				return data[0] + ' ' + splits[1];
			}
		});

		//页面显示默认值
		if(defaultValue != null){
			var defaultText = defaultValue[0] + ' ' + defaultValue[1].split(WechatLocation.splitStr)[1];
			$("#mobiBls_dummy").val(defaultText);
		}
	},

	//初始化楼层mobiscroll
	initMobiFls : function(blId){
		if(blId == null || blId == ""){
			var flIds = [];
			wechatController.initMobiFlsPage(flIds);
			return;
		}

		if(wechatController.existFlIds[blId] != null){
			var flIds = wechatController.existFlIds[blId];
			wechatController.initMobiFlsPage(flIds);
			return;
		}

		
		var url = wechatController.agentUrl;
		var param = ""+blId+"/flIds";
		$.ajax({
			url: url,
			//type: 'POST',
			//contentType : "application/json",
			type:"GET",
			dataType:"json",
			data:{cmd:'weChatWorkOrderService/bl/',param:param},
			success: function (returndata) {
				console.log(returndata);
               
				var flIds = returndata.data.contents;
				wechatController.initMobiFlsPage(flIds);
			},
			error: function (returndata) {
				console.log(returndata);
			}
		});
		/*var url = wechatController.serverAddr + "/archibus/cxf/weChatWorkOrderService/bl/" + blId + "/flIds";
		$.ajax({
			url: url,
			type: 'POST',
			contentType : "application/json",
			success: function (returndata) {
				console.log(returndata);

				var flIds = returndata.data.contents;
				wechatController.initMobiFlsPage(flIds);
			},
			error: function (returndata) {
				console.log(returndata);
			}
		});*/
	},

	//重新生成楼层html，并初始化mobi插件
	initMobiFlsPage : function(flIds){
		WechatLocation.generateFlHtml("mobiFls", flIds);
		// wechatController.flId = flIds[0];
		wechatController.flId = null; //楼层必须让用户选择
		$('#mobiFls').mobiscroll().select({
			theme: 'mobiscroll',
			lang: 'zh',
			display: 'bottom',
			minWidth: 200,
			placeholder: '请选择...',
			onSelect : function(valueText){
				wechatController.flId = valueText;
			}
		});
		$("#mobiFls_dummy").val('');
	},

	//触发click事件
	runClick : function(id){
        var element = document.getElementById(id);
        if (document.all) {
            // For IE
            element.click();
        } else if (document.createEvent) {
            //FOR DOM2
            var ev = document.createEvent('HTMLEvents');
            ev.initEvent('click', false, true);
            element.dispatchEvent(ev);
        }
    },

    //(file input的change事件的处理)显示本地图片
    showLocalImg : function (event) {
		//获取需要显示的
		var inputId = this.id;
		var imgId =  inputId.replace("upload_doc","upload_img");
		console.log("inputId = " + inputId);
		console.log("imgId = " + imgId);

		// 根据这个 <input> 获取文件的 HTML5 js 对象
		var files = event.target.files, file;
		if (files && files.length > 0) {
			// 获取目前上传的文件
			file = files[0];
			// 来在控制台看看到底这个对象是什么
			// console.log(file);
			// 那么我们可以做一下诸如文件大小校验的动作
			// if(file.size > 1024 * 1024 * wechatController.imgMaxSize) {
			// 	wechatController.clearFileInputField(inputId);
			// 	alert('图片大小不能超过 ' + wechatController.imgMaxSize + 'MB!');
			// 	return false;
			// }

			// 文件名不可重复校验
			// var fileName = file.name;
			// if(wechatController.docNames["upload_doc1"] == fileName
			// 	|| wechatController.docNames["upload_doc2"] == fileName
			// 	|| wechatController.docNames["upload_doc3"] == fileName
			// 	|| wechatController.docNames["upload_doc4"] == fileName){

			// 	wechatController.clearFileInputField(inputId);
			//  alert('图片 ' + fileName + ' 已存在!');
			// 	return false;
			// }
			// wechatController.message(file.name);

			// !!!!!!
			// 下面是关键的关键，通过这个 file 对象生成一个可用的图像 URL

			// 获取 window 的 URL 工具
			var URL = window.URL || window.webkitURL;
			// 通过 file 生成目标 url
			var imgURL = URL.createObjectURL(file);
			// 用这个 URL 产生一个 <img> 将其显示出来
			// $('body').append($('<img/>').attr('src', imgURL));

			var imgHtml = '<img src="' + imgURL + '" class="pho-mini" id="' + imgId + '"/>';
			$("#upload_img_pick").before(imgHtml);

			// 使用下面这句可以在内存中释放对此 url 的伺服，跑了之后那个 URL 就无效了
			// URL.revokeObjectURL(imgURL);

			//修改全局数据
			wechatController.imgCount += 1;
			wechatController.docNames[inputId] = file.name;
			if(wechatController.imgCount >= 4){
				$("#upload_img_pick").hide();
			}

			//绑定新增图片的点击事件
			$("#"+imgId).click(wechatController.showBigImg);

			//返回操作成功
			// console.log(wechatController);
		}
	},

	//清除file input已经选中的文件信息
	clearFileInputField : function(id){
		var obj = document.getElementById(id);
		obj.outerHTML = obj.outerHTML;

		//修改全局数据
		wechatController.docNames[id] = null;
		wechatController.imgCount -= 1;
		if(wechatController.imgCount < 4){
			$("#upload_img_pick").show();
		}

		//重新绑定change事件
		$("#"+id).change(wechatController.showLocalImg);
	},

	//iSlider
	showBigImg : function(){
		var phoMin = $(this);
		var src = phoMin.attr('src');

		var data = [];
		var index = 0;
		for(var i=1; i<=4; i++){
			var upload_img = $('#upload_img' + i);
			if(upload_img == null){
				continue;
			}
			var img_src = upload_img.attr('src');
			if(img_src == null || img_src == ''){
				continue;
			}
			if(img_src == src){
				index = i-1;
			}
			data.push({content:img_src});
		}

		if(wechatController.islider == null){
			wechatController.islider = new iSlider({
				dom : document.getElementById('iSlider-wrapper'),
				data : data,
				isOverspread : false
			});
		}else{
			wechatController.islider.loadData(data);
		}
		wechatController.islider.slideTo(index);

		$('.islide-btnbar').show();
		$('#deleteISliderImg').show();
		$('#iSlider-wrapper').show();
	},

	init_islider_btn : function(){
		//iSlider返回键
		$('#closeISlider').click(function(){
			$('.islide-btnbar').hide();
			$('#iSlider-wrapper').hide();
		});
		$('#deleteISliderImg').click(function(){
			//删除相册里的内容
			var index = wechatController.islider.slideIndex;
			var data = wechatController.islider.data;
			var src = data[index].content;

			data.splice(index, 1);
			wechatController.islider.loadData(data);
			wechatController.islider.slideTo(index - 1);

			//删除缩略图和清空对应的input
			var upload_img = null;
			for(var i=1; i<=4; i++){
				upload_img = $('#upload_img' + i);
				if(upload_img == null){
					continue;
				}
				var img_src = upload_img.attr('src');
				if(img_src == null || img_src == ''){
					continue;
				}
				if(img_src == src){
					break;
				}
			}
			var imgId = upload_img.attr("id");
			var inputId =  imgId.replace("upload_img", "upload_doc");
			wechatController.clearFileInputField(inputId);
			upload_img.remove();

			//判断是否是最后一张，是则隐藏浏览插件
			if(data.length <= 0){
				$('.islide-btnbar').hide();
				$('#iSlider-wrapper').hide();
			}
		});
	},

	//点击图片，显示大图(快速报障中)
	showBigImg_bak : function(){
        //禁止页面滑动
        document.body.addEventListener('touchmove', stopScroll, false);
		var winHei = $(window).height();
		var winWidth = $(window).width();
		var phoMin = $(this);
		var phoBig = phoMin.clone();

		var img = new Image();
		img.src = phoMin.attr('src');

		phoBig.removeClass('pho-mini').addClass('pho-big');
		//添加DOM
		var phoPanel = $('<div class="phoPanel"><div class="btn-group"><button class="btn btn-primary">确定</button> <button class="btn btn-danger">删除</button></div></div>');
		phoPanel.appendTo('.fast');
		phoBig.prependTo(phoPanel);

		//计算图片大小及位置
		phoPanel.height($(document).height());
		phoPanel.css({'padding-top':$(document).scrollTop() + 'px'});
		img.onload = function(){
			var mt = winHei - phoBig.height()
			phoBig.css({'padding-top':mt/2 + 'px'});
		}

		phoBig.bind('click',function(){
			phoPanel.remove();
			//允许页面滑动
            document.body.removeEventListener('touchmove', stopScroll, false);
		});
		$('.btn',phoPanel).bind('click',function(){
			phoPanel.remove();
			//允许页面滑动
            document.body.removeEventListener('touchmove', stopScroll, false);
		});
		$('.btn-danger',phoPanel).bind('click',function(){
			phoMin.remove();

			//清空 file input 信息
			var imgId = phoMin.attr("id");
			var inputId =  imgId.replace("upload_img", "upload_doc");
			wechatController.clearFileInputField(inputId);
			//允许页面滑动
            document.body.removeEventListener('touchmove', stopScroll, false);
		});
	    function stopScroll(event){
	        event.preventDefault();
	    }
	},

	//验证并提交保障
	submitForm : function(){
		//获取数据
		var location = $("#formElementLocation").val();
		var description = $("#formElementDescription").val();
		var blId = wechatController.blId;
		var flId = wechatController.flId;
		var openId = wechatController.openId;
		var rtx = wechatController.rtx;
		// var rtx = 'jiessieliu';

		//验证数据
		if(blId == null || blId == ""){
			// alert("所在大厦没有选择");
			wechatController.message("所在大厦没有选择");
			return;
		}
		// if(flId == null || flId == ""){
		// 	// alert("所在楼层没有选择");
		// 	wechatController.message("所在楼层没有选择");
		// 	return;
		// }
		if(location == null || location == ""){
			// alert("位置不能为空");
			wechatController.message("位置不能为空");
			return;
		}
		var locationLen = location.length;
		if(locationLen > 20){
			wechatController.message("位置最多20个字符");
			return;
		}
		if(description == null || description == ""){
			// alert("描述不能为空");
			wechatController.message("描述不能为空");
			return;
		}
		var descLen = description.length;
		if(descLen > 200){
			// alert("描述最多200个字符");
			wechatController.message("描述最多200个字符");
			return;
		}

		//提交数据
        var formData = new FormData($("#uploadImgForm")[0]);
        formData.append("blId", blId);
        formData.append("flId", flId);
        formData.append("location", location);
        formData.append("description", description);
        formData.append("openId", openId);
        formData.append("rtx", rtx);

        wechatController.confirm("你确定要提交吗？", function(){
        	wechatController.fullLoading.showFullLoading();
			
			var url = wechatController.agentUrl+"?cmd=weChatWorkOrderService/uploadFile";
			var param = formData;
			$.ajax({
				url: url,
				type:"POST",
				dataType:"json",
				//data:{cmd:'weChatWorkOrderService/uploadFile',param:param},
				data:formData,
				async: true,
				cache: false,
				contentType: false,
				processData: false,
				success: function (returndata) {
					console.log(returndata);
					if(returndata == 'error'){
						wechatController.message("报障失败：参数不完整");
					}else{
						//清空表单
						$("#formElementLocation").val('');
						$("#formElementDescription").val('');
						wechatController.clearFileInputField('upload_doc1');
						wechatController.clearFileInputField('upload_doc2');
						wechatController.clearFileInputField('upload_doc3');
						wechatController.clearFileInputField('upload_doc4');
						$("#upload_img1").remove();
						$("#upload_img2").remove();
						$("#upload_img3").remove();
						$("#upload_img4").remove();

						wechatController.message("报障成功");

						//将刚刚添加成功的保障，添加到列表开头
						// wechatController.loadLastNextPage();
					}
					wechatController.fullLoading.hideFullLoading();
				},
				error: function (returndata) {
					console.log(returndata);
					//wechatController.fullLoading.hideFullLoading();
					//wechatController.message("报障失败");
					if(returndata == 'error'){
						wechatController.message("报障失败：参数不完整");
					}else{
						//清空表单
						$("#formElementLocation").val('');
						$("#formElementDescription").val('');
						wechatController.clearFileInputField('upload_doc1');
						wechatController.clearFileInputField('upload_doc2');
						wechatController.clearFileInputField('upload_doc3');
						wechatController.clearFileInputField('upload_doc4');
						$("#upload_img1").remove();
						$("#upload_img2").remove();
						$("#upload_img3").remove();
						$("#upload_img4").remove();

						wechatController.message("报障成功");

						//将刚刚添加成功的保障，添加到列表开头
						// wechatController.loadLastNextPage();
					}
					wechatController.fullLoading.hideFullLoading();
				}
			});

        	/*var url = wechatController.serverAddr + "/archibus/cxf/weChatWorkOrderService/uploadFile";
	        $.ajax({
				url: url,
				type: 'POST',
				data: formData,
				async: true,
				cache: false,
				contentType: false,
				processData: false,
				success: function (returndata) {
					console.log(returndata);
					if(returndata == 'error'){
						wechatController.message("报障失败：参数不完整");
					}else{
						//清空表单
						$("#formElementLocation").val('');
						$("#formElementDescription").val('');
						wechatController.clearFileInputField('upload_doc1');
						wechatController.clearFileInputField('upload_doc2');
						wechatController.clearFileInputField('upload_doc3');
						wechatController.clearFileInputField('upload_doc4');
						$("#upload_img1").remove();
						$("#upload_img2").remove();
						$("#upload_img3").remove();
						$("#upload_img4").remove();

						wechatController.message("报障成功");

						//将刚刚添加成功的保障，添加到列表开头
						// wechatController.loadLastNextPage();
					}
					wechatController.fullLoading.hideFullLoading();
				},
				error: function (returndata) {
					console.log(returndata);
					wechatController.fullLoading.hideFullLoading();
					wechatController.message("报障失败");
				}
	        });*/
        });
	},

	//绑定滚动事件
	bindScrollNextPage : function(){
		$(document).bind('scroll', function(){
			//只在列表页起作用
			if(wechatController.currentPage == 'my'){
				wechatController.scrollAcitveFunc();
			}
	    });
	},

	//页面触发scrool时，调用的方法
	scrollAcitveFunc : function (){
	    var winHei = $(window).height();
	    var docHei = $(document).height();
	    var sT = $(document).scrollTop();

	    if(sT >= (docHei - winHei) && wechatController.isLastPage == false){
	        $(document).unbind('scroll');//解绑，防止多次触发

	        wechatController.showNextPageLoadingIcon();
	        // $(document).scrollTop($(document).height());//滚到底部

	        wechatController.loadListNextPage();
	    }
	},

	//显示list正在加载
	showNextPageLoadingIcon : function (){
        $('.work-item-container').append(loadingIcon);
    },

    //隐藏list正在加载
    hideNextPageLoadingIcon : function(){
        loadingIcon.remove();
    },

    //获取刚刚添加的最新的报障
    loadLastNextPage : function(){
		var blId = wechatController.blId;
		var flId = wechatController.flId;
		var openId = wechatController.openId;
		var rtx = wechatController.rtx;

		var page = {};
		page["pageNumber"] = 0;
		page["pageSize"] = 1;

		var dto = {};
		dto["blId"] = blId;
		dto["flId"] = flId;
		dto["openId"] = openId;
		dto["rtx"] = rtx;
		dto["page"] = page;
        
		var url = wechatController.agentUrl+"?cmd=weChatWorkOrderService/getWeChatWoList";
		$.ajax({
			url: url,
			type:"POST",
			dataType:"json",
			//data:{cmd:'weChatWorkOrderService/getWeChatWoList',param:JSON.stringify(dto)},
			data:dto,
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
				loadingFail.remove();
				for(var i=0; i<contents.length; i++){
					var data = contents[i];
					var html = wechatController.generateMyListHtml(data);
					$("#my_list_ul").prepend(html);
				}
			}

			wechatController.bindListClick();
			wechatController.bindSatisfactionClick();
			},
			error: function (returndata) {
				console.log(returndata);
			}
		});
		
		/*var url = wechatController.serverAddr + "/archibus/cxf/weChatWorkOrderService/getWeChatWoList";
		$.ajax({
			url: url,
			type: 'POST',
			data: JSON.stringify(dto),
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
					loadingFail.remove();
					for(var i=0; i<contents.length; i++){
						var data = contents[i];
						var html = wechatController.generateMyListHtml(data);
						$("#my_list_ul").prepend(html);
					}
				}

				wechatController.bindListClick();
				wechatController.bindSatisfactionClick();
			},
			error: function (returndata) {
				console.log(returndata);
			}
        });*/
    },

    //获取list数据，加载下一页
	loadListNextPage : function(){
		loadingFail.remove();

		var blId = 'TX-SZ';
		var flId = '01F';
		var openId = wechatController.openId;
		var rtx = wechatController.rtx;
		// var rtx = 'jiessieliu';

		var page = {};
		page["pageNumber"] = wechatController.pageNumber;
		page["pageSize"] = wechatController.pageSize;

		var dto = {};
		dto["blId"] = blId;
		dto["flId"] = flId;
		dto["openId"] = openId;
		dto["rtx"] = rtx;
		dto["page"] = page;
		
		var url = wechatController.agentUrl+"?cmd=weChatWorkOrderService/getWeChatWoList";
		$.ajax({
			url: url,
			type:"POST",
			dataType:"json",
			//data:{cmd:'weChatWorkOrderService/getWeChatWoList',param:JSON.stringify(dto)},
			data:dto,
			success: function (returndata) {
				console.log(returndata);
				var contents = returndata.data.contents;

				if(contents.length > 0){
					for(var i=0; i<contents.length; i++){
						var data = contents[i];
						var html = wechatController.generateMyListHtml(data);
						$("#my_list_ul").append(html);
					}

					//页数+1
					wechatController.pageNumber++;
					//重新绑定各种点击事件
					wechatController.bindListClick();
					wechatController.bindSatisfactionClick();
				}else if(contents.length <= 0 && wechatController.pageNumber > 0){
					wechatController.isLastPage = true;
				}else{
					$(".work-item-container").append(loadingFail);
				}
				wechatController.bindScrollNextPage();
				wechatController.hideNextPageLoadingIcon();
			},
			error: function (returndata) {
				console.log(returndata);
				wechatController.bindScrollNextPage();
				wechatController.hideNextPageLoadingIcon();
			}
		});

		/*var url = wechatController.serverAddr + "/archibus/cxf/weChatWorkOrderService/getWeChatWoList";
		$.ajax({
			url: url,
			type: 'POST',
			data: JSON.stringify(dto),
			contentType : "application/json",
			success: function (returndata) {
				console.log(returndata);
				var contents = returndata.data.contents;

				if(contents.length > 0){
					for(var i=0; i<contents.length; i++){
						var data = contents[i];
						var html = wechatController.generateMyListHtml(data);
						$("#my_list_ul").append(html);
					}

					//页数+1
					wechatController.pageNumber++;
					//重新绑定各种点击事件
					wechatController.bindListClick();
					wechatController.bindSatisfactionClick();
				}else if(contents.length <= 0 && wechatController.pageNumber > 0){
					wechatController.isLastPage = true;
				}else{
					$(".work-item-container").append(loadingFail);
				}
				wechatController.bindScrollNextPage();
				wechatController.hideNextPageLoadingIcon();
			},
			error: function (returndata) {
				console.log(returndata);
				wechatController.bindScrollNextPage();
				wechatController.hideNextPageLoadingIcon();
			}
        });*/
	},

	//拼接列表html
	generateMyListHtml : function(data){
		var statusClass = 'complete'; //ing,complete,end(red,green,blue)
		var type = data.type;
		var typeLevel = "";
		var typeClass = "type-tip";
		var isUrgent = false; //是否 紧急or重要
		if(type != null && type != ""){
			var splits = type.split(" ");
			var len = splits.length;
			if(len >= 2){
				type = splits[0];
				typeLevel = data.type.replace(type, "");

				if(typeLevel.indexOf("紧急")>0 || typeLevel.indexOf("重要")>0){
					typeClass += " type-tip-eme";
					isUrgent = true;
					statusClass = 'ing'; //red
				}
			}
		}else{
			type = "未分配";
		}

		var wrId = data.wrId;
		var status = data.status;
		var statusStr = '';
		if(status == 'edit'){
			statusStr = '编辑中';
			wrId = '未分配';
		}else if(status == 'submit'){
			statusStr = '已提交';
			wrId = '未分配';
		}else if(status == 'work'){
			statusStr = '处理中';
			wrId += ' (处理中)';
			// wrId += ' <span class="status ing"><span class="text">(处理中)</span></span>';
		}else if(status == 'com'){
			statusStr = '已完成';
			statusClass = 'end';
		}

		var satisfaction = data.satisfaction;
		var isSatisfaction = true;
		if(satisfaction == null || satisfaction == ""){
			satisfaction = '未评价';
			isSatisfaction = false;
		}

		var description = data.description.replace(/<br>/gm, ';');

		//red   <span class="status ing"><span class="text">处理中</span></span>
		//green <span class="status complete"><span class="text">已完成</span></span>
		//blue  <span class="status end"><span class="text">已结单</span></span>
		//<td class="val">电梯困人<span class="type-tip">[紧急] 5分钟内响应</span></td>
		//<td class="val">电梯困人<span class="type-tip type-tip-eme">[紧急] 5分钟内响应</span></td>
		var html = '<li class="work-item"><table class="data" bwr_id="' + data.bwrId + '">'
				+ '<tr><td class="tit">单&emsp;&emsp;号:</td>'
				+ '<td class="val">' + wrId + '</td></tr>'
				+ '<tr><td class="tit">位&emsp;&emsp;置:</td>'
				+ '<td class="val">' + data.location + '</td></tr>'
				+ '<tr><td class="tit">类&emsp;&emsp;别:</td>'
				+ '<td class="val">' + type + '<span class="' + typeClass + '">' + typeLevel + '</span></td></tr>'
				+ '<tr><td class="tit">描&emsp;&emsp;述:</td>'
				+ '<td class="val ellipsis">' + description + '</td></tr>'
				+ '<tr><td class="tit">日&emsp;&emsp;期:</td>'
				+ '<td class="val">' + data.applyDate + '</td></tr>'
				+ '<tr><td class="tit">评&emsp;&emsp;价:</td>'
				+ '<td class="val bwr_id_val_' + data.bwrId + '">' + satisfaction + '</td></tr></table>';

		//判断是否显示满意度评价按钮
		if(status == 'com' && isSatisfaction == false){
			var satisfactionHtml = '<div class="satisfy bwr_id_' + data.bwrId + '" colspan="2">'
				+ '<button data-toggle="modal" data-target="#myModal" bwr_id="' + data.bwrId + '">满意度评价</button>'
				+ '</div>';
			html += satisfactionHtml;
		}

		//右上角状态
		html += '<span class="status ' + statusClass + '">'
			+ '<span class="text">' + statusStr + '</span></span></li>';

		return html;
	},

	//list中单个工单的点击(跳转到详情)
	bindListClick : function(){
		$('.my .work-item table').unbind('click');
		$('.my .work-item table').bind('click',function(){
			//记录当前list高度
			wechatController.listScrollHeight = $(document).scrollTop();

			var _this = $(this);
			var bwrId = _this.attr('bwr_id');

			//修改全局变量
			wechatController.lastBwrId = wechatController.bwrId;
			wechatController.bwrId = bwrId;
			wechatController.satisfactionBwrId = bwrId;

			//跳转到详情页面
			$('.mytab a[href="#detail"]').tab('show');
			$('.my-li').addClass('lookactive');
			$('body').css({'background-color':'#FFF'});
		});
	},

	//绑定列表和详情页 评价按钮
	bindSatisfactionClick : function(){
		$('.satisfy button').unbind('click');
		$('.satisfy button').bind('click',function(){
			var _this = $(this);

			var bwrId = _this.attr("bwr_id");
			wechatController.satisfactionBwrId = bwrId;
		});
	},

	//清空详情页面(显示加载中)
	clearDetailPage : function(){
		var html = '<div class="full-loading"><img src="img/loading.gif" style="width:1.8em;"/>正在加载...</div>';
		$("#detail-content").html(html);
	},

	//重新获取详情页面数据
	fetchDetailPage : function(){
		// var html = '<ul><li class="work-item"><table><tr><td class="tit">单号:</td><td class="val">2366582589665<span class="status ing"><span class="text">(处理中)</span></span></td></tr><tr><td class="tit">位置:</td><td class="val">朗科大厦七层</td></tr><tr><td class="tit">类别:</td><td class="val">电梯困人<span class="type-tip type-tip-eme">[紧急] 5分钟内响应</span></td></tr><tr><td class="tit">描述:</td><td class="val">电梯门打不开啊！</td></tr><tr><td class="tit">日期:</td><td class="val">2015-11-02 12:34:02</td></tr><tr><td class="tit">评价:</td><td class="val">差评<span class="type-tip">(等待时间太长)</span></td></tr><tr><td class="tit ver-top">图片:</td><td class="val"><section class="photo"><div class="photoContainer"><img src="img/ph.png" alt="" class="pho-mini"> <img src="img/ph2.png" alt="" class="pho-mini"> <img src="img/ph.png" alt="" class="pho-mini"></div></section></td></tr></table><div class="satisfy" colspan="2"><button data-toggle="modal" data-target="#myModal">满意度评价</button></div></li></ul>';
		// setTimeout(function(){
		// 	$("#detail-content").html(html);
		// }, 1000);

		var bwrId = wechatController.bwrId;
		
		var url = wechatController.agentUrl;
		$.ajax({
			url: url,
			type:"GET",
			dataType:"json",
			data:{cmd:'weChatWorkOrderService/getWeChatWoDetail/',param:bwrId},
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
					var html = wechatController.generateDetailHtml(contents);
					$("#detail-content").html(html);

					wechatController.showDetailBigImg();
					wechatController.bindSatisfactionClick();
				}
			},
			error: function (returndata) {

			}
		});
		
		/*var url = wechatController.serverAddr + "/archibus/cxf/weChatWorkOrderService/getWeChatWoDetail/" + bwrId;
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
					var html = wechatController.generateDetailHtml(contents);
					$("#detail-content").html(html);

					wechatController.showDetailBigImg();
					wechatController.bindSatisfactionClick();
				}
			},
			error: function (returndata) {

			}
        });*/
	},

	//拼接详情html
	generateDetailHtml : function(data){
		var bwrId = data.bwrId;
		var statusClass = 'complete'; //ing,complete,end(red,green,blue)
		var type = data.type;
		var typeLevel = "";
		var typeClass = "type-tip";
		var isUrgent = false; //是否 紧急or重要
		if(type != null && type != ""){
			var splits = type.split(" ");
			var len = splits.length;
			if(len >= 2){
				type = splits[0];
				typeLevel = data.type.replace(type, "");

				if(typeLevel.indexOf("紧急")>0 || typeLevel.indexOf("重要")>0){
					typeClass += " type-tip-eme";
					isUrgent = true;
					statusClass = 'ing'; //red
				}
			}
		}else{
			type = "未分配";
		}

		var wrId = data.wrId;
		var status = data.status;
		var statusStr = '';
		if(status == 'edit'){
			statusStr = '编辑中';
			wrId = '未分配';
		}else if(status == 'submit'){
			statusStr = '已提交';
			wrId = '未分配';
		}else if(status == 'work'){
			statusStr = '处理中';
			// wrId += ' (处理中)';
			wrId += ' <span class="type-tip type-tip-eme">(处理中)</span>';
		}else if(status == 'com'){
			statusStr = '已完成';
			statusClass = 'end';
		}

		var satisfaction = data.satisfaction;
		var isSatisfaction = true;
		if(satisfaction == null || satisfaction == ""){
			satisfaction = '未评价';
			isSatisfaction = false;
		}

		//拼接图片
		var imgHtml = '<td class="tit">图&emsp;&emsp;片:</td><td class="val">'
				+'<section class="photo"><div class="photoContainer">';
		for(var i = 0; i < data.docs.length; i++) {
			var doc = data.docs[i];
			//var url = wechatController.serverAddr+'/archibus/cxf/weChatWorkOrderService/getDocByte/' + doc.table + '/' + doc.field + '/' + doc.filename + '/' + doc.id
			var url = wechatController.agentUrl+'?cmd=weChatWorkOrderService/getDocByte/&param='+doc.table+'/'+ doc.field + '/' + doc.filename + '/' + doc.id;
			var img = '<img src="'+url+'" class="pho-mini"/>';

			imgHtml += img;
		};
		if(data.docs.length <= 0){
			imgHtml += "没有照片";
		}
		imgHtml += '</div></section></td></tr>';

		var html = '<ul><li class="work-item"><table class="data">'
				+ '<tr><td class="tit">单&emsp;&emsp;号:</td>'
				+ '<td class="val">' + wrId + '</td></tr>'
				+ '<tr><td class="tit">位&emsp;&emsp;置:</td>'
				+ '<td class="val">' + data.location + '</td></tr>'
				+ '<tr><td class="tit">类&emsp;&emsp;别:</td>'
				+ '<td class="val">' + type + '<span class="' + typeClass + '">' + typeLevel + '</span></td></tr>'
				+ '<tr><td class="tit">描&emsp;&emsp;述:</td>'
				+ '<td class="val">' + data.description + '</td></tr>'
				+ '<tr><td class="tit">日&emsp;&emsp;期:</td>'
				+ '<td class="val">' + data.applyDate + ' ' + data.applyTime + '</td></tr>'
				+ '<tr><td class="tit">评&emsp;&emsp;价:</td>'
				+ '<td class="val bwr_id_val_' + bwrId + '">' + satisfaction + '</td></tr>'
				+ imgHtml
				+ '</table>';

		//判断是否显示满意度评价按钮
		if(status == 'com' && isSatisfaction == false){
			var satisfactionHtml = '<div id="detailPageSatisfyBtn" class="satisfy" colspan="2">'
				+ '<button data-toggle="modal" data-target="#myModal" bwr_id="' + data.bwrId + '">满意度评价</button>'
				+ '</div>';
			html += satisfactionHtml;
		}

		html += '</li></ul>';
		return html;
	},

	//islider 详情中图片最大化
	showDetailBigImg : function(){
		$('.pho-mini','.detail').bind('click',function(){
			var phoMin = $(this);
			var csrc = phoMin.attr('src');
			var imgs = phoMin.parent().find('img');
			var data = [];
			var index = 0;
			for(var i=0; i<imgs.length; i++){
				var src = imgs[i].src;
				data.push({content:src});
				if(src == csrc){
					index = i;
				}
			}
			if(wechatController.islider == null){
				wechatController.islider = new iSlider({
					dom : document.getElementById('iSlider-wrapper'),
					data : data,
					isOverspread : false
				});
			}else{
				wechatController.islider.loadData(data);
			}
			wechatController.islider.slideTo(index);

			$('.islide-btnbar').show();
			$('#deleteISliderImg').hide();
			$('#iSlider-wrapper').show();
		});
	},

	//点击图片，显示大图(详情中)
	showDetailBigImg_bak : function(){
		$('.pho-mini','.detail').bind('click',function(){
			//禁止页面滑动
	        document.body.addEventListener('touchmove', stopScroll, false);
			var winHei = $(window).height();
			var winWidth = $(window).width();
			var phoMin = $(this);
			var phoBig = phoMin.clone();

			var img = new Image();
			img.src = phoMin.attr('src');

			phoBig.removeClass('pho-mini').addClass('pho-big');
			//添加DOM
			var phoPanel = $('<div class="phoPanel"></div>');
			phoPanel.appendTo('.detail');
			phoBig.prependTo(phoPanel);

			//计算图片大小及位置
			phoPanel.height($(document).height());
			phoPanel.css({'padding-top':$(document).scrollTop() + 'px'});
			img.onload = function(){
				var mt = winHei - phoBig.height()
				phoBig.css({'padding-top':mt/2 + 'px'});
			}

			phoBig.bind('click',function(){
				phoPanel.remove();
				//允许页面滑动
	            document.body.removeEventListener('touchmove', stopScroll, false);
			});
		    function stopScroll(event){
		        event.preventDefault();
		    }
		});
	},

	//初始化评价页面
	initSatisfactionPage : function(){
		var url = wechatController.agentUrl;
		$.ajax({
			url: url,
			type:"GET",
			dataType:"json",
			data:{cmd:'weChatWorkOrderService/getWeChatSatisfaction'},
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
					wechatController.satisfactionMap = contents;
					var html = wechatController.generateSatisfactionHtml(contents);
					$("#satisfactionLevels").html(html);
				}
			},
			error: function (returndata) {

			}
		});
		
		/*var url = wechatController.serverAddr + "/archibus/cxf/weChatWorkOrderService/getWeChatSatisfaction";
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
					wechatController.satisfactionMap = contents;
					var html = wechatController.generateSatisfactionHtml(contents);
					$("#satisfactionLevels").html(html);
				}
			},
			error: function (returndata) {

			}
        });*/
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
			wechatController.message("请选择满意度");
			return;
		}
		// if(description == null || description == ""){
		// 	// alert("描述不能为空");
		// 	wechatController.message("描述不能为空");
		// 	return;
		// }
		var descLen = description.length;
		if(descLen > 200){
			// alert("描述最多200个字符");
			wechatController.message("描述最多200个字符");
			return;
		}

		//获取评价中文
		var satisfactionCh = wechatController.satisfactionMap[level];
		if(description != null && descLen > 0){
			satisfactionCh += "(" + description + ")";
		}

		//提交评价
		var data = {};
		data["level"] = level;
		data["description"] = description;
		data["rtx"] = wechatController.rtx;
		data["openId"] = wechatController.openId;

		wechatController.confirm("你确定要提交评价吗？",function(){
			wechatController.fullLoading.showFullLoading();
			
			var bwrId = wechatController.satisfactionBwrId;
			data["bwrId"] = bwrId;
			var url = wechatController.agentUrl+"?cmd=weChatWorkOrderService/doWeChatSatisfaction/";
			$.ajax({
				url: url,
				type:"POST",
				dataType:"json",
				data: data,
				//data:{cmd:'weChatWorkOrderService/doWeChatSatisfaction/',param:JSON.stringify(data),bwrId:bwrId},
				success: function (returndata) {
					if(returndata.status == true){

						//清空并隐藏评价页面
						$('#satisfactionLevels input[name="satisfaction"]').removeAttr('checked');
						$('#satisfactionLevels textarea[name="description"]').val('');
						$('#myModal').modal('hide');
						
						//隐藏详情页面评价按钮
						if(wechatController.bwrId == wechatController.satisfactionBwrId){
							$("#detailPageSatisfyBtn").remove();
						}
						//隐藏list中，对应的评价按钮
						var bwr_id_class = 'bwr_id_' + bwrId;
						$(".work-item-container .work-item ." + bwr_id_class).remove();
						//更新详情和list中，对应的评价信息
						var bwr_id_val_class = 'bwr_id_val_' + bwrId;
						$("." + bwr_id_val_class).html(satisfactionCh);

						wechatController.message("评价成功");
					}else{
						wechatController.message("评价失败：" + returndata.message);
					}
					wechatController.fullLoading.hideFullLoading();
				},
				error: function (returndata) {
					wechatController.fullLoading.hideFullLoading();
					wechatController.message("评价失败，请重试");
				}
			});
			/*var url = wechatController.serverAddr + "/archibus/cxf/weChatWorkOrderService/doWeChatSatisfaction/" + bwrId;
			$.ajax({
				url: url,
				type: 'POST',
				data: JSON.stringify(data),
				contentType : "application/json",
				success: function (returndata) {
					if(returndata.status == true){

						//清空并隐藏评价页面
						$('#satisfactionLevels input[name="satisfaction"]').removeAttr('checked');
						$('#satisfactionLevels textarea[name="description"]').val('');
						$('#myModal').modal('hide');
						
						//隐藏详情页面评价按钮
						if(wechatController.bwrId == wechatController.satisfactionBwrId){
							$("#detailPageSatisfyBtn").remove();
						}
						//隐藏list中，对应的评价按钮
						var bwr_id_class = 'bwr_id_' + bwrId;
						$(".work-item-container .work-item ." + bwr_id_class).remove();
						//更新详情和list中，对应的评价信息
						var bwr_id_val_class = 'bwr_id_val_' + bwrId;
						$("." + bwr_id_val_class).html(satisfactionCh);

						wechatController.message("评价成功");
					}else{
						wechatController.message("评价失败：" + returndata.message);
					}
					wechatController.fullLoading.hideFullLoading();
				},
				error: function (returndata) {
					wechatController.fullLoading.hideFullLoading();
					wechatController.message("评价失败，请重试");
				}
	        });*/
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

	//html5定位
	getGeolocation : function(){
		function success(position){
			var lat = position.coords.latitude;
        	var lng = position.coords.longitude;
			wechatController.longitude = lng;
		    wechatController.latitude = lat;
			wechatController.initMobiscroll(true);
			/*qq.maps.convertor.translate(new qq.maps.LatLng(lat, lng), 1, function(res) {
		        latlng = res[0];
		        wechatController.longitude = latlng['lng'];
		        wechatController.latitude = latlng['lat'];

		        //定位成功，初始化mobiscroll插件
		        wechatController.initMobiscroll(true);
		    });*/
		};

		function error(error){
			switch (error.code) {
		        case error.TIMEOUT:
		            wechatController.message("定位失败：连接超时，请重试");
		            break;
		        case error.PERMISSION_DENIED:
		        	wechatController.message("定位失败：您拒绝了使用位置功能");
		            break;
		        case error.POSITION_UNAVAILABLE:
		        	wechatController.message("定位失败：获取位置信息出错");
		            break;
		    }
	        //定位失败，默认显示深圳 腾讯大厦，初始化mobiscroll插件
			//wechatController.longitude = 113.93464347;
		    //wechatController.latitude = 22.54050722;
	        wechatController.initMobiscroll(false);
		};

		var options = {
			enableHighAccuracy: true, //高精度
			maximumAge: 1000*60, //定位信息保持x分钟
			timeout: 1000*1 //获取定位信息，超时时间
		};

		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(success, error, options);
		}else{
			wechatController.message("浏览器不支持定位");
		};
	},

	getRtxOpenID : function(){
		var strUrl = window.location.href;
		var arrUrl = strUrl.split("/");
		var strPage = arrUrl[arrUrl.length-1];
		var indexof = strPage.indexOf("?");
		var rtx = "";
		var openId = "";
		if(indexof != -1){
			strPage = strPage.substr(indexof+1, strPage.length);
			var params = strPage.split('&');
			if(params == null || params.length <= 0){
				wechatController.showBodyPage(false);
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
			}
			if(rtx == '' || openId == ''){
				wechatController.showBodyPage(false);
			}else{
				wechatController.openId = openId;
				wechatController.rtx = rtx;

				wechatController.showBodyPage(true);
				wechatController.init();
			}
		}else{
			wechatController.showBodyPage(false);
			return;
		}
	},

	getRtxOpenID_bak : function(){
		var strUrl = window.location.href;
		var arrUrl = strUrl.split("/");
		var strPage = arrUrl[arrUrl.length-1];
		var indexof = strPage.indexOf("token=");
		var url = strPage;
		var token = "";
		if(indexof != -1){
			strPage = strPage.substr(indexof,strPage.length);
			if(strPage.indexOf("=") != -1){
				token = strPage.substr(strPage.indexOf("=")+1,strPage.length);
			}
		}else{
			wechatController.showBodyPage(false);
			return;
		}

		var tokenUrl = wechatController.serverAddr + "/archibus/cxf/weChatUserService/getUserByToken/" + token;
		$.ajax({
			type: 'GET',
			url: tokenUrl ,
			dataType: "JSON",
			contentType: "application/json",
			async: false,
			success : function (data) {
				console.log(data);
				var openId = data.data.contents["openID"];
				var rtx = data.data.contents["rtx"];

				wechatController.openId = openId;
				wechatController.rtx = rtx;

				if(openId == null || rtx == null){
					wechatController.showBodyPage(false);
				}else{
					wechatController.showBodyPage(true);
					wechatController.init();
				}
			},
			error : function(){
				wechatController.showBodyPage(false);
			}
		});
	},

	showBodyPage : function(ok){
		if(ok){
			$("body").show();
		}else{
			$("body").html("未登录");
			$("body").show();
		}
	}
}

wechatController.getRtxOpenID();