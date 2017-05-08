(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

var sources  = require('./sources')
var sinks    = require('./sinks')
var throughs = require('./throughs')

exports = module.exports = require('./pull')

for(var k in sources)
  exports[k] = sources[k]

for(var k in throughs)
  exports[k] = throughs[k]

for(var k in sinks)
  exports[k] = sinks[k]


},{"./pull":2,"./sinks":7,"./sources":14,"./throughs":23}],2:[function(require,module,exports){
'use strict'

module.exports = function pull (a) {
  var length = arguments.length
  if (typeof a === 'function' && a.length === 1) {
    var args = new Array(length)
    for(var i = 0; i < length; i++)
      args[i] = arguments[i]
    return function (read) {
      if (args == null) {
        throw new TypeError("partial sink should only be called once!")
      }

      // Grab the reference after the check, because it's always an array now
      // (engines like that kind of consistency).
      var ref = args
      args = null

      // Prioritize common case of small number of pulls.
      switch (length) {
      case 1: return pull(read, ref[0])
      case 2: return pull(read, ref[0], ref[1])
      case 3: return pull(read, ref[0], ref[1], ref[2])
      case 4: return pull(read, ref[0], ref[1], ref[2], ref[3])
      default:
        ref.unshift(read)
        return pull.apply(null, ref)
      }
    }
  }

  var read = a

  if (read && typeof read.source === 'function') {
    read = read.source
  }

  for (var i = 1; i < length; i++) {
    var s = arguments[i]
    if (typeof s === 'function') {
      read = s(read)
    } else if (s && typeof s === 'object') {
      s.sink(read)
      read = s.source
    }
  }

  return read
}

},{}],3:[function(require,module,exports){
'use strict'

var reduce = require('./reduce')

module.exports = function collect (cb) {
  return reduce(function (arr, item) {
    arr.push(item)
    return arr
  }, [], cb)
}

},{"./reduce":10}],4:[function(require,module,exports){
'use strict'

var reduce = require('./reduce')

module.exports = function concat (cb) {
  return reduce(function (a, b) {
    return a + b
  }, '', cb)
}

},{"./reduce":10}],5:[function(require,module,exports){
'use strict'

module.exports = function drain (op, done) {
  var read, abort

  function sink (_read) {
    read = _read
    if(abort) return sink.abort()
    //this function is much simpler to write if you
    //just use recursion, but by using a while loop
    //we do not blow the stack if the stream happens to be sync.
    ;(function next() {
        var loop = true, cbed = false
        while(loop) {
          cbed = false
          read(null, function (end, data) {
            cbed = true
            if(end = end || abort) {
              loop = false
              if(done) done(end === true ? null : end)
              else if(end && end !== true)
                throw end
            }
            else if(op && false === op(data) || abort) {
              loop = false
              read(abort || true, done || function () {})
            }
            else if(!loop){
              next()
            }
          })
          if(!cbed) {
            loop = false
            return
          }
        }
      })()
  }

  sink.abort = function (err, cb) {
    if('function' == typeof err)
      cb = err, err = true
    abort = err || true
    if(read) return read(abort, cb || function () {})
  }

  return sink
}

},{}],6:[function(require,module,exports){
'use strict'

function id (e) { return e }
var prop = require('../util/prop')
var drain = require('./drain')

module.exports = function find (test, cb) {
  var ended = false
  if(!cb)
    cb = test, test = id
  else
    test = prop(test) || id

  return drain(function (data) {
    if(test(data)) {
      ended = true
      cb(null, data)
    return false
    }
  }, function (err) {
    if(ended) return //already called back
    cb(err === true ? null : err, null)
  })
}





},{"../util/prop":30,"./drain":5}],7:[function(require,module,exports){
'use strict'

module.exports = {
  drain: require('./drain'),
  onEnd: require('./on-end'),
  log: require('./log'),
  find: require('./find'),
  reduce: require('./reduce'),
  collect: require('./collect'),
  concat: require('./concat')
}


},{"./collect":3,"./concat":4,"./drain":5,"./find":6,"./log":8,"./on-end":9,"./reduce":10}],8:[function(require,module,exports){
'use strict'

var drain = require('./drain')

module.exports = function log (done) {
  return drain(function (data) {
    console.log(data)
  }, done)
}

},{"./drain":5}],9:[function(require,module,exports){
'use strict'

var drain = require('./drain')

module.exports = function onEnd (done) {
  return drain(null, done)
}

},{"./drain":5}],10:[function(require,module,exports){
'use strict'

var drain = require('./drain')

module.exports = function reduce (reducer, acc, cb ) {
  if(!cb) cb = acc, acc = null
  var sink = drain(function (data) {
    acc = reducer(acc, data)
  }, function (err) {
    cb(err, acc)
  })
  if (arguments.length === 2)
    return function (source) {
      source(null, function (end, data) {
        //if ended immediately, and no initial...
        if(end) return cb(end === true ? null : end)
        acc = data; sink(source)
      })
    }
  else
    return sink
}

},{"./drain":5}],11:[function(require,module,exports){
'use strict'

module.exports = function count (max) {
  var i = 0; max = max || Infinity
  return function (end, cb) {
    if(end) return cb && cb(end)
    if(i > max)
      return cb(true)
    cb(null, i++)
  }
}



},{}],12:[function(require,module,exports){
'use strict'
//a stream that ends immediately.
module.exports = function empty () {
  return function (abort, cb) {
    cb(true)
  }
}

},{}],13:[function(require,module,exports){
'use strict'
//a stream that errors immediately.
module.exports = function error (err) {
  return function (abort, cb) {
    cb(err)
  }
}


},{}],14:[function(require,module,exports){
'use strict'
module.exports = {
  keys: require('./keys'),
  once: require('./once'),
  values: require('./values'),
  count: require('./count'),
  infinite: require('./infinite'),
  empty: require('./empty'),
  error: require('./error')
}

},{"./count":11,"./empty":12,"./error":13,"./infinite":15,"./keys":16,"./once":17,"./values":18}],15:[function(require,module,exports){
'use strict'
module.exports = function infinite (generate) {
  generate = generate || Math.random
  return function (end, cb) {
    if(end) return cb && cb(end)
    return cb(null, generate())
  }
}



},{}],16:[function(require,module,exports){
'use strict'
var values = require('./values')
module.exports = function (object) {
  return values(Object.keys(object))
}



},{"./values":18}],17:[function(require,module,exports){
'use strict'
var abortCb = require('../util/abort-cb')

module.exports = function once (value, onAbort) {
  return function (abort, cb) {
    if(abort)
      return abortCb(cb, abort, onAbort)
    if(value != null) {
      var _value = value; value = null
      cb(null, _value)
    } else
      cb(true)
  }
}



},{"../util/abort-cb":29}],18:[function(require,module,exports){
'use strict'
var abortCb = require('../util/abort-cb')

module.exports = function values (array, onAbort) {
  if(!array)
    return function (abort, cb) {
      if(abort) return abortCb(cb, abort, onAbort)
      return cb(true)
    }
  if(!Array.isArray(array))
    array = Object.keys(array).map(function (k) {
      return array[k]
    })
  var i = 0
  return function (abort, cb) {
    if(abort)
      return abortCb(cb, abort, onAbort)
    if(i >= array.length)
      cb(true)
    else
      cb(null, array[i++])
  }
}

},{"../util/abort-cb":29}],19:[function(require,module,exports){
'use strict'

function id (e) { return e }
var prop = require('../util/prop')

module.exports = function asyncMap (map) {
  if(!map) return id
  map = prop(map)
  var busy = false, abortCb, aborted
  return function (read) {
    return function next (abort, cb) {
      if(aborted) return cb(aborted)
      if(abort) {
        aborted = abort
        if(!busy) read(abort, cb)
        else read(abort, function () {
          //if we are still busy, wait for the mapper to complete.
          if(busy) abortCb = cb
          else cb(abort)
        })
      }
      else
        read(null, function (end, data) {
          if(end) cb(end)
          else if(aborted) cb(aborted)
          else {
            busy = true
            map(data, function (err, data) {
              busy = false
              if(aborted) {
                cb(aborted)
                abortCb(aborted)
              }
              else if(err) next (err, cb)
              else cb(null, data)
            })
          }
        })
    }
  }
}



},{"../util/prop":30}],20:[function(require,module,exports){
'use strict'

var tester = require('../util/tester')
var filter = require('./filter')

module.exports = function filterNot (test) {
  test = tester(test)
  return filter(function (data) { return !test(data) })
}

},{"../util/tester":31,"./filter":21}],21:[function(require,module,exports){
'use strict'

var tester = require('../util/tester')

module.exports = function filter (test) {
  //regexp
  test = tester(test)
  return function (read) {
    return function next (end, cb) {
      var sync, loop = true
      while(loop) {
        loop = false
        sync = true
        read(end, function (end, data) {
          if(!end && !test(data))
            return sync ? loop = true : next(end, cb)
          cb(end, data)
        })
        sync = false
      }
    }
  }
}


},{"../util/tester":31}],22:[function(require,module,exports){
'use strict'

var values = require('../sources/values')
var once = require('../sources/once')

//convert a stream of arrays or streams into just a stream.
module.exports = function flatten () {
  return function (read) {
    var _read
    return function (abort, cb) {
      if (abort) { //abort the current stream, and then stream of streams.
        _read ? _read(abort, function(err) {
          read(err || abort, cb)
        }) : read(abort, cb)
      }
      else if(_read) nextChunk()
      else nextStream()

      function nextChunk () {
        _read(null, function (err, data) {
          if (err === true) nextStream()
          else if (err) {
            read(true, function(abortErr) {
              // TODO: what do we do with the abortErr?
              cb(err)
            })
          }
          else cb(null, data)
        })
      }
      function nextStream () {
        _read = null
        read(null, function (end, stream) {
          if(end)
            return cb(end)
          if(Array.isArray(stream) || stream && 'object' === typeof stream)
            stream = values(stream)
          else if('function' != typeof stream)
            stream = once(stream)
          _read = stream
          nextChunk()
        })
      }
    }
  }
}


},{"../sources/once":17,"../sources/values":18}],23:[function(require,module,exports){
'use strict'

module.exports = {
  map: require('./map'),
  asyncMap: require('./async-map'),
  filter: require('./filter'),
  filterNot: require('./filter-not'),
  through: require('./through'),
  take: require('./take'),
  unique: require('./unique'),
  nonUnique: require('./non-unique'),
  flatten: require('./flatten')
}




},{"./async-map":19,"./filter":21,"./filter-not":20,"./flatten":22,"./map":24,"./non-unique":25,"./take":26,"./through":27,"./unique":28}],24:[function(require,module,exports){
'use strict'

function id (e) { return e }
var prop = require('../util/prop')

module.exports = function map (mapper) {
  if(!mapper) return id
  mapper = prop(mapper)
  return function (read) {
    return function (abort, cb) {
      read(abort, function (end, data) {
        try {
        data = !end ? mapper(data) : null
        } catch (err) {
          return read(err, function () {
            return cb(err)
          })
        }
        cb(end, data)
      })
    }
  }
}

},{"../util/prop":30}],25:[function(require,module,exports){
'use strict'

var unique = require('./unique')

//passes an item through when you see it for the second time.
module.exports = function nonUnique (field) {
  return unique(field, true)
}

},{"./unique":28}],26:[function(require,module,exports){
'use strict'

//read a number of items and then stop.
module.exports = function take (test, opts) {
  opts = opts || {}
  var last = opts.last || false // whether the first item for which !test(item) should still pass
  var ended = false
  if('number' === typeof test) {
    last = true
    var n = test; test = function () {
      return --n
    }
  }

  return function (read) {

    function terminate (cb) {
      read(true, function (err) {
        last = false; cb(err || true)
      })
    }

    return function (end, cb) {
      if(ended)            last ? terminate(cb) : cb(ended)
      else if(ended = end) read(ended, cb)
      else
        read(null, function (end, data) {
          if(ended = ended || end) {
            //last ? terminate(cb) :
            cb(ended)
          }
          else if(!test(data)) {
            ended = true
            last ? cb(null, data) : terminate(cb)
          }
          else
            cb(null, data)
        })
    }
  }
}

},{}],27:[function(require,module,exports){
'use strict'

//a pass through stream that doesn't change the value.
module.exports = function through (op, onEnd) {
  var a = false

  function once (abort) {
    if(a || !onEnd) return
    a = true
    onEnd(abort === true ? null : abort)
  }

  return function (read) {
    return function (end, cb) {
      if(end) once(end)
      return read(end, function (end, data) {
        if(!end) op && op(data)
        else once(end)
        cb(end, data)
      })
    }
  }
}

},{}],28:[function(require,module,exports){
'use strict'

function id (e) { return e }
var prop = require('../util/prop')
var filter = require('./filter')

//drop items you have already seen.
module.exports = function unique (field, invert) {
  field = prop(field) || id
  var seen = {}
  return filter(function (data) {
    var key = field(data)
    if(seen[key]) return !!invert //false, by default
    else seen[key] = true
    return !invert //true by default
  })
}


},{"../util/prop":30,"./filter":21}],29:[function(require,module,exports){
module.exports = function abortCb(cb, abort, onAbort) {
  cb(abort)
  onAbort && onAbort(abort === true ? null: abort)
  return
}


},{}],30:[function(require,module,exports){
module.exports = function prop (key) {
  return key && (
    'string' == typeof key
    ? function (data) { return data[key] }
    : 'object' === typeof key && 'function' === typeof key.exec //regexp
    ? function (data) { var v = key.exec(data); return v && v[0] }
    : key
  )
}

},{}],31:[function(require,module,exports){
var prop = require('./prop')

function id (e) { return e }

module.exports = function tester (test) {
  return (
    'object' === typeof test && 'function' === typeof test.test //regexp
    ? function (data) { return test.test(data) }
    : prop (test) || id
  )
}

},{"./prop":30}],32:[function(require,module,exports){

var pull = require('pull-stream');

function qux() {
  return pull(foo(), bar(), baz());
}
},{"pull-stream":1}]},{},[32]);
