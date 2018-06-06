var $ = require("./jquery-2.1.4.min");
var fs = require("fs");
var EventEmitter = require('events');
var flumine = require("flumine");
var dialog = require('electron').remote.dialog;
var clipboard = require("electron").clipboard;
require('ace-min-noconflict');
require('ace-min-noconflict/theme-monokai');

var editor;
var EDITOR_FILE_NAME;
var EDITOR_FILE_VALUE;

var emitter = new EventEmitter();

$(window).on("load", function() {
    editor = ace.edit("text");
    editor.$blockScrolling = Infinity;
    if (process.platform === "darwin") {
        editor.commands.bindKey("Ctrl-P", "golineup");
    }
    editor.setTheme("ace/theme/monokai");
    setInterval(function() {
        if (editor.getValue() !== EDITOR_FILE_VALUE) {
            emitter.emit("diff", EDITOR_FILE_NAME);
        } else {
            emitter.emit("same", EDITOR_FILE_NAME);
        }
    }, 1000);
    var PREV = editor.getValue();
    setInterval(function() {
        now = editor.getValue();
        if (PREV !== now) {
            PREV = now;
            emitter.emit("change", now);
        }
    }, 500);

});

var waitEditorReady = flumine(function(d, ok, ng) {
    if (editor) {
        ok(d);
    } else {
        var id = setInterval(function() {
            if (editor) {
                clearInterval(id);
                ok(d);
            }
        }, 200);
    }
});

var getFileName = function(forceDialog) {
    return flumine(function(d, ok, ng) {
        if (!forceDialog && EDITOR_FILE_NAME) {
            return ok(EDITOR_FILE_NAME);
        } else {
            dialog.showSaveDialog({
                title: "save file",
                filters: [{
                    name: 'Documents',
                    extensions: ['txt', 'md', 'text']
                }, ],
            }, function(fileName) {
                if (fileName) {
                    ok(fileName);
                } else {
                    ok();
                }
            });
        }
    });
}

var saveFile = flumine(function(d, ok, ng) {
    if (!d) {
        return ok("canceled");
    }
    var code = editor.getValue();
    fs.writeFile(d, code, function(err) {
        if (err)
            return ng(err);
        EDITOR_FILE_NAME = d;
        EDITOR_FILE_VALUE = code;
        return ok(d);
    });

});

var copy = waitEditorReady.and(function() {
    var text = editor.getCopyText();
    clipboard.writeText(text);
});
var app = module.exports = {
    open: waitEditorReady.and(function(d, ok, ng) {
        var fileName = d[1];
        EDITOR_FILE_NAME = fileName;
        fs.readFile(fileName, function(err, cont) {
            if (err) {
                ng(err);
            } else {
                var code = String(cont);
                EDITOR_FILE_VALUE = code;
                editor.setValue(code);
                editor.navigateLineEnd();
                editor.focus();
                ok(cont);
            }
        });
    }),
    save: waitEditorReady
        .and(getFileName(false))
        .and(saveFile),
    saveAs: waitEditorReady
        .and(getFileName(true))
        .and(saveFile),

    undo: waitEditorReady.and(function() {
        editor.undo();
    }),
    redo: waitEditorReady.and(function() {
        editor.redo();
    }),
    cut: waitEditorReady.and(copy).and(function(d) {
        var target = editor.getSelectionRange();
        editor.getSession().getDocument().remove(target);
    }),
    copy: copy,
    paste: waitEditorReady.and(function() {
        var text = clipboard.readText();
        editor.insert(text);
    }),
    selectAll: waitEditorReady.and(function() {
        editor.getSelection().selectAll();
    }),
    value: waitEditorReady.and(function() {
        return editor.getValue();
    }),
    setError: waitEditorReady.and(function(err) {
        var errorInfo = err.message.split(/:/g);
        var fileName = errorInfo[0];
        var line = errorInfo[1];
        var text = errorInfo[3] + errorInfo[4];
        editor.getSession().setAnnotations([{
            row: line,
            type: "error",
            text: text,
        }]);
    }),
    clearError: waitEditorReady.through(function() {
        editor.getSession().setAnnotations([]);
    }),
    navigateTo: waitEditorReady.through(function(d) {
        editor.navigateTo(d, 0);
        editor.focus();
        editor.scrollToLine(d, true, true);
    }),
    insert: waitEditorReady.through(function(d) {
        editor.setValue(editor.getValue() + d);
        editor.navigateLineEnd();
        editor.focus();
    }),
    on: function(channel, cb) {
        emitter.on(channel, cb);
    },

};
