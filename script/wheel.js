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
        wheelGeometry = {
            radius: 0,
            rotation: 0,
            x: 0,
            y: 0,
            pitch: 0,
            yaw: 0
        },
		foreground,
		background;
	
	var getDisplayString = function (item) {
		var str = item;
		if (displayProperty) {
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

	var buildRgbObject = function (color) {
        var result = color.match(/#([\dA-F]{2})([\dA-F]{2})([\dA-F]{2})/i);
		if(!!result) {
			return {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			};
		}
	};

	var getColorShade = function (fg, bg, percent) {
		return {
			r: getColorComponentShade(fg.r, bg.r, percent),
			b: getColorComponentShade(fg.b, bg.b, percent),
			g: getColorComponentShade(fg.g, bg.g, percent) 
		};
	};

	var padColor = function(color) {
		var leadingZeroes = '00';
		var colorString = color.toString(16);
		return leadingZeroes.substring(0, leadingZeroes.length - colorString.length) + colorString;
	};

	var getColorString = function (rgb) {
		var str = '#';
		str += padColor(rgb.r);
		str += padColor(rgb.g);
		str += padColor(rgb.b);
		return str;
	};

	var getColorComponentShade = function (fg, bg, p) {
		var diff = (bg - fg) * p;
		var shade = Math.floor(fg + diff);
		return shade;
	};
	
	var getBackgroundColor = function (zIndex) {
		var percent = (1 - zIndex / (2 * wheelGeometry.radius));
		var color = getColorShade(foreground, background, percent);
		return getColorString(color);
	};
	
	var draw = function () {
		var sineYaw = sine(wheelGeometry.yaw),
			sinePitch = sine(wheelGeometry.pitch),
			numHtmlItems = htmlItems.length;
        
		for (var i = 0; i < numHtmlItems; i++) {
			var currentAngle = Math.floor(wheelGeometry.rotation + angleOffset[i]) % 360,
                cosCurrentAngleTimesRadius = wheelGeometry.radius * cosine(currentAngle),
                zIndex = wheelGeometry.radius + Math.floor(cosCurrentAngleTimesRadius),
                horizontalSkewOffset = Math.floor(cosCurrentAngleTimesRadius * sineYaw),
                verticalSkewOffset = Math.floor(cosCurrentAngleTimesRadius * sinePitch),
                x = wheelGeometry.x - horizontalSkewOffset,
                y = wheelGeometry.y + verticalSkewOffset - Math.floor(wheelGeometry.radius * sine(currentAngle)),
                style = 'position: absolute; top: ' + y + 'px; left: ' + x + 'px; z-index: ' + zIndex + ';',
                bgColor = getBackgroundColor(zIndex);

            style += 'background-color: ' + bgColor + ';';
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
		wheelGeometry.rotation = Math.floor(selectedIndex * angleBetweenItems);
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

		wheelGeometry.radius = config.radius || (3 / 4 * panelWidth);
		wheelGeometry.x = (config.left || 100) + wheelGeometry.radius;
		wheelGeometry.y = (config.top || 100) + wheelGeometry.radius;
		wheelGeometry.pitch = config.pitch || 5;
		wheelGeometry.yaw = config.yaw || 5;

		setDisplayProperty(config.displayProperty || 'value');

        foreground = buildRgbObject(config.foreground || '#EEEEEE');
        background = buildRgbObject(config.background || '#999999');

		setItems(config.items);
		setFilters(config.filters || []);

		calculateAngles();

		initializeCanvas();

		randomize();

		draw();
	};
	wheel.initialize = initialize;

	var rotate = function () {
		wheelGeometry.rotation++;
		wheelGeometry.rotation %= 360;
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

