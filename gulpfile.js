'use strict'

var path = require('path');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var eslint = require('gulp-eslint');
var eslintrcPath = path.resolve(__dirname, './eslintrc.json');

var uglifyConfig = {
    compress: {
        drop_console: true
    }
};

var balladeBrowserifyConfig = {
    entries: 'src/ballade.js',
    insertGlobals: true,
    detectGlobals: false,
    standalone: 'Ballade'
};

var balladeImmutableBrowserifyConfig = {
    entries: 'src/ballade.immutable.js',
    insertGlobals: true,
    detectGlobals: false,
    standalone: 'Ballade'
};

gulp.task('build-ballade', function () {
    return browserify(balladeBrowserifyConfig)
        .bundle()
        .pipe(source('ballade.js'))
        .pipe(buffer())
        .pipe(gulp.dest('dist/'));
});

gulp.task('build-ballade-min', function () {
    return browserify(balladeBrowserifyConfig)
        .bundle()
        .pipe(source('ballade.min.js'))
        .pipe(buffer())
        .pipe(uglify(uglifyConfig))
        .pipe(gulp.dest('dist/'));
});

gulp.task('build-ballade-immutable', function () {
    return browserify(balladeImmutableBrowserifyConfig)
        .ignore('immutable')
        .bundle()
        .pipe(source('ballade.immutable.js'))
        .pipe(buffer())
        .pipe(gulp.dest('dist/'));
});

gulp.task('build-ballade-immutable-min', function () {
    return browserify(balladeImmutableBrowserifyConfig)
        .ignore('immutable')
        .bundle()
        .pipe(source('ballade.immutable.min.js'))
        .pipe(buffer())
        .pipe(uglify(uglifyConfig))
        .pipe(gulp.dest('dist/'));
});

gulp.task('default', [
    'build-ballade',
    'build-ballade-min',
    'build-ballade-immutable',
    'build-ballade-immutable-min'
]);

// js lint
gulp.task('lint', function () {
    return gulp.src(['./src/**/*.js'])
        .pipe(eslint(eslintrcPath))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});
