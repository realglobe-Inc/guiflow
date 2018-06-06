var $ = require("./jquery-2.1.4.min");
var EventEmitter = require("events");
var sprintf = require("sprintf-js").sprintf;
var emitter = new EventEmitter();
var CURRENT_DOC;
var svgElement = function() {
    return $("svg");
};
var getViewBox = function(svg) {
    return svg[0].getAttribute("viewBox").split(/\s/g).map(parseFloat);
};


var VIEW_BOX_VALUES;
var SCALE = 1.0;
var DEFAULT_VIEW_BOX = "";
var setViewBox = function(svg, values) {
    var text = values.join(" ");
    svg[0].setAttribute("viewBox", text);
    $("#viewBox").text(sprintf("%4.2f,%4.2f,%4.2f,%4.2f", values[0], values[1], values[2], values[3]));
    VIEW_BOX_VALUES = values;
};

$(function() {
    $("#plus").on("click", function() {
        var svg = svgElement();
        var viewBoxValues = getViewBox(svg);
        viewBoxValues[2] /= 1.2;
        viewBoxValues[3] /= 1.2;
        setViewBox(svg, viewBoxValues);
    });

    $("#flat").on("click", function() {
        var svg = svgElement();
        setViewBox(svg, DEFAULT_VIEW_BOX);
    });

    $("#minus").on("click", function() {
        var svg = svgElement();
        var viewBoxValues = getViewBox(svg);
        viewBoxValues[2] *= 1.2;
        viewBoxValues[3] *= 1.2;
        setViewBox(svg, viewBoxValues);
    });

});

var refresh = function(data) {
    var meta = data.meta;
    var doc = data.svg;
    CURRENT_DOC = doc;
    $("#diagram-1").html(doc);
    var svg = svgElement();
    svg[0].setAttribute("viewBox", [-14, -30, svg.width() * 0.8, svg.height() * 0.8].join(" "));

    var metaData = JSON.parse(meta);
    DEFAULT_VIEW_BOX = getViewBox(svg);
    if (VIEW_BOX_VALUES)
        setViewBox(svg, VIEW_BOX_VALUES);
    var startX, startY;
    var initialViewBox;
    var onDrag = false;

    svg.find("g.node polygon").attr("fill", "white");
    svg.find("g.node ellipse").attr("fill", "white");
    svg.find("g.node").on("mouseover", function(e) {
        $(this).find("polygon").attr("stroke", "green");
        $(this).find("polygon").attr("stroke-width", "4");
        $(this).find("ellipse").attr("stroke", "red");
        $(this).find("ellipse").attr("stroke-width", "4");
    });
    svg.find("g.node").on("click", function(e) {
        var text = $(this).find("title").text().trim();
        if ($(this).find("ellipse").length === 0) {
            var lines = metaData[text].lines;
            emitter.emit("page-click", lines);
        } else {
            var insertText = ["\n[", text, "]\n"].join("");
            emitter.emit("end-click", insertText);
        }
    });
    svg.find("g.node").on("mouseout", function(e) {
        $(this).find("polygon").attr("stroke", "black");
        $(this).find("polygon").attr("stroke-width", "1");
        $(this).find("ellipse").attr("stroke", "black");
        $(this).find("ellipse").attr("stroke-width", "1");
    });
    svg.on("mousedown", function(evt) {
        startX = evt.clientX;
        startY = evt.clientY;
        initialViewBox = getViewBox(svg);
        onDrag = true;
        evt.preventDefault();
        return false;
    });
    svg.on("mousemove", function(evt) {
        if (onDrag) {
            movingX = evt.clientX;
            movingY = evt.clientY;
            var diffX = movingX - startX;
            var diffY = movingY - startY;
            var viewBoxValues = getViewBox(svg);
            viewBoxValues[0] = initialViewBox[0] - diffX * SCALE;
            viewBoxValues[1] = initialViewBox[1] - diffY * SCALE;
            setViewBox(svg, viewBoxValues);
        }
        evt.preventDefault();
        return false;
    });
    svg.on("mouseup", function(evt) {
        onDrag = false;
        evt.preventDefault();
        return false;
    });
};

module.exports = {
    refresh: refresh,
    on: function(channel, cb) {
        emitter.on(channel, cb);
    }
};
