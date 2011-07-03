(function (wheel, $, undefined) {
	var splice = Array.prototype.splice,
        rawItems = [],
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
		canvas,
		panelWidth = 200,
        wheelGeometry,
		foreground,
		background,
        styleCache = {},
        conversionConstant = Math.PI / 180;

    var getDisplayableItems = function () {
        if (!htmlItems || !htmlItems.length) {
            applyFilters();
        }

        return htmlItems;
    };
	
	var getDisplayString = function (item) {
		var str = item;
        
		if (typeof(displayProperty) === 'string') {
			str = item[displayProperty];
		}
        else if(typeof(displayProperty) === 'function') {
            str = displayProperty(item);
        }

		return str;
	};
	
	var buildHtmlItem = function (item) {
		var domElement = $('<div />').addClass('wheel'),
            text = getDisplayString(item);

        domElement.text(text);

        return domElement;
	};
	
	var applyFilters = function () {
		var numItems = rawItems.length,
			numFilters = filters.length,
            i,
            j;

        htmlItems.splice(0, htmlItems.length);

        for (i = 0; i < numItems; i++) {
			var matched = true,
				item = rawItems[i];
            
			for (j = 0; j < numFilters; j++) {
				matched = matched && filters[j].call(null, item);
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
		var leadingZeroes = '00',
            colorString = color.toString(16);
        
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
		var diff = (bg - fg) * p,
            shade = Math.floor(fg + diff);

		return shade;
	};
	
	var getBackgroundColor = function (zIndex) {
		var percent = (1 - zIndex / (2 * wheelGeometry.radius)),
            color = getColorShade(foreground, background, percent);
        
		return getColorString(color);
	};

    var computeStyleForPosition = function (position) {
        if (!styleCache[position]) {
            var angleInRadians = position * conversionConstant,
                sineYaw = Math.sin(wheelGeometry.yaw),
			    sinePitch = Math.sin(wheelGeometry.pitch),
                cosCurrentAngleTimesRadius = wheelGeometry.radius * Math.cos(angleInRadians),
                zIndex = wheelGeometry.radius + Math.floor(cosCurrentAngleTimesRadius),
                horizontalSkewOffset = Math.floor(cosCurrentAngleTimesRadius * sineYaw),
                verticalSkewOffset = Math.floor(cosCurrentAngleTimesRadius * sinePitch),
                x = wheelGeometry.x - horizontalSkewOffset,
                y = wheelGeometry.y + verticalSkewOffset - Math.floor(wheelGeometry.radius * Math.sin(angleInRadians)),
                bgColor = getBackgroundColor(zIndex);

            styleCache[position] = {
                position: 'absolute',
                top: y + 'px',
                left: x + 'px',
                zIndex: zIndex,
                backgroundColor: bgColor
            };
        }

        return styleCache[position];
    };
	
	var draw = function () {
        var htmlItems = getDisplayableItems(),
            currentAngle,
            style,
            numHtmlItems = htmlItems.length,
            i;

		for (i = 0; i < numHtmlItems; i++) {
			currentAngle = Math.floor(wheelGeometry.rotation + angleOffset[i]) % 360;
            style = computeStyleForPosition(currentAngle);

            htmlItems[i].css(style);
		}
	};
	
	var initializeCanvas = function () {
        var htmlItems = getDisplayableItems();
		canvas = $('#wheelCanvas');
		draw();
		var numHtmlItems = htmlItems.length;
		for (var i = 0; i < numHtmlItems; i++) {
			canvas.append(htmlItems[i]);
		}
	};
	
	var setFilters = function (filterFunctions) {
		splice.apply(filters, [0, filters.length].concat(filterFunctions));
	};
	
	var setItems = function (items) {
		splice.apply(rawItems, [0, rawItems.length].concat(items));
	};
	
	var setDisplayProperty = function (property) {
		displayProperty = property || 'value';
	};
	
	var randomizeInitialSelection = function () {
		selectedIndex = Math.floor(Math.random() * getDisplayableItems().length);
		wheelGeometry.rotation = Math.floor(selectedIndex * angleBetweenItems);
	};
	
	var calculateAnglesBetweenItems = function () {
		var numberOfItems = getDisplayableItems().length,
            i;

		angleBetweenItems = 360 / numberOfItems;
        
		for (i = 0; i < numberOfItems; i++) {
			angleOffset[i] = i * angleBetweenItems;
		}
	};

    var renderSelectionIndicator = function () {
        var selectionIndicator = $('<span class="selection-indicator">&rarr;<\/span>').appendTo(canvas),
            style = $.extend({}, computeStyleForPosition(0)),
            left = style.left;

        delete style.backgroundColor;
        style.left = (+left.slice(0, left.length - 2) - selectionIndicator.outerWidth()) + 'px';

        selectionIndicator.css(style);
    };

	var initialize = function (config) {
		if (!config) {
			throw ({
                name: 'ConfigurationException',
                message: 'No configuration specified.'
            });
		}
		else if (!config.items) {
			throw ({
                name: 'ConfigurationException',
                message: 'No items to populate the wheel with.'
            });
		}

        var numberOfItems = config.items.length,
            radius = (config.radius || (3 / 4 * panelWidth)) * (numberOfItems / 15);

		wheelGeometry = {
            radius: radius,
            x: (config.left || 100) + radius,
            y: (config.top || 100) + radius,
            pitch: (config.pitch || 5) * conversionConstant,
            yaw: (config.yaw || 5) * conversionConstant
        };

		setDisplayProperty(config.display || 'value');

        foreground = buildRgbObject(config.foreground || '#EEEEEE');
        background = buildRgbObject(config.background || '#999999');

        setItems(config.items);
		setFilters(config.filters || []);

        calculateAnglesBetweenItems();

        randomizeInitialSelection();

        initializeCanvas();

		renderSelectionIndicator();
	};
	wheel.initialize = initialize;

	var rotate = function () {
		wheelGeometry.rotation++;
		wheelGeometry.rotation %= 360;
		draw();
		currentShift++;

        if (currentShift < numberOfShifts) {
		    setTimeout(rotate, minShiftDelay + Math.floor((maxShiftDelay - minShiftDelay) * Math.pow(currentShift / numberOfShifts, 2)));
        }
        else {
            // print details of the selected item
        }
	};

	var spin = function () {
        var numberOfDisplayableItems = getDisplayableItems().length;
		numberOfShifts = (3 * numberOfDisplayableItems) + Math.floor(2 * Math.random() * numberOfDisplayableItems);
		numberOfShifts *= angleBetweenItems;
		numberOfShifts = Math.floor(numberOfShifts);
		currentShift = 0;
		rotate();
	};
	wheel.spin = spin;

    var redraw = function () {
        calculateAnglesBetweenItems();

        randomizeInitialSelection();

        initializeCanvas();

		renderSelectionIndicator();
    };
    wheel.redraw = redraw;
}(window.wheel = window.wheel || {}, jQuery));

