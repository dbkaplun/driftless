/*global require*/

var gulp = require('gulp');
var jshint = require('gulp-jshint');
//var recess = require('gulp-recess');
var exec = require('gulp-exec');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var flatten = require('gulp-flatten');

var static = require('node-static');
var http = require('http');
var open = require('open');

var path = require('path');

var name = require('./package.json').name;
var paths = {
  www: 'www',

  js: ['**/*.js', '!' + name + '.js', '!**/*.min.js', '!node_modules/**/*.js', '!bower_components/**/*.js'],
  less: ['**/*.less', '!node_modules/**/*.less', '!bower_components/**/*.less']
};
paths.wwwBuild = path.join(paths.www, 'build');
paths.js.push('!' + path.join(paths.wwwBuild, '**', '*.js'));
paths.less.push('!' + path.join(paths.wwwBuild, '**', '*.less'));

var baseBrowserifyTransform = ['envify', 'browserify-shim', 'debowerify', 'deamdify'];
var uglifyOpts = {
  outSourceMap: true,
  preserveComments: 'some'
};

gulp.task('lint-js', function () {
  gulp.src(paths.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});
gulp.task('lint-less', function () {
//  gulp.src(paths.less)
//    .pipe(recess({
//      strictPropertyOrder: false, // Bootstrap ignores this
//      noOverqualifying: false, // Bootstrap ignores this
//      noUniversalSelectors: false, // Bootstrap ignores this
//      zeroUnits: false // Bootstrap ignores this
//    }));
});
gulp.task('lint', ['lint-js', 'lint-less']);

gulp.task('test', ['lint'], function () {
  gulp.src('test/index.js')
    .pipe(exec('istanbul cover <%= file.path %>'));
});

gulp.task('build', function () {
  var main = require.resolve('./.');

  gulp.src(main)
    .pipe(browserify({standalone: name}))
    .pipe(gulp.dest('.'));

  gulp.src(main)
    .pipe(browserify({standalone: name}))
    .pipe(rename(function (path) { path.basename += '.min'; }))
    .pipe(uglify(uglifyOpts))
    .pipe(gulp.dest('.'));
});

gulp.task('www-js', function () {
  gulp.src(path.join(paths.www, 'index.js'))
    .pipe(browserify({}))
    .pipe(uglify(uglifyOpts))
    .pipe(gulp.dest(path.join(paths.wwwBuild, 'js')));
});
gulp.task('www-less', ['www-fonts'], function () {
  gulp.src(path.join(paths.www, 'index.less'))
    .pipe(less({paths: [], compress: true}))
    .pipe(gulp.dest(path.join(paths.wwwBuild, 'css')));
});
gulp.task('www-fonts', function() {
  gulp.src('**/*.{ttf,woff,eof,svg}')
    .pipe(flatten())
    .pipe(gulp.dest(path.join(paths.wwwBuild, 'fonts')));
});
gulp.task('www-build', ['www-js', 'www-less', 'www-fonts']);
gulp.task('www', ['www-build'], function () {
  gulp.watch(paths.js.concat(['!gulpfile.js']), ['www-js']);
  gulp.watch(paths.less, ['www-less']);

  var fileServer = new static.Server();
  var httpServer = http.createServer(function (request, response) {
    request.addListener('end', fileServer.serve.bind(fileServer, request, response)).resume();
  });
  httpServer.on('listening', function () {
    var address = httpServer.address();
    var addressStr = address.address + ':' + address.port;
    console.log("Listening on " + addressStr);
    open('http://' + addressStr);
  });
  httpServer.listen(0, '127.0.0.1');
});

gulp.task('default', ['test', 'build', 'www-build']);
