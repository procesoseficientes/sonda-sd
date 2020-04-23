var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require("gulp-uglify");
 
gulp.task('compress', function() {
  gulp.src(['www/js/**/*.js','!www/js/**/*.min.js'])
    .pipe(uglify({
        preserveComments: 'false'
    }))
	.pipe(rename({
            suffix: '.min'
     }))
    .pipe(gulp.dest( function(file){
		return file.base;
	} ))
});