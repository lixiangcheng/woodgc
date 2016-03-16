var loadingIcon = $('<li class="work-item loading"><img src="img/loading.gif" style="width:1.8em;"/>正在加载...</li>');
var loadingFail = $('<li class="work-item loading">没有数据</li>');
var wrcfController = {
	openId : null,
	rtx : null,
	supervisor : false,
	workTeamId : null,
	cfs : [],
	prob_type : 'all',
	status : 'notcom',
	currentSelect : 'notcomall', //status+probType的组合(当前)
	lastSelect : 'notcomall', //status+probType的组合(上一次)
	pageNumber : 0,
	pageSize : 10,
	isLastPage : false,
	needClearList : true,
	fullLoading : null,
	currentPage : 'tab_list', //当前的页面(tab_list, tab_detail, tab_summary)
	lastPage : 'tab_list', //上一个页面
	wrId : null,
	lastWrId : null,
	dropdownCurrent : null,
	dropdownHistory : null,
	imgCount : 0,
	docNames : {"upload_doc1":null,"upload_doc2":null,"upload_doc3":null,"upload_doc4":null}, //标记获取的文件名
	deletedDocs : [], //记录哪些图片field被删除过
	detailCando : false, //是否可以修改和提交详情
	listScrollHeight : 0, //记录跳转到详情前，列表的高度
	allStatus : {}, //所有的状态与其对应的中文名称
	islider : null, //快速保障，大图预览的islider对象
	serverAddr : 'http://oss.esb.oa.com/admzhushouIDC/reoacom',
	agentUrl:'https://xz.m.tencent.com/admwechat/fm/wechat/wrcfdata.php',
	//serverAddr : 'http://10.67.32.6:8080',
	//agentUrl:'http://10.67.32.6/wechat/wrcfdata.php',

	init : function(){
		//替换工单为任务
		wrcfController.replaceWokrorderTitle();

		//初始化所有的状态
		wrcfController.allStatus = {
			'R' : '已请求',
			'Rev' : '已审核但在等待中',
			'Rej' : '已拒绝',
			'A' : '已批准',
			'AA' : '已分配到工单',
			'I' : '已发布',
			'HP' : '等待备件',
			'HA' : '等待排期',
			'HL' : '处理中',
			'HD' : '已处理',
			'AD' : '已验收',
			'S' : '已停止',
			'Can' : '已取消',
			'Com' : '完成',
			'Clo' : '已关闭'
		};

		//绑定dropdownSelect选择事件
		wrcfController.dropdownCurrent = new DropdownSelect($('#dropdownCurrent'),{
			selectCallback:function(selectedEle){
				wrcfController.switchListSearch(selectedEle);
			}
		});
		wrcfController.dropdownHistory = new DropdownSelect($('#dropdownHistory'),{
			selectCallback:function(selectedEle){
				wrcfController.switchListSearch(selectedEle);
			}
		});
		$("#dropdownCurrentBtn").bind('click', function(){
			var selectedEle = wrcfController.dropdownCurrent.choseItem;
			wrcfController.switchListSearch(selectedEle);
		});
		$("#dropdownHistoryBtn").bind('click', function(){	
			var selectedEle = wrcfController.dropdownHistory.choseItem;
			wrcfController.switchListSearch(selectedEle);
		});
		//tabdropdown切换时隐藏另一个
		$('#dropdownCurrent').click(function(){
			wrcfController.dropdownHistory._close();
		});
		$('#dropdownHistory').click(function(){
			wrcfController.dropdownCurrent._close();
		});
		//阻止小箭头的点击冒泡
		$('.arrowflag').click(function(e){
			e.stopPropagation();
		});

		//绑定详情页面&工单统计页面的返回按钮
		$("#tab_detail_back").bind('click', function(){
			wrcfController.detailBackToList();
		});
		$("#tab_summary_back").bind('click', function(){
			$("#tab_detail").hide();
			$("#tab_summary").hide();
			$("#tab_list").show();
			wrcfController.lastPage = wrcfController.currentPage;
			wrcfController.currentPage = 'tab_list';
		});	

		//绑定工单统计按钮
		$("#wr_summary_btn").bind('click', function(){
			$("#tab_list").hide();
			$("#tab_detail").hide();
			$("#tab_summary").show();
			wrcfController.lastPage = wrcfController.currentPage;
			wrcfController.currentPage = 'tab_summary';
		});

		//绑定file input的选择事件
		$("#upload_doc1").change(wrcfController.showLocalImg);
		$("#upload_doc2").change(wrcfController.showLocalImg);
		$("#upload_doc3").change(wrcfController.showLocalImg);
		$("#upload_doc4").change(wrcfController.showLocalImg);

		//初始化fullLoading
		wrcfController.fullLoading = new FullLoading();
		wrcfController.fullLoading.setMsg("提交中...");

		//绑定islder的返回和删除按钮
		wrcfController.init_islider_btn();

		//初始化统计数据(不同类型 & 好评数)
		wrcfController.fetchWrSummaryPage();

		//初始化list页面
		wrcfController.loadListNextPage();
	},

	//替换网页中所有的 工单 为 任务
	replaceWokrorderTitle : function(){
		if(wrcfController.supervisor == false){
			var html = document.body.innerHTML;
			html = html.replace(/工单/gm, '任务');
			document.body.innerHTML = html;

			//重新绑定页首切换时的active class绑定
			tab('.mytab');
		}
	},

	//从详情页，返回到列表页（包括点击返回&提交后回调）
	detailBackToList : function(){
		$("#tab_detail").hide();
		$("#tab_summary").hide();
		$("#tab_list").show();
		wrcfController.lastPage = wrcfController.currentPage;
		wrcfController.currentPage = 'tab_list';

		$(document).scrollTop(wrcfController.listScrollHeight);
	},

	//切换列表筛选条件
	switchListSearch : function(selectedEle){
		wrcfController.lastSelect = wrcfController.currentSelect;

		var status = $(selectedEle).attr("status");
		var prob_type = $(selectedEle).attr("probtype");
		wrcfController.status = status;
		wrcfController.prob_type = prob_type;

		//切换了筛选条件，需要清空列表，并且列表pageNumber置0
		wrcfController.currentSelect = status+prob_type;
		if(wrcfController.currentSelect != wrcfController.lastSelect){
			wrcfController.needClearList = true;
			wrcfController.pageNumber = 0;
			wrcfController.isLastPage = false;
			wrcfController.loadListNextPage();
		}
	},

	//绑定滚动事件
	bindScrollNextPage : function(){
		$(document).bind('scroll', function(){
			if(wrcfController.currentPage == 'tab_list'){
				wrcfController.scrollAcitveFunc();
			}
	    });
	},

	//页面触发scrool时，调用的方法
	scrollAcitveFunc : function (){
	    var winHei = $(window).height();
	    var docHei = $(document).height();
	    var sT = $(document).scrollTop();

	    if(sT >= (docHei - winHei) && wrcfController.isLastPage == false){
	        $(document).unbind('scroll');//解绑，防止多次触发

	        wrcfController.loadListNextPage();
	    }
	},

	//显示list正在加载
	showNextPageLoadingIcon : function (){
        $('#my_list_ul').append(loadingIcon);
    },

    //隐藏list正在加载
    hideNextPageLoadingIcon : function(){
        loadingIcon.remove();
    },

	loadListNextPage : function(){
		//判断是否需要清空列表，重新获取
		if(wrcfController.needClearList){
			$("#my_list_ul").html('');
			wrcfController.needClearList = false;
		}
		//显示正在加载
		wrcfController.showNextPageLoadingIcon();

		//调用ajax
		//var url = wrcfController.serverAddr + "/archibus/cxf/weChatWrcfService/getWechatWrcfList";
		var url = wrcfController.agentUrl+"?cmd=weChatWrcfService/getWechatWrcfList";
		
		var openId = wrcfController.openId;
		var rtx = wrcfController.rtx;

		var page = {};
		page["pageNumber"] = wrcfController.pageNumber;
		page["pageSize"] = wrcfController.pageSize;

		var dto = {};
		dto["openId"] = openId;
		dto["rtx"] = rtx;
		dto["status"] = wrcfController.status;
		dto["prob_type"]= wrcfController.prob_type;
		dto["page"] = page;
		
		$.ajax({
			url: url,
			type: 'POST',
			data: dto,
			dataType:"json",
			success: function (returndata) {
				console.log(returndata);
				var contents = returndata.data.contents;

				if(contents.length > 0){
					for(var i=0; i<contents.length; i++){
						var data = contents[i];
						var html = wrcfController.generateListHtml(data);
						$("#my_list_ul").append(html);
					}
					wrcfController.pageNumber = returndata.data.page.pageNumber + 1;
					wrcfController.bindListClick();
				}else if(contents.length <= 0 && wrcfController.pageNumber > 0){
					wrcfController.isLastPage = true;
				}else{
					$("#my_list_ul").append(loadingFail);
				}
				wrcfController.hideNextPageLoadingIcon();
				wrcfController.bindScrollNextPage();
			},
			error: function (returndata) {
				console.log(returndata);
				wrcfController.hideNextPageLoadingIcon();
				wrcfController.bindScrollNextPage();
			}
        });

		/*$.ajax({
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
						var html = wrcfController.generateListHtml(data);
						$("#my_list_ul").append(html);
					}
					wrcfController.pageNumber = returndata.data.page.pageNumber + 1;
					wrcfController.bindListClick();
				}else if(contents.length <= 0 && wrcfController.pageNumber > 0){
					wrcfController.isLastPage = true;
				}else{
					$("#my_list_ul").append(loadingFail);
				}
				wrcfController.hideNextPageLoadingIcon();
				wrcfController.bindScrollNextPage();
			},
			error: function (returndata) {
				console.log(returndata);
				wrcfController.hideNextPageLoadingIcon();
				wrcfController.bindScrollNextPage();
			}
        });*/
	},

	generateListHtml : function(data){
		var statusClass = 'complete'; //ing,complete,impo(red,green,orange)
		var statusStr = '';
		var priorityName = data.priority_name;
		if(priorityName == null || priorityName == 'null'){
			priorityName = '';
		}
		if(priorityName.indexOf('紧急') >= 0){
			statusClass = 'ing';
			statusStr = '&ensp;紧急&ensp;';
		}else if(priorityName.indexOf('重要') >= 0){
			statusClass = 'impo';
			statusStr = '&ensp;重要&ensp;';
		}else{
			statusClass = 'complete';
			statusStr = '&ensp;一般&ensp;';
		}
		var requestor = data.requestor == null ? '无' : data.requestor;
		var prob_type = data.prob_type == 'PREVENTIVE MAINT' ? '计划性维护' : data.prob_type;
		var description = data.description == null ? '无' : data.description.replace(/<br>/gm, ';');

		var html = '<li class="work-item"><table class="data" wr_id="' + data.wr_id + '">'
				+ '<tr><td class="tit">单&emsp;&emsp;号</td><td class="val">' + data.wr_id + '</td></tr>'
				+ '<tr><td class="tit">报&ensp;障&ensp;人</td><td class="val">' + requestor + '</td></tr>'
				+ '<tr><td class="tit">类&emsp;&emsp;型</td><td class="val">' + prob_type + '</td></tr>'
				+ '<tr><td class="tit">状&emsp;&emsp;态</td><td class="val">' + wrcfController.allStatus[data.status] + '</td></tr>'
				+ '<tr><td class="tit">日&emsp;&emsp;期</td><td class="val">' + data.date_requested + ' ' + data.time_requested + '</td></tr>'
				+ '<tr><td class="tit">内&emsp;&emsp;容</td>'
				+ '<td class="val ellipsis">' + description + '</td></tr></table>'
				+ '<span class="status ' + statusClass + '"><span class="text">' + statusStr + '</span></span>'
				// + '<span class="opentip">详情&ensp;&gt;</span>'
				+ '</li>';
		return html;
	},

	//list中单个工单的点击(跳转到详情)
	bindListClick : function(){
		$('.my .work-item table').unbind('click');
		$('.my .work-item table').bind('click',function(){
			//记录当前list高度
			wrcfController.listScrollHeight = $(document).scrollTop();

			var _this = $(this);
			var wrId = _this.attr('wr_id');

			//修改全局变量
			wrcfController.lastWrId = wrcfController.wrId;
			wrcfController.wrId = wrId;
			wrcfController.lastPage = wrcfController.currentPage;
			wrcfController.currentPage = 'tab_detail';

			//跳转到详情页面
			wrcfController.fetchDetailPage();
			$("#tab_list").hide();
			$("#tab_summary").hide();
			$("#tab_detail").show();
		});
	},

	fetchDetailPage : function(){
		//wrId未变时，跳过获取数据
		// if(wrcfController.lastWrId == wrcfController.wrId){
		// 	return;
		// }

		//显示正在加载中...
		var html = '<div class="full-loading"><img src="img/loading.gif" style="width:1.8em;"/>正在加载...</div>';
		$("#tab_detail_ul").html(html);

		//清空表单
		wrcfController.clearFileInputField('upload_doc1');
		wrcfController.clearFileInputField('upload_doc2');
		wrcfController.clearFileInputField('upload_doc3');
		wrcfController.clearFileInputField('upload_doc4');

		//重新初始化 wrcfController.docNames & imgCount
		wrcfController.imgCount = 0;
		wrcfController.deletedDocs = [];
		wrcfController.detailCando = false,
		wrcfController.docNames = {"upload_doc1":null,"upload_doc2":null,"upload_doc3":null,"upload_doc4":null};

		//获取数据
		var wrId = wrcfController.wrId;
		//var url = wrcfController.serverAddr + "/archibus/cxf/weChatWrcfService/getWechatWrcfDetail/" + wrId;
		
		var url = wrcfController.agentUrl;
		$.ajax({
			url: url,
			type: 'GET',
			dataType:"json",
			data:{cmd:'weChatWrcfService/getWechatWrcfDetail/',param:wrId},
			success: function (returndata) {
				console.log(returndata);
				var contents = returndata.data.contents;
				var html = wrcfController.generateDetailHtml(contents);
				$("#tab_detail_ul").html(html);

				wrcfController.initDetailBind();
				
				//绑定详情页，提交按钮
		        $("#detail_submit").bind('click', wrcfController.submitDetailFrom);
			},
			error: function (returndata) {

			}
        });
		/*$.ajax({
			url: url,
			type: 'POST',
			// data: JSON.stringify(dto),
			contentType : "application/json",
			success: function (returndata) {
				console.log(returndata);
				var contents = returndata.data.contents;
				var html = wrcfController.generateDetailHtml(contents);
				$("#tab_detail_ul").html(html);

				wrcfController.initDetailBind();
			},
			error: function (returndata) {

			}
        });*/
	},

	generateDetailHtml : function(data){
		//获取状态html，其中会判断是否可以操作，并修改全局变量
		var statusHtml = wrcfController.generateDetailStatusHtml(data.status);
		var requestor = data.requestor == null ? '无' : data.requestor;
		var prob_type = data.prob_type == 'PREVENTIVE MAINT' ? '计划性维护' : data.prob_type;
		var description = data.description == null ? '无' : data.description;

		//如果是历史工单，则显示其评价信息 : Redmine-3260
		var satisfactionHtml = '';
		if(data.status == 'S' || data.status == 'Can' || data.status == 'Com' || data.status == 'Clo'){
			var satisfaction = data.satisfaction;
			if(satisfaction == 0) satisfaction = '未评价';
			if(satisfaction == 1) satisfaction = '好评';
			if(satisfaction == 2) satisfaction = '中评';
			if(satisfaction == 3) satisfaction = '差评';
			satisfactionHtml = '<tr><td class="title">评&emsp;&emsp;价</td><td class="value">' + satisfaction + '</td></tr>';
		}

		var eq = data.eq_id == null ? '无' : data.eq_id;
		var html = '<li><a class="ui-btn">工单请求</a><table class="data">'
				+ '<tr><td class="title">工&ensp;单&ensp;号</td><td class="value">' + data.wr_id + '</td></tr>'
				+ '<tr><td class="title">日&emsp;&emsp;期</td><td class="value">' + data.date_requested + ' ' + data.time_requested + '</td></tr>'
				+ '<tr><td class="title">报&ensp;障&ensp;人</td><td class="value">' + requestor + '</td></tr>'
				+ '<tr><td class="title">位&emsp;&emsp;置</td><td class="value">' + data.location + '</td></tr>'
				+ '<tr><td class="title">工单类型</td><td class="value">' + prob_type + '</td></tr>'
				+ '<tr><td class="title ver-top">工作内容</td>'
				+ '<td class="value inspect subInfo">' + description + '</td></tr>'
				+ '<tr><td class="title">设备编码</td><td class="value">' + eq + '</td></tr>'
				// + wrcfController.generateDetailStatusHtml(data.status)
				+ statusHtml
				+ satisfactionHtml
				+ '</table></li>';

		var cfHtml = '<li class="input-table"><a class="ui-btn editBtn">指派技工';
		if(wrcfController.detailCando == true && wrcfController.supervisor == true){
			cfHtml += '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span>';
		}
		cfHtml += '</a><table class="data">';
		for(var i=0; i<data.cfs.length; i++){
			var cf = data.cfs[i];
			var cfValue = cf.cfId;
			if(cf.cfName != null){
				cfValue += '(' + cf.cfName + ')';
			}
			var comment = cf.comment == null ? '' : cf.comment;

			cfHtml += '<tr><td class="title">技&emsp;&emsp;工</td><td class="value">';
			if(wrcfController.detailCando == false || wrcfController.supervisor == false){
				cfHtml += '<input type="text" placeholder="AFM" readOnly value="' + cfValue + '" id="asdasddddddd"/>';
			}else{
				cfHtml += wrcfController.generateCfSelectHtml(cfValue);
			}
			if(wrcfController.detailCando == true && wrcfController.supervisor == true){
				if(i == 0){
					cfHtml += ''
						+ '<span class="glyphicon glyphicon-plus-sign valBtn addBtn" aria-hidden="true"></span>';
				}else{
					cfHtml += ''
						+'<span class="glyphicon glyphicon-minus-sign valBtn deleteBtn" aria-hidden="true"></span>';
				}
			}
			cfHtml += '</td>';
			
			cfHtml += '</tr>'
			+ '<tr><td class="title">主管建议</td>'
			+ '<td class="value subInfo">';
			if(wrcfController.detailCando == false || wrcfController.supervisor == false){
				cfHtml += '<input type="text" readOnly value="' + comment + '"/>'
					+ '</td></tr>';
			}else{
				cfHtml += '<input type="text" placeholder="请输入..." value="' + comment + '" style="width:95%;"/>'
					+ '</td></tr>';
			}
		}
		cfHtml += '</table></li>';
		html += cfHtml;

		//生成 附件(照片)的html
		var docHtml = '<li><a class="ui-btn editBtn">上传附件';
		if(wrcfController.detailCando == true){
			docHtml += '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span>';
		}
		docHtml += '</a><div class="row data">'
			+ '<section class="thumbnail" id="thumbnail">'
			+ '<div class="thumbnail-container">';
		for(var i=0; i<data.docs.length; i++){
			var doc = data.docs[i];
			//var url = wrcfController.serverAddr + '/archibus/cxf/weChatWorkOrderService/getDocByte/' + doc.table + '/' + doc.field + '/' + doc.filename + '/' + doc.id;
			var url = wrcfController.agentUrl+'?cmd=weChatWorkOrderService/getDocByte/&param='+doc.table+'/'+ doc.field + '/' + doc.filename + '/' + doc.id;
			var imgId = 'upload_' + doc.field.replace('doc', 'img');
			docHtml += '<img src="' + url + '" class="pho-mini originImg" id="' + imgId + '"/>';

			wrcfController.docNames['upload_' + doc.field] = doc.filename;
			wrcfController.imgCount += 1;
		}
		// http://192.168.1.189/issues/3176
		var notDocsFlag = '';
		if(data.docs.length <= 0 && wrcfController.detailCando == false){
			notDocsFlag = '无';
		}
		docHtml += '<img src="img/pho_add.png" class="pho-mini-add" id="upload_img_pick"/>'
				+ '</div>' + notDocsFlag + '</section></div></li>';
		html += docHtml;

		var descHtml = '<li><a  class="ui-btn editBtn">工作说明';
		if(wrcfController.detailCando == true){
			descHtml += '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span>'
				+ '</a><div class="data"><div class="col-sm-12 edit">'
				+ '<textarea id="detail_desc" rows="4" placeholder="请输入工作说明"></textarea>'
				+ '</div></div></li>';
		}else{
			descHtml += '</a><div class="data"><div class="col-sm-12 edit">'
				+ '<textarea id="detail_desc" rows="4" readOnly></textarea>'
				+ '</div></div></li>';
		}
		//descHtml += '<li><button class="btn btn-bot-submit" id="detail_submit">提交</button></li>';
		
		descHtml += '<li><div class="data"><div class="col-sm-12 edit">'
				+ '<button class="btn btn-bot-submit" id="detail_submit">提交</button>'
				+ '</div></div></li>';
		
		// http://192.168.1.189/issues/3176
		if(wrcfController.detailCando){
			html += descHtml;
		}

		if(wrcfController.supervisor == false){
			html = html.replace(/工单/gm, '任务');
		}
		return html;
	},

	generateDetailStatusHtml : function(status){
		//R;已请求;Rev;已审核但在等待中;Rej;已拒绝;A;已批准;
		//AA;已分配到工单;I;已发布;HP;等待备件;HA;等待排期;
		//HL;正在处理中;HD;已处理;AD;已验收;S;已停止;Can;已取消;Com;完成;Clo;已关闭
		// var allStatus = {
		// 	'R' : '已请求',
		// 	'Rev' : '已审核但在等待中',
		// 	'Rej' : '已拒绝',
		// 	'A' : '已批准',
		// 	'AA' : '已分配到工单',
		// 	'I' : '已发布',
		// 	'HP' : '等待备件',
		// 	'HA' : '等待排期',
		// 	'HL' : '处理中',
		// 	'HD' : '已处理',
		// 	'AD' : '已验收',
		// 	'S' : '已停止',
		// 	'Can' : '已取消',
		// 	'Com' : '完成',
		// 	'Clo' : '已关闭'
		// };
		
		var cfCandoStatus = ['AA','I','HA','HP','HL']; //普通技工可以操作的状态
		var cfSuperCandoStatus = ['AA','I','HA','HP','HL','HD']; //技工主管可以操作的状态
		var cfStatus = [];
		if(wrcfController.supervisor){
			cfStatus = cfSuperCandoStatus;
		}else{
			cfStatus = cfCandoStatus;
		}
		var cando = false;
		for(var i=0; i<cfStatus.length; i++){
			if(cfStatus[i] == status){
				cando = true;
			}
		}
		wrcfController.detailCando = cando;

		var statusCh = wrcfController.allStatus[status] == null ? status : wrcfController.allStatus[status];
		var html = '';
		if(cando == false){
			html += '<tr>'
				+ '<td class="title">状&emsp;&emsp;态</td>'
				+ '<td class="value">' + statusCh + '</td>'
				+ '</tr>';
			return html;
		}

		if(wrcfController.supervisor == true){
			cfStatus.push('AD');
		}else{
			cfStatus.push('HD');
		}
		html += '<tr>'
            + '<td class="title">状&emsp;&emsp;态</td>'
            + '<td class="value">'
            + '<select name="修改状态" id="mobi_status_select">';
            for(var i=0; i<cfStatus.length; i++){
				if(cfStatus[i] == status){
					html += '<option selected value="' + cfStatus[i] + '">' + wrcfController.allStatus[cfStatus[i]] + '</option>';
				}else{
					html += '<option value="' + cfStatus[i] + '">' + wrcfController.allStatus[cfStatus[i]] + '</option>';
				}
			}
        html += '</select><span class="glyphicon glyphicon-menu-right" aria-hidden="true"></span></td></tr>';
		return html;
	},

	generateCfSelectHtml : function(defaultValue){
		var html = '<select name="指派技工" class="mobi_cf_select">';
		var len = wrcfController.cfs.length;
		for(var i=0; i<len; i++){
			var cf = wrcfController.cfs[i];
			var cfValue = cf.cfId;
			if(cf.cfName != null){
				cfValue += '(' + cf.cfName + ')';
			}
			if(defaultValue == cfValue){
				html += '<option selected value="' + cfValue + '">' + cfValue + '</option>';
			}else{
				html += '<option value="' + cfValue + '">' + cfValue + '</option>';
			}
		}
		html += "</select>";
		return html;
	},

	initDetailBind : function(){
		var html = wrcfController.generateCfSelectHtml();
		var h = $(
            '<tr class="addgroup">'
            +'<td class="title">技&emsp;&emsp;工</td>'
            // +'<td class="value"> <input type="text" placeholder="请输入..."/> </td>'
            +'<td class="value">' + html + '<span class="glyphicon glyphicon-minus-sign valBtn deleteBtn" aria-hidden="true"></span></td>'
            //+'<td class="valBtn deleteBtn">  <span class="glyphicon glyphicon-minus-sign valBtn deleteBtn" aria-hidden="true"></span></td>'
            +'</tr>'
            +'<tr>'
            +'<td class="title">主管建议</td>'
            +'<td class="value subInfo"><input type="text" placeholder="请输入..." /></td>'
            +'</tr>'
	    );

	    $('.addBtn').click(function(){
	        h.clone().appendTo($(this).parents('.data'));
	        $('.deleteBtn').click(function(){
				$(this).parent().parent().next().remove();
	            $(this).parent().parent().remove();
	        });
	        $('.mobi_cf_select').mobiscroll().select({
		        theme: 'mobiscroll',
		        lang: 'zh',
		        display: 'bottom',
		        minWidth: 200,
		        placeholder:'请选择...'
		    });
	    });
	    $('.deleteBtn').click(function(){
            $(this).parent().parent().next().remove();
	        $(this).parent().parent().remove();
        });

	    $('#mobi_status_select').mobiscroll().select({
	        theme: 'mobiscroll',
	        lang: 'zh',
	        display: 'bottom',
	        minWidth: 200,
	        placeholder:'请选择...'
	    });
		$('.mobi_cf_select').mobiscroll().select({
		    theme: 'mobiscroll',
		    lang: 'zh',
		    display: 'bottom',
		    minWidth: 200,
		    placeholder:'请选择...'
		});

	    // $('#thumbnail').thumbnail();
	    $(".pho-mini").bind('click', wrcfController.showBigImg);

	    //不可编辑时，隐藏添加图片按钮和提交按钮
	    if(wrcfController.detailCando == false){
	    	$("#upload_img_pick").hide();
	    	$("#detail_submit").hide();
	    }else{
	    	$("#detail_submit").show();
	    }
	    //图片已经达到4张时，隐藏添加图片按钮
	    if(wrcfController.imgCount >= 4){
	    	$("#upload_img_pick").hide();
	    }
	    //绑定添加图片按钮
		$("#upload_img_pick").click(function(){
			if(wrcfController.imgCount >= 4){
				return;
			}

			var inputId = "upload_doc1";
			if(wrcfController.docNames["upload_doc1"] == null){
				inputId = "upload_doc1";
			}else if(wrcfController.docNames["upload_doc2"] == null){
				inputId = "upload_doc2";
			}else if(wrcfController.docNames["upload_doc3"] == null){
				inputId = "upload_doc3";
			}else if(wrcfController.docNames["upload_doc4"] == null){
				inputId = "upload_doc4";
			}else{
				return;
			}
			wrcfController.runClick(inputId);
		});
	},

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

		if(wrcfController.islider == null){
			wrcfController.islider = new iSlider({
				dom : document.getElementById('iSlider-wrapper'),
				data : data,
				isOverspread : false
			});
		}else{
			wrcfController.islider.loadData(data);
		}
		wrcfController.islider.slideTo(index);

		if(wrcfController.detailCando){
			$('#deleteISliderImg').show();
		}else{
			$('#deleteISliderImg').hide();
		}
		$('.islide-btnbar').show();
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
			var index = wrcfController.islider.slideIndex;
			var data = wrcfController.islider.data;
			var src = data[index].content;

			data.splice(index, 1);
			wrcfController.islider.loadData(data);
			wrcfController.islider.slideTo(index - 1);

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
			var originImg = upload_img.hasClass('originImg');
			if(originImg){
				var field = inputId.replace('upload_', '');
				wrcfController.deletedDocs.push(field);
			}
			wrcfController.clearFileInputField(inputId);
			upload_img.remove();

			//判断是否是最后一张，是则隐藏浏览插件
			if(data.length <= 0){
				$('.islide-btnbar').hide();
				$('#iSlider-wrapper').hide();
			}
		});
	},

	//点击图片，显示大图(报障详情)
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
		if(wrcfController.detailCando){
			var phoPanel = $('<div class="phoPanel"><div class="btn-group"><button class="btn btn-primary">确定</button> <button class="btn btn-danger">删除</button></div></div>');
		}else{
			var phoPanel = $('<div class="phoPanel"></div>');
		}
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
			var originImg = phoMin.hasClass('originImg');
			if(originImg){
				var field = inputId.replace('upload_', '');
				wrcfController.deletedDocs.push(field);
			}
			wrcfController.clearFileInputField(inputId);
			//允许页面滑动
            document.body.removeEventListener('touchmove', stopScroll, false);
		});
	    function stopScroll(event){
	        event.preventDefault();
	    }
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
		// console.log("inputId = " + inputId);
		// console.log("imgId = " + imgId);

		// 根据这个 <input> 获取文件的 HTML5 js 对象
		var files = event.target.files, file;        
		if (files && files.length > 0) {
			// 获取目前上传的文件
			file = files[0];
			// 来在控制台看看到底这个对象是什么
			// console.log(file);
			// 那么我们可以做一下诸如文件大小校验的动作
			// if(file.size > 1024 * 1024 * wrcfController.imgMaxSize) {
			// 	wrcfController.clearFileInputField(inputId);
			// 	alert('图片大小不能超过 ' + wrcfController.imgMaxSize + 'MB!');
			// 	return false;
			// }

			// 文件名不可重复校验
			// var fileName = file.name;
			// if(wrcfController.docNames["upload_doc1"] == fileName
			// 	|| wrcfController.docNames["upload_doc2"] == fileName
			// 	|| wrcfController.docNames["upload_doc3"] == fileName
			// 	|| wrcfController.docNames["upload_doc4"] == fileName){
				
			// 	wrcfController.clearFileInputField(inputId);
			//  alert('图片 ' + fileName + ' 已存在!');
			// 	return false;
			// }
			// wrcfController.message(file.name);

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
			wrcfController.imgCount += 1;
			wrcfController.docNames[inputId] = file.name;
			if(wrcfController.imgCount >= 4){
				$("#upload_img_pick").hide();
			}

			//绑定新增图片的点击事件
			$("#"+imgId).click(wrcfController.showBigImg);

			//返回操作成功
			// console.log(wrcfController);
		}
	},

	//清除file input已经选中的文件信息
	clearFileInputField : function(id){
		var obj = document.getElementById(id);
		obj.outerHTML = obj.outerHTML;

		//修改全局数据
		wrcfController.docNames[id] = null;
		wrcfController.imgCount -= 1;
		if(wrcfController.imgCount < 4){
			$("#upload_img_pick").show();
		}

		//重新绑定change事件
		$("#"+id).change(wrcfController.showLocalImg);
	},

	//提交详情信息
	submitDetailFrom : function(){
		//获取数据
		var status = $("#mobi_status_select").val();
		// console.log(status);

		var cfs = [];
		var cfSelects = $(".mobi_cf_select");
		for(var i=0; i<cfSelects.length; i++){
			var cfSelect = cfSelects[i];
			var _cf = $(cfSelect);
			var cfId = _cf.val();
			var cfComment = _cf.parent().parent().next().find('input').val();

			cf = {};
			cf["cfId"] = cfId;
			cf["comment"] = cfComment;
			cfs.push(cf);
		}
		// console.log(cfs);

		var detail_desc = $("#detail_desc").val().trim();
		// console.log("detail_desc = " + detail_desc);

		var deletedDocs = wrcfController.deletedDocs;
		// console.log(deletedDocs);

		//校验数据
		if(cfs.length <= 0 && wrcfController.supervisor){
			wrcfController.message('至少指派一个技工');
			return;
		}
		var kk = {};
		for(var i=0; i<cfs.length; i++){
			var key = cfs[i].cfId;
			if(kk[key] != null){
				wrcfController.message('技工 ' + key + ' 重复了');
				return;
			}
			kk[key] = true;
		}
		// if(detail_desc == null || detail_desc == ''){
		// 	wrcfController.message('工作说明不能为空');
		// 	return;
		// }
		if(detail_desc.length > 200){
			wrcfController.message('工作说明最多200个字符');
			return;
		}

		//提交数据
		var openId = wrcfController.openId;
		var rtx = wrcfController.rtx;
		var formData = new FormData($("#uploadImgForm")[0]);
        formData.append("rtx", rtx);
        formData.append("openId", openId);
        formData.append("status", status);
        formData.append("description", detail_desc);
        formData.append("deletedDocs", JSON.stringify(deletedDocs));
        for(var i=0; i<cfs.length; i++){
        	var cf = cfs[i];
        	var cfId = cf.cfId;
        	var index = cfId.indexOf('(');
        	if(index != -1){
        		cfId = cfId.substr(0, index);
        		cfs[i].cfId = cfId;
        	}
        }
        formData.append("cfs", JSON.stringify(cfs));
        formData.append("wrId",wrcfController.wrId);
        wrcfController.confirm("你确定要提交吗？", function(){
        	wrcfController.fullLoading.showFullLoading();
        	
        	var url = wrcfController.agentUrl + "?cmd=weChatWrcfService/updateDetail/"
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
					if(returndata.fmcode != 0 && returndata.fmcode != undefined){
						wrcfController.message(returndata.message);
					}else{
						wrcfController.message("提交成功");
						wrcfController.detailBackToList();
					}
					wrcfController.fullLoading.hideFullLoading();
				},
				error: function (returndata) {
					console.log(returndata);
					wrcfController.fullLoading.hideFullLoading();
					wrcfController.message("提交失败");
				}
	        });

        	/*var url = wrcfController.serverAddr + "/archibus/cxf/weChatWrcfService/updateDetail/" + wrcfController.wrId;
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
					if(returndata.fmcode != 0){
						wrcfController.message(returndata.message);
					}else{
						wrcfController.message("提交成功");
						wrcfController.detailBackToList();
					}
					wrcfController.fullLoading.hideFullLoading();
				},
				error: function (returndata) {
					console.log(returndata);
					wrcfController.fullLoading.hideFullLoading();
					wrcfController.message("提交失败");
				}
	        });*/
        });
	},

	fetchWrSummaryPage : function(){
		//显示正在加载中...
		var html = '<div class="full-loading"><img src="img/loading.gif" style="width:1.8em;"/>正在加载...</div>';
		$("#tab_detail_ul").html(html);

		//获取数据
		//var url = wrcfController.serverAddr + "/archibus/cxf/weChatWrcfService/getWechatWrcfSummary";
		var url = wrcfController.agentUrl+"?cmd=weChatWrcfService/getWechatWrcfSummary";
		var openId = wrcfController.openId;
		var rtx = wrcfController.rtx;

		var dto = {};
		dto["openId"] = openId;
		dto["rtx"] = rtx;
		
		$.ajax({
			url: url,
			type: 'POST',
			data: dto,
			dataType:"json",
			success: function (returndata) {
				console.log(returndata);

				var contents = returndata.data.contents;
				wrcfController.updateWrCount(contents.data);
				var html = wrcfController.generateSummaryHtml(contents);
				$("#tab_summary_ul").html(html);
			},
			error: function (returndata) {
				console.log(returndata);
			}
        });

		/*$.ajax({
			url: url,
			type: 'POST',
			data: JSON.stringify(dto),
			contentType : "application/json",
			success: function (returndata) {
				console.log(returndata);

				var contents = returndata.data.contents;
				wrcfController.updateWrCount(contents.data);
				var html = wrcfController.generateSummaryHtml(contents);
				$("#tab_summary_ul").html(html);
			},
			error: function (returndata) {
				
			}
        });*/
	},

	generateSummaryHtml : function(data){
		var html = '<li><a class="ui-btn">历史工单</a>'
				+ '<table class="data">'
				+ '<tr><td class="title">好评</td><td class="value">' + data.satisfaction_total_good + '</td></tr>'
				+ '<tr><td class="title">一般</td><td class="value">' + data.satisfaction_total_normal + '</td></tr>'
				+ '<tr><td class="title">差评</td><td class="value">' + data.satisfaction_total_bad + '</td></tr>'
				+ '</table></li>'
				+ '<li><a class="ui-btn">当月工单</a>'
				+ '<table class="data">'
				+ '<tr><td class="title">好评</td><td class="value">' + data.satisfaction_month_good + '</td></tr>'
				+ '<tr><td class="title">一般</td><td class="value">' + data.satisfaction_month_normal + '</td></tr>'
				+ '<tr><td class="title">差评</td><td class="value">' + data.satisfaction_month_bad + '</td></tr>'
				+ '</table></li>';

		if(wrcfController.supervisor == false){
			html = html.replace(/工单/gm, '任务');
		}
		return html;
	},

	updateWrCount : function(data){
		//修改标题上不同类型工单的数量
		var lis = $("#dropdownCurrent").parent().parent().find("ul li");
		var notcom_all = Number(data['notcom_common'])
					+ Number(data['notcom_preventive'])
					+ Number(data['notcom_self']);
		var com_all = Number(data['com_common'])
					+ Number(data['com_preventive'])
					+ Number(data['com_self']);
		data['notcom_all'] = notcom_all;
		data['com_all'] = com_all;

		for(var i=0; i<lis.length; i++){
			var _li = $(lis[i]);
			var status = _li.attr("status");
			var probtype = _li.attr("probtype");

			var key = status + "_" + probtype;
			var value = _li.attr("value");
			var count = data[key];
			value += "(" + count + ")";

			_li.attr("value", value);
			_li.html(value);

			if(key == 'notcom_all'){
				$("#dropdownCurrentBtn").html(value);
			}
			if(key == 'com_all'){
				$("#dropdownHistoryBtn").html(value);
			}
		}
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


	getCfInfo : function(){
		var url = wrcfController.agentUrl;
		$.ajax({
			url: url,
			type: 'GET',
			data:{cmd:'weChatWrcfService/getCfInfo/',param:wrcfController.rtx},
			// data: JSON.stringify(dto),
			dataType:"json",
			success: function (returndata) {
				console.log(returndata);
				var fmcode = returndata.fmcode;
				if(fmcode != 0){
					wrcfController.showBodyPage(false, returndata.message);
					return;
				}

				var contents = returndata.data.contents;
				wrcfController.workTeamId = contents.workTeamId;
				if(contents.supervisor == true){
					wrcfController.supervisor = true;
					wrcfController.getWorkTeamCfInfo();
				}
				
				wrcfController.init();
				wrcfController.showBodyPage(true);
			},
			error: function (returndata) {
				wrcfController.showBodyPage(false, "获取技工信息错误");
			}
        });
		/*var url = wrcfController.serverAddr + "/archibus/cxf/weChatWrcfService/getCfInfo/" + wrcfController.rtx;
		$.ajax({
			url: url,
			type: 'POST',
			// data: JSON.stringify(dto),
			contentType : "application/json",
			success: function (returndata) {
				console.log(returndata);
				var fmcode = returndata.fmcode;
				if(fmcode != 0){
					wrcfController.showBodyPage(false, returndata.message);
					return;
				}

				var contents = returndata.data.contents;
				wrcfController.workTeamId = contents.workTeamId;
				if(contents.supervisor == true){
					wrcfController.supervisor = true;
					wrcfController.getWorkTeamCfInfo();
				}
				
				wrcfController.init();
				wrcfController.showBodyPage(true);
			},
			error: function (returndata) {
				wrcfController.showBodyPage(false, "获取技工信息错误");
			}
        });*/
	},

	getWorkTeamCfInfo : function(){
		//var url = wrcfController.serverAddr + "/archibus/cxf/weChatWrcfService/getCfsByWorkTeam";
		var url = wrcfController.agentUrl + "?cmd=weChatWrcfService/getCfsByWorkTeam";
		var dto = {};
		dto["workTeamId"] = wrcfController.workTeamId;
		
		$.ajax({
			url: url,
			type: 'POST',
			data: dto,
			//contentType : "application/json",
			dataType:"json",
			success: function (returndata) {
				console.log(returndata);
				var fmcode = returndata.fmcode;
				if(fmcode != 0){
					return;
				}

				var contents = returndata.data.contents;
				wrcfController.cfs = contents;
			},
			error: function (returndata) {
				wrcfController.showBodyPage(false, "获取技工信息错误");
			}
        });
		
		/*$.ajax({
			url: url,
			type: 'POST',
			data: JSON.stringify(dto),
			contentType : "application/json",
			success: function (returndata) {
				console.log(returndata);
				var fmcode = returndata.fmcode;
				if(fmcode != 0){
					return;
				}

				var contents = returndata.data.contents;
				wrcfController.cfs = contents;
			},
			error: function (returndata) {
				wrcfController.showBodyPage(false, "获取技工信息错误");
			}
        });*/
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
				wrcfController.showBodyPage(false);
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
				wrcfController.showBodyPage(false);
			}else{
				wrcfController.openId = openId;
				wrcfController.rtx = rtx;

				wrcfController.getCfInfo();
			}
		}else{
			wrcfController.showBodyPage(false);
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
			wrcfController.showBodyPage(false);
			return;
		}

		var tokenUrl = wrcfController.serverAddr + "/archibus/cxf/weChatUserService/getUserByToken/" + token;
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

				wrcfController.openId = openId;
				wrcfController.rtx = rtx;

				if(openId == null || rtx == null){
					wrcfController.showBodyPage(false);
				}else{
					wrcfController.getCfInfo();
				}
			},
			error : function(){
				wrcfController.showBodyPage(false);
			}
		});
	},

	showBodyPage : function(ok, msg){
		msg = msg == null ? '未登录' : msg;
		if(ok){
			$("body").show();
		}else{
			$("body").html(msg);
			$("body").show();
		}
	}
}

wrcfController.getRtxOpenID();