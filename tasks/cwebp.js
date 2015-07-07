var Q       = require('q');
var fs      = require('fs');
var path    = require('path');
var async   = require('async');
var spawn   = require('child_process').spawn;
var crypto  = require('crypto');
var CWEBP   = path.normalize(__dirname + '/../vendor/' + getName());
var CWD     = process.cwd();
var DLURL   = 'https://github.com/cghio/webp/raw/master/libwebp-0.4.0-';
var CHKSUMS = {
  "mac-10.8":     "31f9b71a1ae6bb8d36cbe9231217c1b47a194043",
  "linux-x86-32": "e42fb099dd177f8d38a3dcced5af4ef60b622855",
  "linux-x86-64": "02820c52bbe0e1a2399c6138460f0078cb98133c",
  "windows-x64":  "2d0babf3e86a8e9027d09f5b0e79de8efe3c5f70",
  "windows-x86":  "97cd5555bfe28b80016a09f54e0162529f71dd29"
};
var COLUMNS = process.stdout.columns || 80;

function isArray(what) {
  return Object.prototype.toString.call(what) === '[object Array]';
}

function relative(filepath) {
  return path.relative(CWD, filepath)
}

function download(url, filepath, chmod) {
  if (typeof url !== 'string' || url.length < 8) {
    return Q.reject('Invalid download URL.');
  }

  var protocol;
  if (url.substr(0, 8) === 'https://') {
    protocol = 'https';
  } else if (url.substr(0, 7) === 'http://') {
    protocol = 'http'
  }
  if (!protocol) return Q.reject('Unknown protocol of URL: ' + url);

  var algorithm = [ 'sha1', 'SHA-1' ];
  var checksum = url.match(/^(.*)#([a-f0-9]+)$/);
  if (checksum) {
    url = checksum[1];
    checksum = checksum[2];
  }
  var checksum2 = filepath.match(/^(.*)#([a-f0-9]+)$/);
  if (checksum2) {
    filepath = checksum2[1];
    checksum2 = checksum2[2];
    if (!checksum) checksum = checksum2;
  }
  if (checksum2 && checksum !== checksum2) {
    return Q.reject('Checksums of the URL and the file path are not the same.');
  }
  if (checksum) {
    if (checksum.length === 32)  algorithm = [ 'md5',    'MD5'     ];
    if (checksum.length === 64)  algorithm = [ 'sha256', 'SHA-256' ];
    if (checksum.length === 128) algorithm = [ 'sha512', 'SHA-512' ];
  }

  var deferred = Q.defer();
  setTimeout(function() {
    deferred.notify([ 'ok', 'Now downloading ' + url.underline + '.' ]);
  }, 0);
  var http    = require(protocol);
  var request = http.get(url, function(res) {
    if (res.statusCode === 301 || res.statusCode === 302) {
      url = res.headers.location;
      if (checksum) url += '#' + checksum;
      return deferred.resolve(download(url, filepath, chmod));
    } else if (res.statusCode !== 200) {
      return deferred.reject('Fail to download. Status: ' + res.statusCode);
    }
    var file   = fs.createWriteStream(filepath);
    var shasum = crypto.createHash(algorithm[0]);
    var total  = parseInt(res.headers['content-length']);
    var done   = 0;
    res.on('data', function(data) {
      file.write(data);
      shasum.update(data);
      done += data.length;
      deferred.notify([ 'clearWrite', (done / total * 100).toFixed(2) + '%, ' +
        done + ' of ' + total + ' bytes downloaded... ' ]);
    });
    res.on('end', function() {
      deferred.notify([ 'writeln' ]);
      file.end();
      var hash = shasum.digest('hex');
      deferred.notify([ 'ok', algorithm[1] + ': ' + hash ]);
      if (!checksum) {
        deferred.notify([ 'writeln', 'No checksum provided to verify.' ]);
      } else if (checksum !== hash) {
        fs.unlinkSync(filepath);
        return deferred.reject('The downloaded file does not match checksum ' +
          '"' + checksum + '" and is probably NOT the one you want!');
      } else {
        deferred.notify([ 'ok', 'The downloaded file passed checksum test.' ]);
      }

      var onFinish = function () {
        deferred.notify([ 'ok', 'Download completed: ' + relative(filepath) ]);

        if (chmod) {
          fs.chmodSync(filepath, chmod);
        }
        deferred.resolve();        
      };

      // File finish event added in node v0.10
      if (typeof file._events === 'object' &&
          typeof file._events.finish === 'function') {
        file.on('finish', onFinish);  
      } else {
        onFinish();
      }
    });
  });
  request.on('error', deferred.reject);
  return deferred.promise;
}

function getType() {
  var p = process.platform, a = process.arch;
  if (p === 'darwin') {
    return 'mac-10.8';
  } else if (p === 'linux') {
    if (a === 'x64') return 'linux-x86-64';
    return 'linux-x86-32';
  } else if (p === 'win32') {
    if (a === 'x64') return 'windows-x64';
    return 'windows-x86';
  }
  return undefined;
}

function getName() {
  if (process.platform === 'win32') return 'cwebp.exe';
  return 'cwebp';
}

function getURL() {
  var type = getType();
  if (!type) return undefined;
  return DLURL + type + '/bin/' + getName() + '#' + CHKSUMS[type];
}

function hashFile(path) {
  try {
    var shasum = crypto.createHash('sha1');
    shasum.update(fs.readFileSync(path));
    return shasum.digest('hex');
  } catch(e) {
    return undefined;
  }
}

function getSize(path) {
  try {
    return fs.statSync(path).size;
  } catch(e) {
    return 0;
  }
}

function pad(what, num) {
  if (num < 2) num = 2;
  var ret = Array(num).join(what);
  ret = ' ' + ret.slice(1, -1) + ' ';
  return ret;
}

function formatSize(size) {
  if (isNaN(size)) size = 0;
  if (size < 1024) return size + 'B';
  size /= 1024;
  if (size < 1024) return size.toFixed(1) + 'K';
  size /= 1024;
  return size.toFixed(1) + 'M';
}

function sizeDiff(src, dest) {
  var srcSize  = getSize(src);
  var destSize = getSize(dest);
  var diff     = destSize - srcSize;
  var color    = diff > 0 ? 'red' : 'green';
  var inc      = diff > 0 ? '+' : '-';
      diff     = Math.abs(diff);
  var percent  = diff / srcSize * 100;
  return (inc + percent.toFixed(1) + '% ' + inc + formatSize(diff))[color];
}

function cwebp(input, output, args) {
  var deferred  = Q.defer();
  var obfuscate = spawn(CWEBP, [ input, '-o', output ].concat(args));
  var stderr    = '';
  obfuscate.stderr.on('data', function(data) {
    stderr += data;
  });
  obfuscate.on('close', function(code) {
    if (code === 0) {
      deferred.resolve();
    } else {
      deferred.reject(stderr.trim() + '\n' + 'cwebp exited with code: ' + code);
    }
  });
  return deferred.promise;
}

module.exports = function(grunt) {

  grunt.log.clearWrite = function() {
    try {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      grunt.log.write.apply(null, arguments);
    } catch(e) {
      grunt.log.writeln.apply(null, arguments);
    }
  };

  grunt.registerMultiTask(
    'cwebp',
    'Convert images to WebP format with the encoder tool cwebp',
    function() {

    var files   = this.files;
    var finish  = this.async();
    var options = this.options();
    var args    = options.arguments;
    var startTime, completed = 0;

    var cc = options.concurrency;
    if (!/^[1-9][0-9]*$/.test(cc) || !(cc > 0 && cc < 100)) cc = 10;
    var concurrency = +cc;

    CWEBP = options.cwebpPath || CWEBP;

    if (!isArray(args)) args = [];

    Q.
    fcall(function() {
      try {
        fs.mkdirSync(path.dirname(CWEBP));
      } catch(e) {
        if (e.code !== 'EEXIST') throw e;
      }
      var type = getType(), url = getURL();
      if (type === undefined || url === undefined) {
        throw 'Can\'t download cwebp for your OS.';
      }
      if (!options.cwebpPath && hashFile(CWEBP) !== CHKSUMS[type]) {
        return download(url, CWEBP, 0755);
      }
    }).
    progress(function(bundle) {
      if (bundle) grunt.log[bundle[0]].apply(null, bundle.slice(1));
    }).
    then(function() {
      startTime = +new Date;
      var deferred = Q.defer();
      var queue = async.queue(function(task, callback) {
        cwebp(task.src, task.dest, args).then(callback).catch(callback);
      }, concurrency);
      for (var i = 0; i < files.length; i++) {
        for (var j = 0; j < files[i].src.length; j++) {
          var src  = path.resolve(files[i].src[j]), dest, dot;
          if (files[i].dest) {
            if (files[i].src.length < 2) {
              dest = path.resolve(files[i].dest);
                     grunt.file.mkdir(path.dirname(dest));
            } else {
              dest = path.resolve(files[i].dest);
                     grunt.file.mkdir(dest);
              dest = path.join(dest, path.basename(src));
              dot  = dest.lastIndexOf('.');
              dest = dest.slice(0, dot > -1 ? dot : undefined) + '.webp';
            }
          } else {
            dest   = src + '.webp';
          }
          var rdes = relative(dest);
          var task = {
            src:  src,
            dest: dest,
            rdes: rdes
          };
          queue.push(task, (function(task) {
            return function(err) {
              if (err) {
                return deferred.reject(err);
              }
              var left   = 'Generated ' + task.rdes.cyan;
              var leftL  = 3 + left.stripColors.length;
              var right  = sizeDiff(task.src, task.dest);
              var rightL = right.stripColors.length;
              var spaces = COLUMNS - leftL - rightL + 1;
              deferred.notify([ 'ok', left + pad('.', spaces) + right ]);
              completed++;
            };
          })(task));
        }
      }
      queue.drain = deferred.resolve;
      return deferred.promise;
    }).
    progress(function(bundle) {
      if (bundle) grunt.log[bundle[0]].apply(null, bundle.slice(1));
    }).
    then(function() {
      var diff = +new Date - startTime + '';
      var success = completed + ' conversion' + (completed > 1 ? 's' : '');
      success += ' finished in ' + diff.cyan + ' ms.';
      grunt.log.ok(success);
    }).
    catch(function(error) {
      grunt.fail.fatal(error);
    }).
    finally(function() {
      finish();
    });

  });

};
