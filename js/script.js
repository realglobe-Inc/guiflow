//process.env.NODE_PATH = "./";
if (process.platform == "win32") {
    //modulePaths.push();
    var p = process.resourcesPath; //+ "\\app";
    console.log(p);
    module.paths.unshift(p + "\\app");
    module.paths.unshift(p + "\\app.asar");
    module.paths.unshift(p + "\\app\\node_modules");
    module.paths.unshift(p + "\\app.asar\\node_modules");
}
var resolvePath = function(p) {
    if (process.platform == "win32") {
        return p.replace(/^\.\//, '');
    } else {
        return p;
    }
};
var nodeModule = function() {
    if (process.platform == "win32") {
        return "node_modules/" + p;
    } else {
        return p;
    }

};
var ipcRenderer = require("electron").ipcRenderer;
var remote = require("electron").remote;
var fs = require("fs");
var flumine = require("flumine");
var $ = require(resolvePath("./js/jquery-2.1.4.min"));
var uiflow = remote.require("./app/uiflow");
var editor = require(resolvePath("./js/editor"));
var diagram = require(resolvePath("./js/diagram"));

[
    "open",
    "save",
    "saveAs",
    "undo",
    "redo",
    "cut",
    "copy",
    "paste",
    "selectAll"
].forEach(function(channel) {
    ipcRenderer.on(channel, editor[channel].listener(2));
});

var sendToEditor = function(channel) {
    return editor[channel];
};

var clipboard = require("electron").clipboard;
var nativeImage = require("electron").nativeImage;

var Menu = remote.Menu;
var menu = Menu.buildFromTemplate([{
    label: "Undo",
    accelerator: 'CmdOrCtrl+Z',
    click: sendToEditor("undo"),
}, {
    label: "Redo",
    accelerator: 'CmdOrCtrl+Y',
    click: sendToEditor("redo"),
}, {
    type: 'separator'
}, {
    label: "Cut",
    accelerator: 'CmdOrCtrl+X',
    click: sendToEditor("cut"),
}, {
    label: "Copy",
    accelerator: 'CmdOrCtrl+C',
    click: sendToEditor("copy"),
}, {
    label: "Paste",
    accelerator: 'CmdOrCtrl+V',
    click: sendToEditor("paste"),
}, {
    label: "Select All",
    accelerator: 'CmdOrCtrl+A',
    click: sendToEditor("selectAll"),
}, ]);

window.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    menu.popup(remote.getCurrentWindow());
}, false);

var dialogs = require("dialogs")({});


$(function() {


    $(window).on("load resize", function() {
        $(".main").height($(window).height());
    });
    $("#download").click(function(e) {
        editor.value.and(function(code) {
            return uiflow.update("<anon>", code, "svg");
        }).and(function(svg) {

            var image = new Image;
            var strSvg = String(svg);
            var match = strSvg.match(/svg width="(\d+)pt" height="(\d+)pt"/);
            var width = match[1];
            var height = match[2];

            image.src = "data:image/svg+xml," + encodeURIComponent(svg);
            var cElement = document.createElement("canvas");
            cElement.width = width * 2;
            cElement.height = height * 2;
            var cContext = cElement.getContext("2d");
            cContext.fillStyle = "#fff";
            cContext.fillRect(-10, -10, width * 3, height * 3);
            cContext.drawImage(image, 0, 0, width * 2, height * 2);
            var png = cElement.toDataURL("image/png");

            var image = nativeImage.createFromDataURL(png);
            clipboard.writeImage(image);

            alert("Copied Image to Clipboard");
        })();
    });

    editor.on("change", function(code) {
        uiflow.compile(code).then(function(data) {
                editor.clearError();
                return data;
            })
            .then(diagram.refresh)
            .catch(editor.setError);
    });
    editor.on("same", function(fileName) {
        document.title = "guiflow -- " + (fileName || "Untitled") + " = ";
    });
    editor.on("diff", function(fileName) {
        document.title = "guiflow -- " + (fileName || "Untitled") + " + ";
    });
    diagram.on("page-click", function(lines) {
        editor.navigateTo(lines);
    });
    diagram.on("end-click", function(text) {
        editor.insert(text);
    });
});
