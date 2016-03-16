WechatLocation = {
	splitStr : '_____', //大厦bl_id和name中间的分隔符
	data : [{
		city : '深圳',
		bls : [{
			id : 'TX-SZ',
			name : '腾讯大厦',
			city : '深圳',
			longitude : 113.9297475,
			latitude : 22.54351631,
			lat: 22.54050722,
			lng: 113.93464347,
			origin : 'gps'
		},{
			id : 'DZ-SZ',
			name : '大族大厦',
			city : '深圳',
			longitude : 113.9303825,
			latitude : 22.54358444,
			lat: 22.54057652,
			lng: 113.9352794,
			origin : 'gps'
		},{
			id : 'HQ-SZ',
			name : '华强大厦',
			city : '深圳',
			longitude : 113.935338,
			latitude : 22.541415,
			origin : 'tencent'
		},{
			id : 'FYD-SZ',
			name : '飞亚达大厦',
			city : '深圳',
			longitude : 113.9509141,
			latitude : 22.54235693,
			lat: 22.5393894,
			lng: 113.95583849,
			origin : 'gps'
		},{
			id : 'WLD-SZ',
			name : '万利达大厦',
			city : '深圳',
			longitude : 113.928853,
			latitude : 22.54359559,
			lat: 22.5405855,
			lng: 113.93374726,
			origin : 'gps'
		},{
			id : 'LK-SZ',
			name : '朗科大厦',
			city : '深圳',
			longitude : 113.9483339,
			latitude : 22.53881677,
			lat: 22.53584228,
			lng: 113.95325263,
			origin : 'gps'
		},{
			id : 'SR-SZ',
			name : '松日大厦',
			city : '深圳',
			longitude : 113.9278579,
			latitude : 22.54362284,
			lat: 22.54061055,
			lng: 113.93275088,
			origin : 'gps'
		},{
			id : 'LGA-SZ',
			name : '龙光大厦A栋',
			city : '深圳',
			longitude : 113.886966,
			latitude : 22.549059,
			origin : 'tencent'
		},{
			id : 'LGB-SZ',
			name : '龙光大厦B栋',
			city : '深圳',
			longitude : 113.885878,
			latitude : 22.548765,
			origin : 'tencent'
		},{
			id : 'KXK-SZ',
			name : '科兴大厦',
			city : '深圳',
			longitude : 113.9392519,
			latitude : 22.55065057,
			lat: 22.5476651,
			lng: 113.94416533,
			origin : 'gps'
		}]
	// },{
	// 	city : '广州',
	// 	bls : [{
	// 		id : 'FNT-GD',
	// 		name : '广分南通',
	// 		city : '广州',
	// 		longitude : 113.3519732,
	// 		latitude : 23.13771623,
	// 		lat: 23.13517378,
	// 		lng: 113.3574484,
	// 		origin : 'gps'
	// 	},{
	// 		id : 'JLL-GD',
	// 		name : '广分金利来',
	// 		city : '广州',
	// 		longitude : 113.323552,
	// 		latitude : 23.14112286,
	// 		lat: 23.13853369,
	// 		lng: 113.32897553,
	// 		origin : 'gps'
	// 	},{
	// 		id : 'TIT-GD',
	// 		name : '广州TIT',
	// 		city : '广州',
	// 		longitude : 113.3195941,
	// 		latitude : 23.1031111,
	// 		lat: 23.10049769,
	// 		lng: 113.32500607,
	// 		origin : 'gps'
	// 	}]
	}],

	generateBlHtml : function(elementId){
		var len = WechatLocation.data.length;
		var html = '';
		for(var i=0; i<len; i++){
			var cityData = WechatLocation.data[i];
			var city = cityData.city;
			var bls = cityData.bls;

			html += '<li data-val="' + city + '">' + city + '<ul>';

			var tlen = bls.length;
			for(var k=0; k<tlen; k++){
				var bl = bls[k];
				html += '<li data-val="' + bl.id + WechatLocation.splitStr + bl.name + '">' + bl.name + '</li>';
			}

			html += '</ul></li>';
		}

		$("#" + elementId).html(html);
	},

	generateFlHtml : function(elementId, fls){
		if(fls == null){
			$("#" + elementId).html('');
			return;
		}

		var html = '';
		var len = fls.length;
		for(var i=0; i<len; i++){
			var fl = fls[i];
			html += '<option value="' + fl.flId + '">' + fl.flName + '</option>';
		}

		$("#" + elementId).html(html);
	},

	translateOriginToTencent : function(){
		var bl = {
			id : 'DZ-SZ',
			name : '大族大厦',
			city : '深圳',
			longitude : 113.9303825,
			latitude : 22.54358444,
			lat: 22.54050722,
			lng: 113.93464347,
			origin : 'gps'
		};
		console.log(bl);
		latlng = bl.latitude;
		/*qq.maps.convertor.translate(new qq.maps.LatLng(bl.latitude, bl.longitude), 1, function(res) {
	        latlng = res[0];
	        console.log(latlng);
	    });*/
	},

	getNearestBlIdTest : function(longitude, latitude){
		//var latlngcurrent = new qq.maps.LatLng(latitude, longitude);
		var currentLocation = {
			longitude : longitude,
			latitude : latitude
		}
		var dis = 100000000000000;
		var less = null;

		var kk = currentLocation.latitude + " : " + currentLocation.longitude + "\n";
		$("#formElementDescription").append(kk);

		var len = WechatLocation.data.length;
		for(var i=0; i<len; i++){
			var cityData = WechatLocation.data[i];
			var city = cityData.city;
			var bls = cityData.bls;

			var tlen = bls.length;
			for(var k=0; k<tlen; k++){
				var citya = bls[k];

				// var latlnga = null;
				// if(citya.origin == 'gps'){
				// 	latlnga = new qq.maps.LatLng(citya.lat, citya.lng);
				// }else{
				// 	latlnga = new qq.maps.LatLng(citya.latitude, citya.longitude);
				// }
				// var aDiff = latlngcurrent.distanceTo(latlnga);
				

				var ss = "";
				var aLngDifference = parseFloat(0);
				var aLatDifference = parseFloat(0);
				if(citya.origin == 'gps'){
					aLngDifference = parseFloat(citya.lng) - parseFloat(currentLocation.longitude);
					aLatDifference = parseFloat(citya.lat) - parseFloat(currentLocation.latitude);

					ss += citya.lat + " : " + citya.lng + "\n";
				}else{
					aLngDifference = parseFloat(citya.longitude) - parseFloat(currentLocation.longitude);
					aLatDifference = parseFloat(citya.latitude) - parseFloat(currentLocation.latitude);

					ss += citya.latitude + " : " + citya.longitude + "\n";
				}
				var aDiff = aLatDifference*aLatDifference + aLngDifference*aLngDifference;

				citya['dis'] = aDiff;
				if(aDiff < dis){
					less = citya;
					dis = aDiff;
				}

				// var ss = citya.name + " : " + citya.dis + " : " + aLatDifference + " : " + aLngDifference + "\n";
				$("#formElementDescription").append(ss);
			}
		}

		$("#formElementDescription").append(113.92811869632911 - citya.longitude);
		
		console.log(WechatLocation.data);
		return less;
	},

	getNearestBlId : function(longitude, latitude){
		var arr = new Array();
		var len = WechatLocation.data.length;
		for(var i=0; i<len; i++){
			var cityData = WechatLocation.data[i];
			var city = cityData.city;
			var bls = cityData.bls;

			var tlen = bls.length;
			for(var k=0; k<tlen; k++){
				var bl = bls[k];
				arr.push(bl);
			}
		}

		//sort
		//var latlngcurrent = new qq.maps.LatLng(latitude, longitude);
		var currentLocation = {
			longitude : longitude,
			latitude : latitude
		}
		arr.sort(function(citya, cityb){
			//距离计算，用腾讯的库
			/*var latlnga = null;
			if(citya.origin == 'gps'){
				latlnga = new qq.maps.LatLng(citya.lat, citya.lng);
			}else{
				latlnga = new qq.maps.LatLng(citya.latitude, citya.longitude);
			}
			var latlngb = null;
			if(cityb.origin == 'gps'){
				latlngb = new qq.maps.LatLng(cityb.lat, cityb.lng);
			}else{
				latlngb = new qq.maps.LatLng(cityb.latitude, cityb.longitude);
			}
			var aDiff = latlngcurrent.distanceTo(latlnga);
			var bDiff = latlngcurrent.distanceTo(latlngb);*/

			//距离计算，用经纬度差值的平方和
			 var aLngDifference = 0;
			 var aLatDifference = 0;
			 if(citya.origin == 'gps'){
				aLngDifference = citya.lng - currentLocation.longitude;
			 	aLatDifference = citya.lat - currentLocation.latitude;
			 }else{
			 	aLngDifference = citya.longitude - currentLocation.longitude;
			 	aLatDifference = citya.latitude - currentLocation.latitude;
			}
			var bLngDifference = 0;
			var bLatDifference = 0;
			if(cityb.origin == 'gps'){
				bLngDifference = citya.lng - currentLocation.longitude;
				bLatDifference = citya.lat - currentLocation.latitude;
			}else{
			 	bLngDifference = cityb.longitude - currentLocation.longitude;
			 	bLatDifference = cityb.latitude - currentLocation.latitude;
			}
			   var aDiff = aLatDifference*aLatDifference + aLngDifference*aLngDifference;
			   var bDiff = bLatDifference*bLatDifference + bLngDifference*bLngDifference;

			   citya["dis"] = aDiff;
			   cityb["dis"] = bDiff;

			return aDiff - bDiff;
		});

		return arr[0];
	}
}