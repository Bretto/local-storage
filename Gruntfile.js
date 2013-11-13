/* global module:false */
module.exports = function (grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/*!\n' +
                ' * MyTest <%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd, HH:MM") %>)\n' +
                ' * http://test.com\n' +
                ' * MIT licensed\n' +
                ' *\n' +
                ' * Copyright (C) 2013 Brett Coffin, http://dewmap.com\n' +
                ' */'
        },

        uglify: {
            my_target: {
                options: {
                    sourceMap: './bundle-map.js',
                    mangle: false,
                    beautify: true
                },
                files: {
                    './bundle.js': [
                        './js/bower_components/q/q.js',
                        './js/bower_components/jquery/jquery.js',
                        './js/bower_components/bower-breeze/breeze.debug.js',
                        './js/bower_components/angular/angular.js',
                        './js/bower_components/Ladda/js/spin.js',
                        './js/bower_components/Ladda/js/ladda.js',
                        './js/*.js'
                    ]
                }
            }
        }
    });

    // Dependencies
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Default task
    grunt.registerTask('default', ['uglify']);

};
