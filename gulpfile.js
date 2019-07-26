// Imports
var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var touch = require('gulp-touch-cmd');
var imagemin = require('gulp-imagemin');
var del = require('del');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var log = require('fancy-log');
var sass = require('gulp-sass');
var cssnano = require('gulp-cssnano');
var concat = require('gulp-concat');

// Configs
var config = require('./config.json');

// Define what files we're interested in within our file structure
// Source folders
const source_folder = './src';
const sources = {
    html: source_folder + '/html/**/*.html',
    php: source_folder + '/php/**/*.php',
    images: source_folder + '/images/**/*',
    styles: source_folder + '/styles/**/*.scss',
    vendor_scripts: source_folder + '/scripts/vendors/**/*.js',
    custom_scripts: source_folder + '/scripts/custom/**/*.js',
}

// Destination folders
const dist_base = './dist';
const destinations = {
    base: dist_base,
    images: dist_base + '/images',
    styles: dist_base + '/styles',
    scripts: dist_base + '/scripts',
}

// Functions that clean dist/ before reload, to be called before recreation of files
gulp.task('clean-php', function () {
    return del(destinations.base + '/*.php');
});
gulp.task('clean-html', function () {
    return del(destinations.base + '/*.html');
});
gulp.task('clean-images', function () {
    return del(destinations.images);
});
gulp.task('clean-vendor-scripts', function () {
    return del(destinations.scripts + '/vendor-scripts.min.js');
});
gulp.task('clean-custom-scripts', function () {
    return del(destinations.scripts + '/custom-scripts.min.js');
});

// Html and PHP files are copied to the base directory, unchanged
// Workflow:
//  1. Clean existing files
//  2. Copy new files
gulp.task('php', function () {
    return gulp.src(sources.php)
        .pipe(gulp.dest(destinations.base))
});
gulp.task('html', function () {
    return gulp.src(sources.html)
        .pipe(gulp.dest(destinations.base))
});

// Images need to be minified and compressed
// Workflow:
//  1. Clean existing images folder
//  2. Grab images
//  3. Optimise images
//  4. Move to destination
//  5. Update modification time
gulp.task('images', function () {
    return gulp.src(sources.images)
        .pipe(imagemin())
        .pipe(gulp.dest(destinations.images))
        .pipe(touch())
});

// Styles are combined into one file, and auto-updated without reloading the browser
// Workflow:
//  1. Check for errors in SASS
//  2. Create source maps
//  3. Compile
//  4. Auto-prefix
//  5. Minify
//  6. Concatenate
//  7. Update file
//  8. Stream to browser without reload
gulp.task('styles', function () {
    return gulp.src(sources.styles)
        .pipe(plumber(function (error) {
            log.error(error.message);
            this.emit('end');
        }))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(cssnano({
            safe: true,
            minifyFontValues: {
                removeQuotes: false
            }
        }))
        .pipe(concat('style.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destinations.styles))
        .pipe(browserSync.stream())
});

// Vendor scripts are combined into one file and browser updated
// Workflow:
//  1. Combine scripts
//  2. Update file
//  3. Update modification time
gulp.task('vendor-scripts', function () {
    return gulp.src(sources.vendor_scripts)
        .pipe(concat('vendor-scripts.min.js'))
        .pipe(gulp.dest(destinations.scripts))
        .pipe(touch())
});

// Custom scripts are combined into one file and browser updated
// Workflow:
//  1. Combine scripts
//  2. Update file
//  3. Update modification time
gulp.task('custom-scripts', function () {
    return gulp.src(sources.custom_scripts)
        .pipe(concat('custom-scripts.js'))
        .pipe(gulp.dest(destinations.scripts))
        .pipe(touch())
});

// Browser sync
gulp.task('browser-sync', function () {
    browserSync.init({
        proxy: config.proxyUrl,
    });

    // scripts to run on changes to files
    gulp.watch(sources.php, gulp.series('clean-php', 'php'))
        .on('change', browserSync.reload)
    gulp.watch(sources.html, gulp.series('clean-html', 'html'))
        .on('change', browserSync.reload)
    gulp.watch(sources.images, gulp.series('clean-images', 'images'))
        .on('change', browserSync.reload)
    gulp.watch(sources.vendor_scripts, gulp.series('clean-vendor-scripts', 'vendor-scripts'))
        .on('change', browserSync.reload)
    gulp.watch(sources.custom_scripts, gulp.series('clean-custom-scripts', 'custom-scripts'))
        .on('change', browserSync.reload)
    gulp.watch(sources.styles, gulp.series('styles'))
});