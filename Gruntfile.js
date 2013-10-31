/*!
 *  Gruntfile.js configuration
 */

'use strict';

module.exports = function ( grunt ) {

    /*
     * Dynamically load the npm tasks
     */
    // require( 'matchdep' ).filterDev('grunt-*').forEach( grunt.loadNpmTasks );

    /*
     * Grunt init
     */
    grunt.initConfig({

        /*
         * Grunt JSON for project
         */
        pkg: grunt.file.readJSON( 'package.json' ),

        /*
         * Credit banner
         */
        tag: {
            banner: "/*!\n" +
                    " *  <%= pkg.name %>\n" +
                    " *  @version <%= pkg.version %>\n" +
                    " *  @author <%= pkg.author %>\n" +
                    // " *  Project: <%= pkg.homepage %>\n" +
                    " *\n" +
                    " *  <%= pkg.description %>\n" +
                    // " *  Copyright <%= pkg.year %>." +
                    // " <%= pkg.licenses[0].type %> licensed.\n" +
                    " */\n"
        },

        /*
         * jsHint
         */
        jshint: {
            files: [
                "src/app/**/*.js",
                "!src/app/reports/*.js",
                "src/lib/weighted-overlay-modeler/**/*.js"
            ],
            options: {
                jshintrc: ".jshintrc"
            }
        },

        /*
         * Concat
         */
        // concat: {
        //     dist: {
        //         src: ["src/psswrd.js"],
        //         dest: "dist/psswrd.js"
        //     },
        //     options: {
        //         banner: "<%= tag.banner %>"
        //     }
        // },

        // * clean
        clean: ["dist"],

        //  * UglifyJS

        uglify: {
            dynamic_mappings: {
              // Grunt will search for "**/*.js" under "lib/" when the "minify" task
              // runs and build the appropriate src-dest file mappings then, so you
              // don't need to update the Gruntfile when files are added or removed.
              files: [
                {
                  expand: true,     // Enable dynamic expansion.
                  cwd: 'src',      // Src matches are relative to this path.
                  src: ['**/*.js','!tests/**','!app/config.js'], // Actual pattern(s) to match.
                  dest: 'dist/',   // Destination path prefix.
                  ext: '.js'   // Dest filepaths will have this extension.
                }
              ]
            },
            options: {
                banner: "<%= tag.banner %>"
            }
        },

        // copy html/css files

        copy: {
            main: {
              files: [
                // copy src html/css/image files to dist,
                // but not tests
                {
                  expand: true,     // Enable dynamic expansion.
                  cwd: 'src',      // Src matches are relative to this path.
                  src: ['**/*.html','**/*.css','**/images/*','**/img/*','proxy*','!tests/**'], // Actual pattern(s) to match.
                  dest: 'dist/'   // Destination path prefix.
                }
              ]
            },
            local: {
              files: [
                // copy the local config file unminified
                {
                  expand: true,     // Enable dynamic expansion.
                  cwd: 'src',      // Src matches are relative to this path.
                  src: ['app/config.js'], // Actual pattern(s) to match.
                  dest: 'dist/'   // Destination path prefix.
                }

              ]
            },
            dev: {
              files: [
                // copy dev config file unminified
                {
                  expand: true,     // Enable dynamic expansion.
                  cwd: 'src',      // Src matches are relative to this path.
                  src: ['app/config.dev'], // Actual pattern(s) to match.
                  dest: 'dist/',   // Destination path prefix.
                  ext: '.js'
                }
              ]
            },
            africa: {
              files: [
                // copy dev config file unminified
                {
                  expand: true,     // Enable dynamic expansion.
                  cwd: 'src',      // Src matches are relative to this path.
                  src: ['app/config.africa'], // Actual pattern(s) to match.
                  dest: 'dist/',   // Destination path prefix.
                  ext: '.js'
                }
              ]
            }
        }

    });

    // Load the plugin that provides the "jshint" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    /*
     * Register tasks
     */
    grunt.registerTask("default", [
        "jshint",
        // "concat",
        'clean',
        "uglify",
        "copy:main",
        "copy:local"
    ]);

    grunt.registerTask("dev", [
        "jshint",
        // "concat",
        'clean',
        "uglify",
        "copy:main",
        "copy:dev"
    ]);

    grunt.registerTask("africa", [
        "jshint",
        // "concat",
        'clean',
        "uglify",
        "copy:main",
        "copy:africa"
    ]);

    grunt.registerTask("hint", ["jshint"]);

};