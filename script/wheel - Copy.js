(function (wheel, $, undefined) {
	var rawItems = [];
	var filteredItems = [];
	var filters = [];
	var displayProperty = 'value';
	var selectedIndex = 0;
	
	var numberOfShifts = 200;
	var currentShift = 0;
	
	var minShiftDelay = 50;
	var maxShiftDelay = 500;
	
        var filterItems = function () {
                filteredItems = [];
		var numItems = rawItems.length;
		var numFilters = filters.length;
                for (var i = 0; i < numItems; i++) {
                        var matched = true;
                        for (var j = 0; j < numFilters; j++) {
                                matched = matched && filters[j](rawItems[i]);
                        }
                        if (matched) {
                                filteredItems.push(rawItems[i]);
                        }
                }
                return filteredItems;
        };
	
	var setFilters = function (filterFunctions) {
		filters = filterFunctions;
		filterItems();
	};
	
	var setItems = function (arr) {
		rawItems = arr;
	};
	
	var setDisplayProperty = function (property) {
		displayProperty = property || "value";
	};
	
	var getDisplayString = function (item) {
		var str = item;
		if (displayProperty !== undefined) {
			str = item[displayProperty];
		}
		return str;
	};
	
	var clear = function () {
		$('#wheelCanvas').html('');
	};
	
	var buildHtmlItem = function (item) {
		var domElement = $('<div />').addClass('wheel');
		domElement.text(getDisplayString(item));
		return domElement;
	};
	
	var getHtmlItems = function () {
		var result = [];
		var len = filteredItems.length;
		for (var i = 0; i < len; i++) {
			var htmlItem = buildHtmlItem(filteredItems[i]);
			result.push(htmlItem);
		}
		return result;
	};
	
	var conversionFactor = 2 * Math.PI / 360;
	var toRadians = function (degrees) {
		return (degrees * conversionFactor);
	};
	
	var panelWidth = 200;
	var panelHeight = 17;
	var horizontalSkew = 5;
	var verticalSkew = 5;
	var front = 100;
	var back = 50;
	var radius = 3 / 4 * panelWidth;
	var rotation = 0;
	var draw = function () {
		var centerOfWheelOffset = radius * 3 / 2;
		var htmlItems = getHtmlItems();
		var angleBetweenItems = 360 / htmlItems.length;
		for (var i = 0; i < htmlItems.length; i++) {
			var currentAngle = toRadians(rotation + (i * angleBetweenItems));
			var zIndex = radius + Math.floor(radius * Math.cos(currentAngle));
			var horizontalSkewOffset = Math.floor(radius * Math.cos(currentAngle) * Math.sin(toRadians(horizontalSkew)));
			var verticalSkewOffset = Math.floor(radius * Math.cos(currentAngle) * Math.sin(toRadians(verticalSkew)));
			var x = centerOfWheelOffset - horizontalSkewOffset;
			var y = centerOfWheelOffset + verticalSkewOffset - Math.floor(radius * Math.sin(currentAngle));
			var style = 'position:absolute;top:' + y + 'px;left:' + x + 'px;z-index:' + zIndex + ';';
			var shadeOfGrey = (0xFF - Math.floor(0x99 * (1 - zIndex / (2 * radius)))).toString(16);
			style += 'background-color:#' + shadeOfGrey + shadeOfGrey + shadeOfGrey + ';';
			var item = htmlItems[i];
			item.attr('style', style);
			$('#wheelCanvas').append(item);
		}
	};
	
	var initialize = function (config) {
		if(config === undefined || config === null) {
			throw('No configuration specified.');
		}
		else if(config.items === undefined) {
			throw('No items to populate the wheel with.');
		}
		setItems(config.items);
		setFilters(config.filters || []);
		setDisplayProperty(config.displayProperty || 'value');
		
		randomize();
		
		draw();
	};
	wheel.initialize = initialize;
	
	var randomize = function () {
		filterItems();
		selectedIndex = Math.floor(Math.random() * filteredItems.length);
		rotation = selectedIndex * (360 / filteredItems.length);
	};
	
	var rotate = function () {
		rotation++;
		clear();
		draw();
		setTimeout(rotate, minShiftDelay + Math.floor((maxShiftDelay - minShiftDelay) * Math.pow(currentShift / numberOfShifts, 4)));
	};
	wheel.rotate = rotate;
	
	var spin = function () {
		numberOfShifts = (6 * filteredItems.length) + Math.floor(2 * Math.random() * filteredItems.length);
		numberOfShifts *= Math.floor(360 / filteredItems.length);
		currentShift = 0;
		rotate();
	};
	wheel.spin = spin;
}(window.wheel = window.wheel || {}, jQuery));

