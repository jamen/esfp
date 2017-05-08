
const pull = require('pull-stream')

function qux () {
  foo()
  | bar()
  | baz()
}
