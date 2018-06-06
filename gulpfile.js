var gulp = require('gulp');
var zip = require("gulp-zip");
var runseq = require("run-sequence");
var packager = require("electron-packager");

var electronVersion = "0.36.12";
var del = require('del');
gulp.task('clean', function(done) {
    return del(['package'], function() {
        done();
    });
});

gulp.task("package:win32", function(done) {
    var platform = "win32";
    return packager({
        dir: '.',
        name: '',
        arch: 'x64',
        platform: platform,
        out: 'package/' + platform,
        electronVersion: electronVersion,
        icon: "icon/guiflow.ico",
        ignore: "/package($|/)",
        asar: true,
    }, function(err) {
        if (err) {
            console.error(err);
        }
        done();
    });
});

gulp.task("package:linux", function(done) {
    var platform = "linux";
    return packager({
        dir: '.',
        name: '',
        arch: 'x64',
        platform: platform,
        out: 'package/' + platform,
        electronVersion: electronVersion,
        ignore: "/package($|/)",
        asar: true,
    }, function(err) {
        done();
    });
});


gulp.task("package:darwin", function(done) {
    var platform = "darwin";
    return packager({
        dir: '.',
        name: '',
        arch: 'x64',
        platform: platform,
        out: 'package/' + platform,
        electronVersion: electronVersion,
        ignore: "/package($|/)",
        icon: "icon/gui_flow_icon.icons",
        asar: true,
    }, function(err) {
        done();
    });
});



gulp.task("package:darwin", function(done) {
    var platform = "darwin";
    return packager({
        dir: '.',
        name: '',
        arch: 'x64',
        platform: platform,
        out: 'package/' + platform,
        electronVersion: electronVersion,
        ignore: "/package($|/)",
        icon: "icon/gui_flow_icon.icons",
        asar: true,
    }, function(err) {
        done();
    });
});
var shell = require('gulp-shell');

gulp.task("zip:darwin", shell.task([
    "echo hello",
    "zip -r guiflow-darwin.zip guiflow-darwin-x64"
], {
    cwd: "./package/darwin/"
}));
gulp.task("zip:win32", shell.task([
    "echo hello",
    "zip -r guiflow-win32.zip guiflow-win32-x64"
], {
    cwd: "./package/win32/"
}));

gulp.task("zip:linux", shell.task([
    "echo hello",
    "zip -r guiflow-linux.zip guiflow-linux-x64"
], {
    cwd: "./package/linux/"
}));
gulp.task('package', function(cb) {
    runseq(
        'clean', [
            'package:win32',
            'package:darwin',
            'package:linux'
        ], cb);
});
