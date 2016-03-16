<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Insert title here</title>
</head>
<body>
	<div>
		<table>
			<td class="val"><section class="photo">
				<div class="photoContainer">
					<!-- <img src="" class="pho-mini hidden" id="upload_img1"/>
                                    <img src="" class="pho-mini hidden" id="upload_img2"/>
                                    <img src="" class="pho-mini hidden" id="upload_img3"/>
                                    <img src="" class="pho-mini hidden" id="upload_img4"/> -->
					<img src="photo/img/pho_add.png" id="upload_img_pick"/>
				</div>
				<p>您最多可以上传4张故障说明图片</p>
				</section></td>
		</table>
	</div>
	<div hidden>
	<form id="uploadImgForm" enctype="multipart/form-data" method="post">
	    <input id="upload_doc1" type="file" name="doc1" accept="image/*" capture="camera"/>
	    <input id="upload_doc2" type="file" name="doc2" accept="image/*" capture="camera"/>
	    <input id="upload_doc3" type="file" name="doc3" accept="image/*" capture="camera"/>
	    <input id="upload_doc4" type="file" name="doc4" accept="image/*" capture="camera"/>
	</form>
	<!-- 相册容器 -->
<!-- <div id="iSlider-wrapper">
    <div class="islide-btnbar" style="display: none">
        <button id="closeISlider">返回</button>
        <button id="deleteISliderImg">删除</button>
    </div> -->
</div>
</div>
	<script src="photo/js/jquery-2.1.4.min.js"></script>
<script src="photo/js/bootstrap.min.js"></script>
<script src="photo/js/woodPhoto.js"></script>
<script src="photo/js/iSlider.js"></script>
	<script>
		//绑定添加图片按钮
		$("#upload_img_pick").click(function() {
			var inputId = "upload_doc1";
			/* if (woodController.imgCount >= 4) {
				return;
			}

			if (woodController.docNames["upload_doc1"] == null) {
				inputId = "upload_doc1";
			} else if (woodController.docNames["upload_doc2"] == null) {
				inputId = "upload_doc2";
			} else if (woodController.docNames["upload_doc3"] == null) {
				inputId = "upload_doc3";
			} else if (woodController.docNames["upload_doc4"] == null) {
				inputId = "upload_doc4";
			} else {
				return;
			} */
			//woodController.runClick(inputId);
			runClick(inputId);
		});
		function runClick(id) {
			var element = document.getElementById(id);
			if (document.all) {
				// For IE
				element.click();
			} else if (document.createEvent) {
				//FOR DOM2
				var ev = document.createEvent('HTMLEvents');
				ev.initEvent('click', false, true);
				element.dispatchEvent(ev);
				showBigImg();
			}
		}
		

		//var imageHtml='<img src="' + url + '" class="pho-mini originImg" id="'+yearRecord.eqId+'"/>'
		//$("#"+imgId).click(woodController.showBigImg);

			//iSlider
		/* function showBigImg(){
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

				if(woodController.islider == null){
					woodController.islider = new iSlider({
						dom : document.getElementById('iSlider-wrapper'),
						data : data,
						isOverspread : false
					});
				}else{
					woodController.islider.loadData(data);
				}
				woodController.islider.slideTo(index);

				$('.islide-btnbar').show();
				$('#deleteISliderImg').show();
				$('#iSlider-wrapper').show();
			} */
		
</script>
</body>
</html>
	