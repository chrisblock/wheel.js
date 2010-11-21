(function (wheel, $, undefined) {
	var rawItems = [],
		filters = [],
		htmlItems = [],
		angleBetweenItems,
		angleOffset = [],
		displayProperty,
		selectedIndex,
		currentShift,
		numberOfShifts,
		minShiftDelay = 5,
		maxShiftDelay = 50,
		sine = wheel.math.sine,
		cosine = wheel.math.cosine,
		canvas,
		panelWidth = 200,
		yaw,
		pitch,
		radius,
		rotation = 0,
		centerOfWheelX,
		centerOfWheelY;
	
	var getDisplayString = function (item) {
		var str = item;
		if (displayProperty !== undefined) {
			str = item[displayProperty];
		}
		return str;
	};
	
	var buildHtmlItem = function (item) {
		var domElement = $('<div />').addClass('wheel');
		domElement.text(getDisplayString(item));
		return domElement;
	};
	
	var filterItems = function () {
		htmlItems = [];
		var numItems = rawItems.length,
			numFilters = filters.length;
		for (var i = 0; i < numItems; i++) {
			var matched = true,
				item = rawItems[i];
			for (var j = 0; j < numFilters; j++) {
				matched = matched && filters[j](item);
			}
			if (matched) {
				var htmlItem = buildHtmlItem(item);
				htmlItems.push(htmlItem);
			}
		}
		return htmlItems;
	};
	
	var calculateShadeOfGrey = function (zIndex) {
		var color = (0xFF - Math.floor(0x99 * (1 - zIndex / (2 * radius)))).toString(16);
		return '#' + color + color + color;
	};
	
	var draw = function () {
		var sineYaw = sine(yaw),
			sinePitch = sine(pitch),
			numHtmlItems = htmlItems.length;
		for (var i = 0; i < numHtmlItems; i++) {
			var currentAngle = Math.floor(rotation + angleOffset[i]) % 360;
			
			var cosCurrentAngleTimesRadius = radius * cosine(currentAngle);
			
			var zIndex = radius + Math.floor(cosCurrentAngleTimesRadius);
			var horizontalSkewOffset = Math.floor(cosCurrentAngleTimesRadius * sineYaw);
			var verticalSkewOffset = Math.floor(cosCurrentAngleTimesRadius * sinePitch);
			var x = centerOfWheelX - horizontalSkewOffset;
			var y = centerOfWheelY + verticalSkewOffset - Math.floor(radius * sine(currentAngle));
			var style = 'position:absolute;top:' + y + 'px;left:' + x + 'px;z-index:' + zIndex + ';';
			var bgColor = calculateShadeOfGrey(zIndex);
			style += 'background-color:' + bgColor + ';';
			var item = htmlItems[i];
			item.attr('style', style);
		}
	};
	
	var initializeCanvas = function () {
		canvas = $('#wheelCanvas');
		draw();
		var numHtmlItems = htmlItems.length;
		for (var i = 0; i < numHtmlItems; i++) {
			canvas.append(htmlItems[i]);
		}
	};
	
	var setFilters = function (filterFunctions) {
		filters = filterFunctions;
		filterItems();
	};
	
	var setItems = function (items) {
		rawItems = items;
	};
	
	var setDisplayProperty = function (property) {
		displayProperty = property || 'value';
	};
	
	var randomize = function () {
		selectedIndex = Math.floor(Math.random() * htmlItems.length);
		rotation = Math.floor(selectedIndex * angleBetweenItems);
	};
	
	var calculateAngles = function () {
		var numberOfItems = htmlItems.length;
		angleBetweenItems = 360 / numberOfItems;
		for (var i = 0; i < numberOfItems; i++) {
			angleOffset[i] = i * angleBetweenItems;
		}
	};
	
	var initialize = function (config) {
		if (!config) {
			throw('No configuration specified.');
		}
		else if (config.items === undefined) {
			throw('No items to populate the wheel with.');
		}
		radius = config.radius || (3 / 4 * panelWidth);
		centerOfWheelX = (config.left || 100) + radius;
		centerOfWheelY = (config.top || 100) + radius;
		pitch = config.pitch || 5;
		yaw = config.yaw || 5;
		setDisplayProperty(config.displayProperty || 'value');
		
		setItems(config.items);
		setFilters(config.filters || []);
		
		calculateAngles();
		
		initializeCanvas();
		
		randomize();
		
		draw();
	};
	wheel.initialize = initialize;
	
	var rotate = function () {
		rotation++;
		rotation %= 360;
		draw();
		currentShift++;
		setTimeout(rotate, minShiftDelay + Math.floor((maxShiftDelay - minShiftDelay) * Math.pow(currentShift / numberOfShifts, 2)));
	};
	wheel.rotate = rotate;
	
	var spin = function () {
		numberOfShifts = (3 * htmlItems.length) + Math.floor(2 * Math.random() * htmlItems.length);
		numberOfShifts *= angleBetweenItems;
		numberOfShifts = Math.floor(numberOfShifts);
		currentShift = 0;
		rotate();
	};
	wheel.spin = spin;
}(window.wheel = window.wheel || {}, jQuery));

