var fs = require('fs');
var browserify = require('browserify');
var shim = require('browserify-shim');


shim(
    browserify(),
    {
        q: { path: './js/bower_components/q/q.js', exports: 'q' },
        breeze: { path: './js/bower_components/bower-breeze/breeze.debug.js', exports: 'breeze' }
    })
    .require(require.resolve('./js/app.js'), { entry: true })
    .bundle({ debug: true })
    .pipe(fs.createWriteStream('./bundle.js'));


//var fs =  require('fs');
//var browserify =  require('browserify');
//
//browserify()
//    .require(require.resolve('./js/app.js'), { entry: true })
//    .bundle({ debug: true })
//    .pipe(fs.createWriteStream(__dirname + '/bundle.js'));
//
//console.log('OK');