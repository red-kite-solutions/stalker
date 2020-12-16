const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const child = require('child_process');

const tsProject = ts.createProject('tsconfig.json');

let node = null;

gulp.task('build', function () {
    return tsProject.src()
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(tsProject())
        .js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build'));
});

gulp.task('start', gulp.series('build', function(done) {
    if (!!node) {
        node.kill();
    }

    node = child.spawn('node', ['build/bin/www'], {stdio: 'inherit'});
    node.on('close', function (code) {
        if (code === 8) {
            gulp.log('Error detected, waiting for changes...');
        }
    });

    done();
}));

gulp.task('watch', gulp.series('build', 'start', function() {
    gulp.watch(tsProject.config.include, gulp.series('build', 'start'));
}));

gulp.task('default', gulp.parallel('watch', 'start'));

process.on('exit', function() {
    if (!!node) {
        node.kill();
    }
});
