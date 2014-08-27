module.exports = function(config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    frameworks: ['mocha', 'chai', 'dojo'],

    // list of files / patterns to load in the browser
    files: [
      'test/spec/main.js',

      // all the sources, tests, data
      {pattern: 'src/lib/weighted-overlay-modeler/*.js', included: false},
      {pattern: 'test/spec/*.js', included: false},
      {pattern: 'test/data/*.json', included: false},
      {pattern: 'test/data/arcgis/**/*', included: false}
    ],

    // list of files to exclude
    // exclude: [
    // ],

    // test results reporter to use
    // possible values: dots || progress
    reporters: ['progress'],


    // web server port
    port: 9876,


    // proxy for cross domain requests
    // proxies:  {
    //   '/arcgis/': 'https://landscape3.arcgis.com/arcgis/'
    // },


    // cli runner port
    runnerPort: 9100,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari
    // -
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    // Configure the coverage reporters
    coverageReporter: {
      reporters:[
        {type: 'html', dir:'coverage/'},
        {type: 'text'}
      ]
    },

    plugins: [
      'karma-dojo',
      'karma-mocha',
      'karma-chai',
      'karma-coverage',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-ie-launcher'
    ]
  });
};