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
//                    sourceMap: 'path/to/source-map.js',
                    mangle: false,
                    beautify: true
                },
                files: {
                    './bundle.js': [
                        './test/bower_components/q/q.js',
                        './test/bower_components/jquery/jquery.js',
                        './test/bower_components/bower-breeze/breeze.debug.js',
                        './test/bower_components/angular/angular.js',
                        './test/bower_components/Ladda/js/ladda.js',
                        './test/bower_components/Ladda/js/spin.js',
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
