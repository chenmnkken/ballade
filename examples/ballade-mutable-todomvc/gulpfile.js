var gulp = require('gulp');
var gutil = require('gulp-util');
var babelify = require('babelify');
var browserify = require('browserify');
var watchify = require('watchify');
var cacheify = require('cacheify');
var levelup = require('levelup');
var source = require('vinyl-source-stream');
var less = require('gulp-less');
var connect = require('gulp-connect');
var db = levelup('./.cache');

var srcRoot = 'src';
var jsSrcPath = './src/js/index.js';
var jsDestPath = './src/js';
var port = 3003;

var browserOpts = {
    entries: [jsSrcPath],
    debug: true,
    insertGlobals: true
};

gulp.task('connect', function () {
    connect.server({
        root: [srcRoot],
        port: port,
        livereload: {
            port: port * 10
        },
        fallback: 'src/index.html'
    });
});

gulp.task('watch-html', function () {
    gulp.watch(srcRoot + '/**/*.html', function () {
        return gulp.src(srcRoot + '/**/*.html')
            .pipe(connect.reload());
    });
});

var bundle = function () {
    return watcher.bundle()
        .on('error', function (err) {
            console.log(err.message);
            console.log(err.stack);
        })
        .pipe(source('bundle.js'))
        .pipe(gulp.dest(jsDestPath))
        .pipe(connect.reload());
};

var babelifyCache = cacheify(babelify.configure({
    presets: ["es2015", "stage-0", "react"],
    plugins: ['external-helpers-2']
}), db);

var bundler = browserify(browserOpts)
    .transform(babelifyCache);

var watcher = watchify(bundler)
    .on('update', bundle)
    .on('log', gutil.log);

gulp.task('watch-js', bundle);
gulp.task('watch', ['watch-js', 'watch-html'])
gulp.task('default', ['connect', 'watch']);
