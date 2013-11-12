/* global module:false */
module.exports = function(grunt) {

	// Project configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner:
				'/*!\n' +
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
                    'dest/output.js': ['js/*.js']
                }
            }
        }
	});

	// Dependencies
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );

	// Default task
	grunt.registerTask( 'default', ['uglify'] );

};
