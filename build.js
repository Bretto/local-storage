var fs = require('fs');
var browserify = require('browserify');
var shim = require('browserify-shim');


//shim(
//    browserify(),
//    {
//        Q: { path: './js/bower_components/q/q.js', exports: 'Q' },
//        breeze: { path: './js/bower_components/bower-breeze/breeze.debug.js', exports: 'breeze' }
//    })
//    .require(require.resolve('./js/app.js'), { entry: true })
//    .bundle({ debug: true })
//    .pipe(fs.createWriteStream('./bundle.js'));





browserify()
    .require(require.resolve('./js/app.js'), { entry: true })
    .bundle({ debug: true })
    .pipe(fs.createWriteStream('./bundle.js'));


//.pipe(fs.createWriteStream(__dirname + '/bundle.js'));