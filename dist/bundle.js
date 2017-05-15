(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (value instanceof ArrayBuffer) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (isArrayBufferView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (isArrayBufferView(string) || string instanceof ArrayBuffer) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
function isArrayBufferView (obj) {
  return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":3,"ieee754":4}],3:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pushEncodedKeyValuePair(pairs, key, obj[key]);
        }
      }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (Array.isArray(val)) {
    return val.forEach(function(v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  }
  pairs.push(encodeURIComponent(key)
    + '=' + encodeURIComponent(val));
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Force given parser
 *
 * Sets the body parser no matter type.
 *
 * @param {Function}
 * @api public
 */

Request.prototype.parse = function(fn){
  this._parser = fn;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(field, file, filename || file.name);
  return this;
};

/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = 'download';
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this.getHeader('Content-Type');
    var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

Request.prototype.then = function (fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":6,"reduce":7}],6:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],7:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }

  return curr;
};
},{}],8:[function(require,module,exports){
(function (Buffer){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['superagent'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('superagent'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.ApiClient = factory(root.superagent);
  }
}(this, function(superagent) {
  'use strict';

  /**
   * @module ApiClient
   * @version 2.1.2
   */

  /**
   * Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
   * application to use this class directly - the *Api and model classes provide the public API for the service. The
   * contents of this file should be regarded as internal but are documented for completeness.
   * @alias module:ApiClient
   * @class
   */
  var exports = function() {
    /**
     * The base URL against which to resolve every API call's (relative) path.
     * @type {String}
     * @default https://localhost/
     */
    this.basePath = 'https://localhost/'.replace(/\/+$/, '');

    /**
     * The authentication methods to be included for all API calls.
     * @type {Array.<String>}
     */
    this.authentications = {
      'jwtToken': {type: 'apiKey', 'in': 'header', name: 'Authorization'}
    };
    /**
     * The default HTTP headers to be included for all API calls.
     * @type {Array.<String>}
     * @default {}
     */
    this.defaultHeaders = {};

    /**
     * The default HTTP timeout for all API calls.
     * @type {Number}
     * @default 60000
     */
    this.timeout = 60000;

    /**
     * If set to false an additional timestamp parameter is added to all API GET calls to
     * prevent browser caching
     * @type {Boolean}
     * @default true
     */
    this.cache = true;
  };

  /**
   * Returns a string representation for an actual parameter.
   * @param param The actual parameter.
   * @returns {String} The string representation of <code>param</code>.
   */
  exports.prototype.paramToString = function(param) {
    if (param == undefined || param == null) {
      return '';
    }
    if (param instanceof Date) {
      return param.toJSON();
    }
    return param.toString();
  };

  /**
   * Builds full URL by appending the given path to the base URL and replacing path parameter place-holders with parameter values.
   * NOTE: query parameters are not handled here.
   * @param {String} path The path to append to the base URL.
   * @param {Object} pathParams The parameter values to append.
   * @returns {String} The encoded path with parameter values substituted.
   */
  exports.prototype.buildUrl = function(path, pathParams) {
    if (!path.match(/^\//)) {
      path = '/' + path;
    }
    var url = this.basePath + path;
    var _this = this;
    url = url.replace(/\{([\w-]+)\}/g, function(fullMatch, key) {
      var value;
      if (pathParams.hasOwnProperty(key)) {
        value = _this.paramToString(pathParams[key]);
      } else {
        value = fullMatch;
      }
      return encodeURIComponent(value);
    });
    return url;
  };

  /**
   * Checks whether the given content type represents JSON.<br>
   * JSON content type examples:<br>
   * <ul>
   * <li>application/json</li>
   * <li>application/json; charset=UTF8</li>
   * <li>APPLICATION/JSON</li>
   * </ul>
   * @param {String} contentType The MIME content type to check.
   * @returns {Boolean} <code>true</code> if <code>contentType</code> represents JSON, otherwise <code>false</code>.
   */
  exports.prototype.isJsonMime = function(contentType) {
    return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
  };

  /**
   * Chooses a content type from the given array, with JSON preferred; i.e. return JSON if included, otherwise return the first.
   * @param {Array.<String>} contentTypes
   * @returns {String} The chosen content type, preferring JSON.
   */
  exports.prototype.jsonPreferredMime = function(contentTypes) {
    for (var i = 0; i < contentTypes.length; i++) {
      if (this.isJsonMime(contentTypes[i])) {
        return contentTypes[i];
      }
    }
    return contentTypes[0];
  };

  /**
   * Checks whether the given parameter value represents file-like content.
   * @param param The parameter to check.
   * @returns {Boolean} <code>true</code> if <code>param</code> represents a file.
   */
  exports.prototype.isFileParam = function(param) {
    // fs.ReadStream in Node.js (but not in runtime like browserify)
    if (typeof window === 'undefined' &&
        typeof require === 'function' &&
        require('fs') &&
        param instanceof require('fs').ReadStream) {
      return true;
    }
    // Buffer in Node.js
    if (typeof Buffer === 'function' && param instanceof Buffer) {
      return true;
    }
    // Blob in browser
    if (typeof Blob === 'function' && param instanceof Blob) {
      return true;
    }
    // File in browser (it seems File object is also instance of Blob, but keep this for safe)
    if (typeof File === 'function' && param instanceof File) {
      return true;
    }
    return false;
  };

  /**
   * Normalizes parameter values:
   * <ul>
   * <li>remove nils</li>
   * <li>keep files and arrays</li>
   * <li>format to string with `paramToString` for other cases</li>
   * </ul>
   * @param {Object.<String, Object>} params The parameters as object properties.
   * @returns {Object.<String, Object>} normalized parameters.
   */
  exports.prototype.normalizeParams = function(params) {
    var newParams = {};
    for (var key in params) {
      if (params.hasOwnProperty(key) && params[key] != undefined && params[key] != null) {
        var value = params[key];
        if (this.isFileParam(value) || Array.isArray(value)) {
          newParams[key] = value;
        } else {
          newParams[key] = this.paramToString(value);
        }
      }
    }
    return newParams;
  };

  /**
   * Enumeration of collection format separator strategies.
   * @enum {String}
   * @readonly
   */
  exports.CollectionFormatEnum = {
    /**
     * Comma-separated values. Value: <code>csv</code>
     * @const
     */
    CSV: ',',
    /**
     * Space-separated values. Value: <code>ssv</code>
     * @const
     */
    SSV: ' ',
    /**
     * Tab-separated values. Value: <code>tsv</code>
     * @const
     */
    TSV: '\t',
    /**
     * Pipe(|)-separated values. Value: <code>pipes</code>
     * @const
     */
    PIPES: '|',
    /**
     * Native array. Value: <code>multi</code>
     * @const
     */
    MULTI: 'multi'
  };

  /**
   * Builds a string representation of an array-type actual parameter, according to the given collection format.
   * @param {Array} param An array parameter.
   * @param {module:ApiClient.CollectionFormatEnum} collectionFormat The array element separator strategy.
   * @returns {String|Array} A string representation of the supplied collection, using the specified delimiter. Returns
   * <code>param</code> as is if <code>collectionFormat</code> is <code>multi</code>.
   */
  exports.prototype.buildCollectionParam = function buildCollectionParam(param, collectionFormat) {
    if (param == null) {
      return null;
    }
    switch (collectionFormat) {
      case 'csv':
        return param.map(this.paramToString).join(',');
      case 'ssv':
        return param.map(this.paramToString).join(' ');
      case 'tsv':
        return param.map(this.paramToString).join('\t');
      case 'pipes':
        return param.map(this.paramToString).join('|');
      case 'multi':
        // return the array directly as SuperAgent will handle it as expected
        return param.map(this.paramToString);
      default:
        throw new Error('Unknown collection format: ' + collectionFormat);
    }
  };

  /**
   * Applies authentication headers to the request.
   * @param {Object} request The request object created by a <code>superagent()</code> call.
   * @param {Array.<String>} authNames An array of authentication method names.
   */
  exports.prototype.applyAuthToRequest = function(request, authNames) {
    var _this = this;
    authNames.forEach(function(authName) {
      var auth = _this.authentications[authName];
      switch (auth.type) {
        case 'basic':
          if (auth.username || auth.password) {
            request.auth(auth.username || '', auth.password || '');
          }
          break;
        case 'apiKey':
          if (auth.apiKey) {
            var data = {};
            if (auth.apiKeyPrefix) {
              data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
            } else {
              data[auth.name] = auth.apiKey;
            }
            if (auth['in'] === 'header') {
              request.set(data);
            } else {
              request.query(data);
            }
          }
          break;
        case 'oauth2':
          if (auth.accessToken) {
            request.set({'Authorization': 'Bearer ' + auth.accessToken});
          }
          break;
        default:
          throw new Error('Unknown authentication type: ' + auth.type);
      }
    });
  };

  /**
   * Deserializes an HTTP response body into a value of the specified type.
   * @param {Object} response A SuperAgent response object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns A value of the specified type.
   */
  exports.prototype.deserialize = function deserialize(response, returnType) {
    if (response == null || returnType == null || response.status == 204) {
      return null;
    }
    // Rely on SuperAgent for parsing response body.
    // See http://visionmedia.github.io/superagent/#parsing-response-bodies
    var data = response.body;
    if (data == null || (typeof data === 'object' && typeof data.length === 'undefined' && !Object.keys(data).length)) {
      // SuperAgent does not always produce a body; use the unparsed response as a fallback
      data = response.text;
    }
    return exports.convertToType(data, returnType);
  };

  /**
   * Callback function to receive the result of the operation.
   * @callback module:ApiClient~callApiCallback
   * @param {String} error Error message, if any.
   * @param data The data returned by the service call.
   * @param {String} response The complete HTTP response.
   */

  /**
   * Invokes the REST service using the supplied settings and parameters.
   * @param {String} path The base URL to invoke.
   * @param {String} httpMethod The HTTP method to use.
   * @param {Object.<String, String>} pathParams A map of path parameters and their values.
   * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
   * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
   * @param {Object.<String, Object>} formParams A map of form parameters and their values.
   * @param {Object} bodyParam The value to pass as the request body.
   * @param {Array.<String>} authNames An array of authentication type names.
   * @param {Array.<String>} contentTypes An array of request MIME types.
   * @param {Array.<String>} accepts An array of acceptable response MIME types.
   * @param {(String|Array|ObjectFunction)} returnType The required type to return; can be a string for simple types or the
   * constructor for a complex type.
   * @param {module:ApiClient~callApiCallback} callback The callback function.
   * @returns {Object} The SuperAgent request object.
   */
  exports.prototype.callApi = function callApi(path, httpMethod, pathParams,
      queryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts,
      returnType, callback) {

    var _this = this;
    var url = this.buildUrl(path, pathParams);
    var request = superagent(httpMethod, url);

    // apply authentications
    this.applyAuthToRequest(request, authNames);

    // set query parameters
    if (httpMethod.toUpperCase() === 'GET' && this.cache === false) {
        queryParams['_'] = new Date().getTime();
    }
    request.query(this.normalizeParams(queryParams));

    // set header parameters
    request.set(this.defaultHeaders).set(this.normalizeParams(headerParams));

    // set request timeout
    request.timeout(this.timeout);

    var contentType = this.jsonPreferredMime(contentTypes);
    if (contentType) {
      // Issue with superagent and multipart/form-data (https://github.com/visionmedia/superagent/issues/746)
      if(contentType != 'multipart/form-data') {
        request.type(contentType);
      }
    } else if (!request.header['Content-Type']) {
      request.type('application/json');
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      request.send(this.normalizeParams(formParams));
    } else if (contentType == 'multipart/form-data') {
      var _formParams = this.normalizeParams(formParams);
      for (var key in _formParams) {
        if (_formParams.hasOwnProperty(key)) {
          if (this.isFileParam(_formParams[key])) {
            // file field
            request.attach(key, _formParams[key]);
          } else {
            request.field(key, _formParams[key]);
          }
        }
      }
    } else if (bodyParam) {
      request.send(bodyParam);
    }

    var accept = this.jsonPreferredMime(accepts);
    if (accept) {
      request.accept(accept);
    }


    request.end(function(error, response) {
      if (callback) {
        var data = null;
        if (!error) {
          try {
            data = _this.deserialize(response, returnType);
          } catch (err) {
            error = err;
          }
        }
        callback(error, data, response);
      }
    });

    return request;
  };

  /**
   * Parses an ISO-8601 string representation of a date value.
   * @param {String} str The date value as a string.
   * @returns {Date} The parsed date object.
   */
  exports.parseDate = function(str) {
    return new Date(str.replace(/T/i, ' '));
  };

  /**
   * Converts a value to the specified type.
   * @param {(String|Object)} data The data to convert, as a string or object.
   * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
   * all properties on <code>data<code> will be converted to this type.
   * @returns An instance of the specified type.
   */
  exports.convertToType = function(data, type) {
    switch (type) {
      case 'Boolean':
        return Boolean(data);
      case 'Integer':
        return parseInt(data, 10);
      case 'Number':
        return parseFloat(data);
      case 'String':
        return String(data);
      case 'Date':
        return this.parseDate(String(data));
      default:
        if (type === Object) {
          // generic object, return directly
          return data;
        } else if (typeof type === 'function') {
          // for model type like: User
          return type.constructFromObject(data);
        } else if (Array.isArray(type)) {
          // for array type like: ['String']
          var itemType = type[0];
          return data.map(function(item) {
            return exports.convertToType(item, itemType);
          });
        } else if (typeof type === 'object') {
          // for plain object type like: {'String': 'Integer'}
          var keyType, valueType;
          for (var k in type) {
            if (type.hasOwnProperty(k)) {
              keyType = k;
              valueType = type[k];
              break;
            }
          }
          var result = {};
          for (var k in data) {
            if (data.hasOwnProperty(k)) {
              var key = exports.convertToType(k, keyType);
              var value = exports.convertToType(data[k], valueType);
              result[key] = value;
            }
          }
          return result;
        } else {
          // for unknown type, return the data directly
          return data;
        }
    }
  };

  /**
   * Constructs a new map or array model from REST data.
   * @param data {Object|Array} The REST data.
   * @param obj {Object|Array} The target object or array.
   */
  exports.constructFromObject = function(data, obj, itemType) {
    if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        if (data.hasOwnProperty(i))
          obj[i] = exports.convertToType(data[i], itemType);
      }
    } else {
      for (var k in data) {
        if (data.hasOwnProperty(k))
          obj[k] = exports.convertToType(data[k], itemType);
      }
    }
  };

  /**
   * The default API client implementation.
   * @type {module:ApiClient}
   */
  exports.instance = new exports();

  return exports;
}));

}).call(this,require("buffer").Buffer)

},{"buffer":2,"fs":1,"superagent":5}],9:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/AuthenticationString', 'model/InlineResponse2002', 'model/InlineResponse401'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/AuthenticationString'), require('../model/InlineResponse2002'), require('../model/InlineResponse401'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.AuthenticationApi = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.AuthenticationString, root.TheTvdbApiV2.InlineResponse2002, root.TheTvdbApiV2.InlineResponse401);
  }
}(this, function(ApiClient, AuthenticationString, InlineResponse2002, InlineResponse401) {
  'use strict';

  /**
   * Authentication service.
   * @module api/AuthenticationApi
   * @version 2.1.2
   */

  /**
   * Constructs a new AuthenticationApi.
   * @alias module:api/AuthenticationApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the loginPost operation.
     * @callback module:api/AuthenticationApi~loginPostCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2002} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a session token to be included in the rest of the requests. Note that API key authentication is required for all subsequent requests and user auth is required for routes in the &#x60;User&#x60; section
     * @param {module:model/AuthenticationString} authenticationString JSON string containing your authentication details.
     * @param {module:api/AuthenticationApi~loginPostCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2002}
     */
    this.loginPost = function(authenticationString, callback) {
      var postBody = authenticationString;

      // verify the required parameter 'authenticationString' is set
      if (authenticationString == undefined || authenticationString == null) {
        throw new Error("Missing the required parameter 'authenticationString' when calling loginPost");
      }


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = [];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2002;

      return this.apiClient.callApi(
        '/login', 'POST',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the refreshTokenGet operation.
     * @callback module:api/AuthenticationApi~refreshTokenGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2002} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Refreshes your current, valid JWT token and returns a new token. Hit this route so that you do not have to post to &#x60;/login&#x60; with your API key and credentials once you have already been authenticated.
     * @param {module:api/AuthenticationApi~refreshTokenGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2002}
     */
    this.refreshTokenGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2002;

      return this.apiClient.callApi(
        '/refresh_token', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":8,"../model/AuthenticationString":18,"../model/InlineResponse2002":42,"../model/InlineResponse401":57}],10:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse200', 'model/InlineResponse401', 'model/InlineResponse404'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/InlineResponse200'), require('../model/InlineResponse401'), require('../model/InlineResponse404'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.EpisodesApi = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse200, root.TheTvdbApiV2.InlineResponse401, root.TheTvdbApiV2.InlineResponse404);
  }
}(this, function(ApiClient, InlineResponse200, InlineResponse401, InlineResponse404) {
  'use strict';

  /**
   * Episodes service.
   * @module api/EpisodesApi
   * @version 2.1.2
   */

  /**
   * Constructs a new EpisodesApi.
   * @alias module:api/EpisodesApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the episodesIdGet operation.
     * @callback module:api/EpisodesApi~episodesIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse200} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns the full information for a given episode id. __Deprecation Warning:__ The _director_ key will be deprecated in favor of the new _directors_ key in a future release.
     * @param {Number} id ID of the episode
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/EpisodesApi~episodesIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse200}
     */
    this.episodesIdGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling episodesIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse200;

      return this.apiClient.callApi(
        '/episodes/{id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":8,"../model/InlineResponse200":25,"../model/InlineResponse401":57,"../model/InlineResponse404":58}],11:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2001', 'model/InlineResponse2001Data', 'model/InlineResponse401', 'model/InlineResponse404'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/InlineResponse2001'), require('../model/InlineResponse2001Data'), require('../model/InlineResponse401'), require('../model/InlineResponse404'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.LanguagesApi = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2001, root.TheTvdbApiV2.InlineResponse2001Data, root.TheTvdbApiV2.InlineResponse401, root.TheTvdbApiV2.InlineResponse404);
  }
}(this, function(ApiClient, InlineResponse2001, InlineResponse2001Data, InlineResponse401, InlineResponse404) {
  'use strict';

  /**
   * Languages service.
   * @module api/LanguagesApi
   * @version 2.1.2
   */

  /**
   * Constructs a new LanguagesApi.
   * @alias module:api/LanguagesApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the languagesGet operation.
     * @callback module:api/LanguagesApi~languagesGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2001} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * All available languages. These language abbreviations can be used in the &#x60;Accept-Language&#x60; header for routes that return translation records.
     * @param {module:api/LanguagesApi~languagesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2001}
     */
    this.languagesGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2001;

      return this.apiClient.callApi(
        '/languages', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the languagesIdGet operation.
     * @callback module:api/LanguagesApi~languagesIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2001Data} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Information about a particular language, given the language ID.
     * @param {String} id ID of the language
     * @param {module:api/LanguagesApi~languagesIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2001Data}
     */
    this.languagesIdGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling languagesIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2001Data;

      return this.apiClient.callApi(
        '/languages/{id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":8,"../model/InlineResponse2001":26,"../model/InlineResponse2001Data":41,"../model/InlineResponse401":57,"../model/InlineResponse404":58}],12:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2003', 'model/InlineResponse2004', 'model/InlineResponse401', 'model/InlineResponse404'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/InlineResponse2003'), require('../model/InlineResponse2004'), require('../model/InlineResponse401'), require('../model/InlineResponse404'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SearchApi = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2003, root.TheTvdbApiV2.InlineResponse2004, root.TheTvdbApiV2.InlineResponse401, root.TheTvdbApiV2.InlineResponse404);
  }
}(this, function(ApiClient, InlineResponse2003, InlineResponse2004, InlineResponse401, InlineResponse404) {
  'use strict';

  /**
   * Search service.
   * @module api/SearchApi
   * @version 2.1.2
   */

  /**
   * Constructs a new SearchApi.
   * @alias module:api/SearchApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the searchSeriesGet operation.
     * @callback module:api/SearchApi~searchSeriesGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2003} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Allows the user to search for a series based on the following parameters.
     * @param {Object} opts Optional parameters
     * @param {String} opts.name Name of the series to search for.
     * @param {String} opts.imdbId IMDB id of the series
     * @param {String} opts.zap2itId Zap2it ID of the series to search for.
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SearchApi~searchSeriesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2003}
     */
    this.searchSeriesGet = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'name': opts['name'],
        'imdbId': opts['imdbId'],
        'zap2itId': opts['zap2itId']
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2003;

      return this.apiClient.callApi(
        '/search/series', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the searchSeriesParamsGet operation.
     * @callback module:api/SearchApi~searchSeriesParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2004} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns an array of parameters to query by in the &#x60;/search/series&#x60; route.
     * @param {module:api/SearchApi~searchSeriesParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2004}
     */
    this.searchSeriesParamsGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2004;

      return this.apiClient.callApi(
        '/search/series/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":8,"../model/InlineResponse2003":43,"../model/InlineResponse2004":44,"../model/InlineResponse401":57,"../model/InlineResponse404":58}],13:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20010', 'model/InlineResponse20011', 'model/InlineResponse2004', 'model/InlineResponse2005', 'model/InlineResponse2006', 'model/InlineResponse2007', 'model/InlineResponse2008', 'model/InlineResponse2009', 'model/InlineResponse401', 'model/InlineResponse404'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/InlineResponse20010'), require('../model/InlineResponse20011'), require('../model/InlineResponse2004'), require('../model/InlineResponse2005'), require('../model/InlineResponse2006'), require('../model/InlineResponse2007'), require('../model/InlineResponse2008'), require('../model/InlineResponse2009'), require('../model/InlineResponse401'), require('../model/InlineResponse404'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesApi = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20010, root.TheTvdbApiV2.InlineResponse20011, root.TheTvdbApiV2.InlineResponse2004, root.TheTvdbApiV2.InlineResponse2005, root.TheTvdbApiV2.InlineResponse2006, root.TheTvdbApiV2.InlineResponse2007, root.TheTvdbApiV2.InlineResponse2008, root.TheTvdbApiV2.InlineResponse2009, root.TheTvdbApiV2.InlineResponse401, root.TheTvdbApiV2.InlineResponse404);
  }
}(this, function(ApiClient, InlineResponse20010, InlineResponse20011, InlineResponse2004, InlineResponse2005, InlineResponse2006, InlineResponse2007, InlineResponse2008, InlineResponse2009, InlineResponse401, InlineResponse404) {
  'use strict';

  /**
   * Series service.
   * @module api/SeriesApi
   * @version 2.1.2
   */

  /**
   * Constructs a new SeriesApi.
   * @alias module:api/SeriesApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the seriesIdActorsGet operation.
     * @callback module:api/SeriesApi~seriesIdActorsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2006} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns actors for the given series id
     * @param {Number} id ID of the series
     * @param {module:api/SeriesApi~seriesIdActorsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2006}
     */
    this.seriesIdActorsGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdActorsGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2006;

      return this.apiClient.callApi(
        '/series/{id}/actors', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdEpisodesGet operation.
     * @callback module:api/SeriesApi~seriesIdEpisodesGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2007} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * All episodes for a given series. Paginated with 100 results per page.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.page Page of results to fetch. Defaults to page 1 if not provided.
     * @param {module:api/SeriesApi~seriesIdEpisodesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2007}
     */
    this.seriesIdEpisodesGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdEpisodesGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
        'page': opts['page']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2007;

      return this.apiClient.callApi(
        '/series/{id}/episodes', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdEpisodesQueryGet operation.
     * @callback module:api/SeriesApi~seriesIdEpisodesQueryGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2007} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * This route allows the user to query against episodes for the given series. The response is a paginated array of episode records that have been filtered down to basic information.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.absoluteNumber Absolute number of the episode
     * @param {String} opts.airedSeason Aired season number
     * @param {String} opts.airedEpisode Aired episode number
     * @param {String} opts.dvdSeason DVD season number
     * @param {String} opts.dvdEpisode DVD episode number
     * @param {String} opts.imdbId IMDB id of the series
     * @param {String} opts.page Page of results to fetch. Defaults to page 1 if not provided.
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdEpisodesQueryGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2007}
     */
    this.seriesIdEpisodesQueryGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdEpisodesQueryGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
        'absoluteNumber': opts['absoluteNumber'],
        'airedSeason': opts['airedSeason'],
        'airedEpisode': opts['airedEpisode'],
        'dvdSeason': opts['dvdSeason'],
        'dvdEpisode': opts['dvdEpisode'],
        'imdbId': opts['imdbId'],
        'page': opts['page']
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2007;

      return this.apiClient.callApi(
        '/series/{id}/episodes/query', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdEpisodesQueryParamsGet operation.
     * @callback module:api/SeriesApi~seriesIdEpisodesQueryParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2004} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns the allowed query keys for the &#x60;/series/{id}/episodes/query&#x60; route
     * @param {Number} id ID of the series
     * @param {module:api/SeriesApi~seriesIdEpisodesQueryParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2004}
     */
    this.seriesIdEpisodesQueryParamsGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdEpisodesQueryParamsGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2004;

      return this.apiClient.callApi(
        '/series/{id}/episodes/query/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdEpisodesSummaryGet operation.
     * @callback module:api/SeriesApi~seriesIdEpisodesSummaryGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2008} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a summary of the episodes and seasons available for the series.  __Note__: Season \&quot;0\&quot; is for all episodes that are considered to be specials.
     * @param {Number} id ID of the series
     * @param {module:api/SeriesApi~seriesIdEpisodesSummaryGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2008}
     */
    this.seriesIdEpisodesSummaryGet = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdEpisodesSummaryGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2008;

      return this.apiClient.callApi(
        '/series/{id}/episodes/summary', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdFilterGet operation.
     * @callback module:api/SeriesApi~seriesIdFilterGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2005} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a series records, filtered by the supplied comma-separated list of keys. Query keys can be found at the &#x60;/series/{id}/filter/params&#x60; route.
     * @param {Number} id ID of the series
     * @param {String} keys Comma-separated list of keys to filter by
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdFilterGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2005}
     */
    this.seriesIdFilterGet = function(id, keys, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdFilterGet");
      }

      // verify the required parameter 'keys' is set
      if (keys == undefined || keys == null) {
        throw new Error("Missing the required parameter 'keys' when calling seriesIdFilterGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
        'keys': keys
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2005;

      return this.apiClient.callApi(
        '/series/{id}/filter', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdFilterParamsGet operation.
     * @callback module:api/SeriesApi~seriesIdFilterParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2004} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns the list of keys available for the &#x60;/series/{id}/filter&#x60; route
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdFilterParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2004}
     */
    this.seriesIdFilterParamsGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdFilterParamsGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2004;

      return this.apiClient.callApi(
        '/series/{id}/filter/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdGet operation.
     * @callback module:api/SeriesApi~seriesIdGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2005} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a series records that contains all information known about a particular series id.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2005}
     */
    this.seriesIdGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2005;

      return this.apiClient.callApi(
        '/series/{id}', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdHead operation.
     * @callback module:api/SeriesApi~seriesIdHeadCallback
     * @param {String} error Error message, if any.
     * @param data This operation does not return a value.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns header information only about the given series ID.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdHeadCallback} callback The callback function, accepting three arguments: error, data, response
     */
    this.seriesIdHead = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdHead");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = null;

      return this.apiClient.callApi(
        '/series/{id}', 'HEAD',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdImagesGet operation.
     * @callback module:api/SeriesApi~seriesIdImagesGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2009} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a summary of the images for a particular series
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdImagesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2009}
     */
    this.seriesIdImagesGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdImagesGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2009;

      return this.apiClient.callApi(
        '/series/{id}/images', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdImagesQueryGet operation.
     * @callback module:api/SeriesApi~seriesIdImagesQueryGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20010} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Query images for the given series ID.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.keyType Type of image you&#39;re querying for (fanart, poster, etc. See ../images/query/params for more details).
     * @param {String} opts.resolution Resolution to filter by (1280x1024, for example)
     * @param {String} opts.subKey Subkey for the above query keys. See /series/{id}/images/query/params for more information
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdImagesQueryGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20010}
     */
    this.seriesIdImagesQueryGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdImagesQueryGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
        'keyType': opts['keyType'],
        'resolution': opts['resolution'],
        'subKey': opts['subKey']
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20010;

      return this.apiClient.callApi(
        '/series/{id}/images/query', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the seriesIdImagesQueryParamsGet operation.
     * @callback module:api/SeriesApi~seriesIdImagesQueryParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20011} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns the allowed query keys for the &#x60;/series/{id}/images/query&#x60; route. Contains a parameter record for each unique &#x60;keyType&#x60;, listing values that will return results.
     * @param {Number} id ID of the series
     * @param {Object} opts Optional parameters
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/SeriesApi~seriesIdImagesQueryParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20011}
     */
    this.seriesIdImagesQueryParamsGet = function(id, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling seriesIdImagesQueryParamsGet");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20011;

      return this.apiClient.callApi(
        '/series/{id}/images/query/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":8,"../model/InlineResponse20010":27,"../model/InlineResponse20011":30,"../model/InlineResponse2004":44,"../model/InlineResponse2005":45,"../model/InlineResponse2006":47,"../model/InlineResponse2007":49,"../model/InlineResponse2008":52,"../model/InlineResponse2009":53,"../model/InlineResponse401":57,"../model/InlineResponse404":58}],14:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20012', 'model/InlineResponse2004', 'model/InlineResponse401', 'model/InlineResponse404'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/InlineResponse20012'), require('../model/InlineResponse2004'), require('../model/InlineResponse401'), require('../model/InlineResponse404'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UpdatesApi = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20012, root.TheTvdbApiV2.InlineResponse2004, root.TheTvdbApiV2.InlineResponse401, root.TheTvdbApiV2.InlineResponse404);
  }
}(this, function(ApiClient, InlineResponse20012, InlineResponse2004, InlineResponse401, InlineResponse404) {
  'use strict';

  /**
   * Updates service.
   * @module api/UpdatesApi
   * @version 2.1.2
   */

  /**
   * Constructs a new UpdatesApi.
   * @alias module:api/UpdatesApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the updatedQueryGet operation.
     * @callback module:api/UpdatesApi~updatedQueryGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20012} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns an array of series that have changed in a maximum of one week blocks since the provided &#x60;fromTime&#x60;.   The user may specify a &#x60;toTime&#x60; to grab results for less than a week. Any timespan larger than a week will be reduced down to one week automatically.
     * @param {String} fromTime Epoch time to start your date range.
     * @param {Object} opts Optional parameters
     * @param {String} opts.toTime Epoch time to end your date range. Must be one week from &#x60;fromTime&#x60;.
     * @param {String} opts.acceptLanguage Records are returned with the Episode name and Overview in the desired language, if it exists. If there is no translation for the given language, then the record is still returned but with empty values for the translated fields.
     * @param {module:api/UpdatesApi~updatedQueryGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20012}
     */
    this.updatedQueryGet = function(fromTime, opts, callback) {
      opts = opts || {};
      var postBody = null;

      // verify the required parameter 'fromTime' is set
      if (fromTime == undefined || fromTime == null) {
        throw new Error("Missing the required parameter 'fromTime' when calling updatedQueryGet");
      }


      var pathParams = {
      };
      var queryParams = {
        'fromTime': fromTime,
        'toTime': opts['toTime']
      };
      var headerParams = {
        'Accept-Language': opts['acceptLanguage']
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20012;

      return this.apiClient.callApi(
        '/updated/query', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the updatedQueryParamsGet operation.
     * @callback module:api/UpdatesApi~updatedQueryParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2004} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns an array of valid query keys for the &#x60;/updated/query/params&#x60; route.
     * @param {module:api/UpdatesApi~updatedQueryParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2004}
     */
    this.updatedQueryParamsGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2004;

      return this.apiClient.callApi(
        '/updated/query/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":8,"../model/InlineResponse20012":32,"../model/InlineResponse2004":44,"../model/InlineResponse401":57,"../model/InlineResponse404":58}],15:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20013', 'model/InlineResponse20014', 'model/InlineResponse20015', 'model/InlineResponse20016', 'model/InlineResponse2004', 'model/InlineResponse401', 'model/InlineResponse404', 'model/InlineResponse409'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('../model/InlineResponse20013'), require('../model/InlineResponse20014'), require('../model/InlineResponse20015'), require('../model/InlineResponse20016'), require('../model/InlineResponse2004'), require('../model/InlineResponse401'), require('../model/InlineResponse404'), require('../model/InlineResponse409'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UsersApi = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20013, root.TheTvdbApiV2.InlineResponse20014, root.TheTvdbApiV2.InlineResponse20015, root.TheTvdbApiV2.InlineResponse20016, root.TheTvdbApiV2.InlineResponse2004, root.TheTvdbApiV2.InlineResponse401, root.TheTvdbApiV2.InlineResponse404, root.TheTvdbApiV2.InlineResponse409);
  }
}(this, function(ApiClient, InlineResponse20013, InlineResponse20014, InlineResponse20015, InlineResponse20016, InlineResponse2004, InlineResponse401, InlineResponse404, InlineResponse409) {
  'use strict';

  /**
   * Users service.
   * @module api/UsersApi
   * @version 2.1.2
   */

  /**
   * Constructs a new UsersApi.
   * @alias module:api/UsersApi
   * @class
   * @param {module:ApiClient} apiClient Optional API client implementation to use,
   * default to {@link module:ApiClient#instance} if unspecified.
   */
  var exports = function(apiClient) {
    this.apiClient = apiClient || ApiClient.instance;


    /**
     * Callback function to receive the result of the userFavoritesGet operation.
     * @callback module:api/UsersApi~userFavoritesGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20014} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns an array of favorite series for a given user, will be a blank array if no favorites exist.
     * @param {module:api/UsersApi~userFavoritesGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20014}
     */
    this.userFavoritesGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20014;

      return this.apiClient.callApi(
        '/user/favorites', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the userFavoritesIdDelete operation.
     * @callback module:api/UsersApi~userFavoritesIdDeleteCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20014} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Deletes the given series ID from the user’s favorite’s list and returns the updated list.
     * @param {Number} id ID of the series
     * @param {module:api/UsersApi~userFavoritesIdDeleteCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20014}
     */
    this.userFavoritesIdDelete = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling userFavoritesIdDelete");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20014;

      return this.apiClient.callApi(
        '/user/favorites/{id}', 'DELETE',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the userFavoritesIdPut operation.
     * @callback module:api/UsersApi~userFavoritesIdPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20014} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Adds the supplied series ID to the user’s favorite’s list and returns the updated list.
     * @param {Number} id ID of the series
     * @param {module:api/UsersApi~userFavoritesIdPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20014}
     */
    this.userFavoritesIdPut = function(id, callback) {
      var postBody = null;

      // verify the required parameter 'id' is set
      if (id == undefined || id == null) {
        throw new Error("Missing the required parameter 'id' when calling userFavoritesIdPut");
      }


      var pathParams = {
        'id': id
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20014;

      return this.apiClient.callApi(
        '/user/favorites/{id}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the userGet operation.
     * @callback module:api/UsersApi~userGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20013} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns basic information about the currently authenticated user.
     * @param {module:api/UsersApi~userGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20013}
     */
    this.userGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20013;

      return this.apiClient.callApi(
        '/user', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the userRatingsGet operation.
     * @callback module:api/UsersApi~userRatingsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20015} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns an array of ratings for the given user.
     * @param {module:api/UsersApi~userRatingsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20015}
     */
    this.userRatingsGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20015;

      return this.apiClient.callApi(
        '/user/ratings', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the userRatingsItemTypeItemIdItemRatingPut operation.
     * @callback module:api/UsersApi~userRatingsItemTypeItemIdItemRatingPutCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20016} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * This route updates a given rating of a given type.
     * @param {String} itemType Item to update. Can be either &#39;series&#39;, &#39;episode&#39;, or &#39;image&#39;
     * @param {Number} itemId ID of the ratings record that you wish to modify
     * @param {Number} itemRating The updated rating number
     * @param {module:api/UsersApi~userRatingsItemTypeItemIdItemRatingPutCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20016}
     */
    this.userRatingsItemTypeItemIdItemRatingPut = function(itemType, itemId, itemRating, callback) {
      var postBody = null;

      // verify the required parameter 'itemType' is set
      if (itemType == undefined || itemType == null) {
        throw new Error("Missing the required parameter 'itemType' when calling userRatingsItemTypeItemIdItemRatingPut");
      }

      // verify the required parameter 'itemId' is set
      if (itemId == undefined || itemId == null) {
        throw new Error("Missing the required parameter 'itemId' when calling userRatingsItemTypeItemIdItemRatingPut");
      }

      // verify the required parameter 'itemRating' is set
      if (itemRating == undefined || itemRating == null) {
        throw new Error("Missing the required parameter 'itemRating' when calling userRatingsItemTypeItemIdItemRatingPut");
      }


      var pathParams = {
        'itemType': itemType,
        'itemId': itemId,
        'itemRating': itemRating
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20016;

      return this.apiClient.callApi(
        '/user/ratings/{itemType}/{itemId}/{itemRating}', 'PUT',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the userRatingsQueryGet operation.
     * @callback module:api/UsersApi~userRatingsQueryGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse20015} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns an array of ratings for a given user that match the query.
     * @param {Object} opts Optional parameters
     * @param {String} opts.itemType Item to query. Can be either &#39;series&#39;, &#39;episode&#39;, or &#39;banner&#39;
     * @param {module:api/UsersApi~userRatingsQueryGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse20015}
     */
    this.userRatingsQueryGet = function(opts, callback) {
      opts = opts || {};
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
        'itemType': opts['itemType']
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse20015;

      return this.apiClient.callApi(
        '/user/ratings/query', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }

    /**
     * Callback function to receive the result of the userRatingsQueryParamsGet operation.
     * @callback module:api/UsersApi~userRatingsQueryParamsGetCallback
     * @param {String} error Error message, if any.
     * @param {module:model/InlineResponse2004} data The data returned by the service call.
     * @param {String} response The complete HTTP response.
     */

    /**
     * Returns a list of query params for use in the &#x60;/user/ratings/query&#x60; route.
     * @param {module:api/UsersApi~userRatingsQueryParamsGetCallback} callback The callback function, accepting three arguments: error, data, response
     * data is of type: {@link module:model/InlineResponse2004}
     */
    this.userRatingsQueryParamsGet = function(callback) {
      var postBody = null;


      var pathParams = {
      };
      var queryParams = {
      };
      var headerParams = {
      };
      var formParams = {
      };

      var authNames = ['jwtToken'];
      var contentTypes = ['application/json'];
      var accepts = ['application/json'];
      var returnType = InlineResponse2004;

      return this.apiClient.callApi(
        '/user/ratings/query/params', 'GET',
        pathParams, queryParams, headerParams, formParams, postBody,
        authNames, contentTypes, accepts, returnType, callback
      );
    }
  };

  return exports;
}));

},{"../ApiClient":8,"../model/InlineResponse20013":34,"../model/InlineResponse20014":36,"../model/InlineResponse20015":38,"../model/InlineResponse20016":40,"../model/InlineResponse2004":44,"../model/InlineResponse401":57,"../model/InlineResponse404":58,"../model/InlineResponse409":59}],16:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Auth', 'model/AuthenticationString', 'model/BasicEpisode', 'model/Conflict', 'model/Episode', 'model/EpisodeDataQueryParams', 'model/EpisodeRecordData', 'model/FilterKeys', 'model/InlineResponse200', 'model/InlineResponse2001', 'model/InlineResponse20010', 'model/InlineResponse20010Data', 'model/InlineResponse20010RatingsInfo', 'model/InlineResponse20011', 'model/InlineResponse20011Data', 'model/InlineResponse20012', 'model/InlineResponse20012Data', 'model/InlineResponse20013', 'model/InlineResponse20013Data', 'model/InlineResponse20014', 'model/InlineResponse20014Data', 'model/InlineResponse20015', 'model/InlineResponse20015Data', 'model/InlineResponse20016', 'model/InlineResponse2001Data', 'model/InlineResponse2002', 'model/InlineResponse2003', 'model/InlineResponse2004', 'model/InlineResponse2005', 'model/InlineResponse2005Data', 'model/InlineResponse2006', 'model/InlineResponse2006Data', 'model/InlineResponse2007', 'model/InlineResponse2007Data', 'model/InlineResponse2007Links', 'model/InlineResponse2008', 'model/InlineResponse2009', 'model/InlineResponse2009Data', 'model/InlineResponse200Data', 'model/InlineResponse200Errors', 'model/InlineResponse401', 'model/InlineResponse404', 'model/InlineResponse409', 'model/JSONErrors', 'model/Language', 'model/LanguageData', 'model/Links', 'model/NotAuthorized', 'model/NotFound', 'model/Series', 'model/SeriesActors', 'model/SeriesActorsData', 'model/SeriesData', 'model/SeriesEpisodes', 'model/SeriesEpisodesQuery', 'model/SeriesEpisodesQueryParams', 'model/SeriesEpisodesSummary', 'model/SeriesImageQueryResult', 'model/SeriesImageQueryResults', 'model/SeriesImagesCount', 'model/SeriesImagesCounts', 'model/SeriesImagesQueryParam', 'model/SeriesImagesQueryParams', 'model/SeriesSearchData', 'model/Token', 'model/Update', 'model/UpdateData', 'model/UpdateDataQueryParams', 'model/User', 'model/UserData', 'model/UserFavorites', 'model/UserFavoritesData', 'model/UserRatings', 'model/UserRatingsData', 'model/UserRatingsDataNoLinks', 'model/UserRatingsQueryParams', 'api/AuthenticationApi', 'api/EpisodesApi', 'api/LanguagesApi', 'api/SearchApi', 'api/SeriesApi', 'api/UpdatesApi', 'api/UsersApi'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('./ApiClient'), require('./model/Auth'), require('./model/AuthenticationString'), require('./model/BasicEpisode'), require('./model/Conflict'), require('./model/Episode'), require('./model/EpisodeDataQueryParams'), require('./model/EpisodeRecordData'), require('./model/FilterKeys'), require('./model/InlineResponse200'), require('./model/InlineResponse2001'), require('./model/InlineResponse20010'), require('./model/InlineResponse20010Data'), require('./model/InlineResponse20010RatingsInfo'), require('./model/InlineResponse20011'), require('./model/InlineResponse20011Data'), require('./model/InlineResponse20012'), require('./model/InlineResponse20012Data'), require('./model/InlineResponse20013'), require('./model/InlineResponse20013Data'), require('./model/InlineResponse20014'), require('./model/InlineResponse20014Data'), require('./model/InlineResponse20015'), require('./model/InlineResponse20015Data'), require('./model/InlineResponse20016'), require('./model/InlineResponse2001Data'), require('./model/InlineResponse2002'), require('./model/InlineResponse2003'), require('./model/InlineResponse2004'), require('./model/InlineResponse2005'), require('./model/InlineResponse2005Data'), require('./model/InlineResponse2006'), require('./model/InlineResponse2006Data'), require('./model/InlineResponse2007'), require('./model/InlineResponse2007Data'), require('./model/InlineResponse2007Links'), require('./model/InlineResponse2008'), require('./model/InlineResponse2009'), require('./model/InlineResponse2009Data'), require('./model/InlineResponse200Data'), require('./model/InlineResponse200Errors'), require('./model/InlineResponse401'), require('./model/InlineResponse404'), require('./model/InlineResponse409'), require('./model/JSONErrors'), require('./model/Language'), require('./model/LanguageData'), require('./model/Links'), require('./model/NotAuthorized'), require('./model/NotFound'), require('./model/Series'), require('./model/SeriesActors'), require('./model/SeriesActorsData'), require('./model/SeriesData'), require('./model/SeriesEpisodes'), require('./model/SeriesEpisodesQuery'), require('./model/SeriesEpisodesQueryParams'), require('./model/SeriesEpisodesSummary'), require('./model/SeriesImageQueryResult'), require('./model/SeriesImageQueryResults'), require('./model/SeriesImagesCount'), require('./model/SeriesImagesCounts'), require('./model/SeriesImagesQueryParam'), require('./model/SeriesImagesQueryParams'), require('./model/SeriesSearchData'), require('./model/Token'), require('./model/Update'), require('./model/UpdateData'), require('./model/UpdateDataQueryParams'), require('./model/User'), require('./model/UserData'), require('./model/UserFavorites'), require('./model/UserFavoritesData'), require('./model/UserRatings'), require('./model/UserRatingsData'), require('./model/UserRatingsDataNoLinks'), require('./model/UserRatingsQueryParams'), require('./api/AuthenticationApi'), require('./api/EpisodesApi'), require('./api/LanguagesApi'), require('./api/SearchApi'), require('./api/SeriesApi'), require('./api/UpdatesApi'), require('./api/UsersApi'));
  }
}(function(ApiClient, Auth, AuthenticationString, BasicEpisode, Conflict, Episode, EpisodeDataQueryParams, EpisodeRecordData, FilterKeys, InlineResponse200, InlineResponse2001, InlineResponse20010, InlineResponse20010Data, InlineResponse20010RatingsInfo, InlineResponse20011, InlineResponse20011Data, InlineResponse20012, InlineResponse20012Data, InlineResponse20013, InlineResponse20013Data, InlineResponse20014, InlineResponse20014Data, InlineResponse20015, InlineResponse20015Data, InlineResponse20016, InlineResponse2001Data, InlineResponse2002, InlineResponse2003, InlineResponse2004, InlineResponse2005, InlineResponse2005Data, InlineResponse2006, InlineResponse2006Data, InlineResponse2007, InlineResponse2007Data, InlineResponse2007Links, InlineResponse2008, InlineResponse2009, InlineResponse2009Data, InlineResponse200Data, InlineResponse200Errors, InlineResponse401, InlineResponse404, InlineResponse409, JSONErrors, Language, LanguageData, Links, NotAuthorized, NotFound, Series, SeriesActors, SeriesActorsData, SeriesData, SeriesEpisodes, SeriesEpisodesQuery, SeriesEpisodesQueryParams, SeriesEpisodesSummary, SeriesImageQueryResult, SeriesImageQueryResults, SeriesImagesCount, SeriesImagesCounts, SeriesImagesQueryParam, SeriesImagesQueryParams, SeriesSearchData, Token, Update, UpdateData, UpdateDataQueryParams, User, UserData, UserFavorites, UserFavoritesData, UserRatings, UserRatingsData, UserRatingsDataNoLinks, UserRatingsQueryParams, AuthenticationApi, EpisodesApi, LanguagesApi, SearchApi, SeriesApi, UpdatesApi, UsersApi) {
  'use strict';

  /**
   * API_v2_targets_v1_functionality_with_a_few_minor_additions__The_API_is_accessible_via_httpsapi_thetvdb_com_and_provides_the_following_REST_endpoints_in_JSON_format_How_to_use_this_API_documentation________________You_may_browse_the_API_routes_without_authentication_but_if_you_wish_to_send_requests_to_the_API_and_see_response_data_then_you_must_authenticate_1__Obtain_a_JWT_token_by_POSTing__to_the_login_route_in_the_Authentication_section_with_your_API_key_and_credentials_1__Paste_the_JWT_token_from_the_response_into_the_JWT_Token_field_at_the_top_of_the_page_and_click_the_Add_Token_button_You_will_now_be_able_to_use_the_remaining_routes_to_send_requests_to_the_API_and_get_a_response_Language_Selection________________Language_selection_is_done_via_the_Accept_Language_header__At_the_moment_you_may_only_pass_one_language_abbreviation_in_the_header_at_a_time__Valid_language_abbreviations_can_be_found_at_the_languages_route__Authentication________________Authentication_to_use_the_API_is_similar_to_the_How_to_section_above__Users_must_POST_to_the_login_route_with_their_API_key_and_credentials_in_the_following_format_in_order_to_obtain_a_JWT_token_apikeyAPIKEYusernameUSERNAMEuserkeyUSERKEYNote_that_the_username_and_key_are_ONLY_required_for_the_user_routes__The_users_key_is_labled_Account_Identifier_in_the_account_section_of_the_main_site_The_token_is_then_used_in_all_subsequent_requests_by_providing_it_in_the_Authorization_header__The_header_will_look_like_Authorization_Bearer_yourJWTtoken__Currently_the_token_expires_after_24_hours__You_can_GET_the_refresh_token_route_to_extend_that_expiration_date_Versioning________________You_may_request_a_different_version_of_the_API_by_including_an_Accept_header_in_your_request_with_the_following_format_Acceptapplicationvnd_thetvdb_vVERSION__This_documentation_automatically_uses_the_version_seen_at_the_top_and_bottom_of_the_page_.<br>
   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
   * <p>
   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
   * <pre>
   * var TheTvdbApiV2 = require('index'); // See note below*.
   * var xxxSvc = new TheTvdbApiV2.XxxApi(); // Allocate the API class we're going to use.
   * var yyyModel = new TheTvdbApiV2.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * <em>*NOTE: For a top-level AMD script, use require(['index'], function(){...})
   * and put the application logic within the callback function.</em>
   * </p>
   * <p>
   * A non-AMD browser application (discouraged) might do something like this:
   * <pre>
   * var xxxSvc = new TheTvdbApiV2.XxxApi(); // Allocate the API class we're going to use.
   * var yyy = new TheTvdbApiV2.Yyy(); // Construct a model instance.
   * yyyModel.someProperty = 'someValue';
   * ...
   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
   * ...
   * </pre>
   * </p>
   * @module index
   * @version 2.1.2
   */
  var exports = {
    /**
     * The ApiClient constructor.
     * @property {module:ApiClient}
     */
    ApiClient: ApiClient,
    /**
     * The Auth model constructor.
     * @property {module:model/Auth}
     */
    Auth: Auth,
    /**
     * The AuthenticationString model constructor.
     * @property {module:model/AuthenticationString}
     */
    AuthenticationString: AuthenticationString,
    /**
     * The BasicEpisode model constructor.
     * @property {module:model/BasicEpisode}
     */
    BasicEpisode: BasicEpisode,
    /**
     * The Conflict model constructor.
     * @property {module:model/Conflict}
     */
    Conflict: Conflict,
    /**
     * The Episode model constructor.
     * @property {module:model/Episode}
     */
    Episode: Episode,
    /**
     * The EpisodeDataQueryParams model constructor.
     * @property {module:model/EpisodeDataQueryParams}
     */
    EpisodeDataQueryParams: EpisodeDataQueryParams,
    /**
     * The EpisodeRecordData model constructor.
     * @property {module:model/EpisodeRecordData}
     */
    EpisodeRecordData: EpisodeRecordData,
    /**
     * The FilterKeys model constructor.
     * @property {module:model/FilterKeys}
     */
    FilterKeys: FilterKeys,
    /**
     * The InlineResponse200 model constructor.
     * @property {module:model/InlineResponse200}
     */
    InlineResponse200: InlineResponse200,
    /**
     * The InlineResponse2001 model constructor.
     * @property {module:model/InlineResponse2001}
     */
    InlineResponse2001: InlineResponse2001,
    /**
     * The InlineResponse20010 model constructor.
     * @property {module:model/InlineResponse20010}
     */
    InlineResponse20010: InlineResponse20010,
    /**
     * The InlineResponse20010Data model constructor.
     * @property {module:model/InlineResponse20010Data}
     */
    InlineResponse20010Data: InlineResponse20010Data,
    /**
     * The InlineResponse20010RatingsInfo model constructor.
     * @property {module:model/InlineResponse20010RatingsInfo}
     */
    InlineResponse20010RatingsInfo: InlineResponse20010RatingsInfo,
    /**
     * The InlineResponse20011 model constructor.
     * @property {module:model/InlineResponse20011}
     */
    InlineResponse20011: InlineResponse20011,
    /**
     * The InlineResponse20011Data model constructor.
     * @property {module:model/InlineResponse20011Data}
     */
    InlineResponse20011Data: InlineResponse20011Data,
    /**
     * The InlineResponse20012 model constructor.
     * @property {module:model/InlineResponse20012}
     */
    InlineResponse20012: InlineResponse20012,
    /**
     * The InlineResponse20012Data model constructor.
     * @property {module:model/InlineResponse20012Data}
     */
    InlineResponse20012Data: InlineResponse20012Data,
    /**
     * The InlineResponse20013 model constructor.
     * @property {module:model/InlineResponse20013}
     */
    InlineResponse20013: InlineResponse20013,
    /**
     * The InlineResponse20013Data model constructor.
     * @property {module:model/InlineResponse20013Data}
     */
    InlineResponse20013Data: InlineResponse20013Data,
    /**
     * The InlineResponse20014 model constructor.
     * @property {module:model/InlineResponse20014}
     */
    InlineResponse20014: InlineResponse20014,
    /**
     * The InlineResponse20014Data model constructor.
     * @property {module:model/InlineResponse20014Data}
     */
    InlineResponse20014Data: InlineResponse20014Data,
    /**
     * The InlineResponse20015 model constructor.
     * @property {module:model/InlineResponse20015}
     */
    InlineResponse20015: InlineResponse20015,
    /**
     * The InlineResponse20015Data model constructor.
     * @property {module:model/InlineResponse20015Data}
     */
    InlineResponse20015Data: InlineResponse20015Data,
    /**
     * The InlineResponse20016 model constructor.
     * @property {module:model/InlineResponse20016}
     */
    InlineResponse20016: InlineResponse20016,
    /**
     * The InlineResponse2001Data model constructor.
     * @property {module:model/InlineResponse2001Data}
     */
    InlineResponse2001Data: InlineResponse2001Data,
    /**
     * The InlineResponse2002 model constructor.
     * @property {module:model/InlineResponse2002}
     */
    InlineResponse2002: InlineResponse2002,
    /**
     * The InlineResponse2003 model constructor.
     * @property {module:model/InlineResponse2003}
     */
    InlineResponse2003: InlineResponse2003,
    /**
     * The InlineResponse2004 model constructor.
     * @property {module:model/InlineResponse2004}
     */
    InlineResponse2004: InlineResponse2004,
    /**
     * The InlineResponse2005 model constructor.
     * @property {module:model/InlineResponse2005}
     */
    InlineResponse2005: InlineResponse2005,
    /**
     * The InlineResponse2005Data model constructor.
     * @property {module:model/InlineResponse2005Data}
     */
    InlineResponse2005Data: InlineResponse2005Data,
    /**
     * The InlineResponse2006 model constructor.
     * @property {module:model/InlineResponse2006}
     */
    InlineResponse2006: InlineResponse2006,
    /**
     * The InlineResponse2006Data model constructor.
     * @property {module:model/InlineResponse2006Data}
     */
    InlineResponse2006Data: InlineResponse2006Data,
    /**
     * The InlineResponse2007 model constructor.
     * @property {module:model/InlineResponse2007}
     */
    InlineResponse2007: InlineResponse2007,
    /**
     * The InlineResponse2007Data model constructor.
     * @property {module:model/InlineResponse2007Data}
     */
    InlineResponse2007Data: InlineResponse2007Data,
    /**
     * The InlineResponse2007Links model constructor.
     * @property {module:model/InlineResponse2007Links}
     */
    InlineResponse2007Links: InlineResponse2007Links,
    /**
     * The InlineResponse2008 model constructor.
     * @property {module:model/InlineResponse2008}
     */
    InlineResponse2008: InlineResponse2008,
    /**
     * The InlineResponse2009 model constructor.
     * @property {module:model/InlineResponse2009}
     */
    InlineResponse2009: InlineResponse2009,
    /**
     * The InlineResponse2009Data model constructor.
     * @property {module:model/InlineResponse2009Data}
     */
    InlineResponse2009Data: InlineResponse2009Data,
    /**
     * The InlineResponse200Data model constructor.
     * @property {module:model/InlineResponse200Data}
     */
    InlineResponse200Data: InlineResponse200Data,
    /**
     * The InlineResponse200Errors model constructor.
     * @property {module:model/InlineResponse200Errors}
     */
    InlineResponse200Errors: InlineResponse200Errors,
    /**
     * The InlineResponse401 model constructor.
     * @property {module:model/InlineResponse401}
     */
    InlineResponse401: InlineResponse401,
    /**
     * The InlineResponse404 model constructor.
     * @property {module:model/InlineResponse404}
     */
    InlineResponse404: InlineResponse404,
    /**
     * The InlineResponse409 model constructor.
     * @property {module:model/InlineResponse409}
     */
    InlineResponse409: InlineResponse409,
    /**
     * The JSONErrors model constructor.
     * @property {module:model/JSONErrors}
     */
    JSONErrors: JSONErrors,
    /**
     * The Language model constructor.
     * @property {module:model/Language}
     */
    Language: Language,
    /**
     * The LanguageData model constructor.
     * @property {module:model/LanguageData}
     */
    LanguageData: LanguageData,
    /**
     * The Links model constructor.
     * @property {module:model/Links}
     */
    Links: Links,
    /**
     * The NotAuthorized model constructor.
     * @property {module:model/NotAuthorized}
     */
    NotAuthorized: NotAuthorized,
    /**
     * The NotFound model constructor.
     * @property {module:model/NotFound}
     */
    NotFound: NotFound,
    /**
     * The Series model constructor.
     * @property {module:model/Series}
     */
    Series: Series,
    /**
     * The SeriesActors model constructor.
     * @property {module:model/SeriesActors}
     */
    SeriesActors: SeriesActors,
    /**
     * The SeriesActorsData model constructor.
     * @property {module:model/SeriesActorsData}
     */
    SeriesActorsData: SeriesActorsData,
    /**
     * The SeriesData model constructor.
     * @property {module:model/SeriesData}
     */
    SeriesData: SeriesData,
    /**
     * The SeriesEpisodes model constructor.
     * @property {module:model/SeriesEpisodes}
     */
    SeriesEpisodes: SeriesEpisodes,
    /**
     * The SeriesEpisodesQuery model constructor.
     * @property {module:model/SeriesEpisodesQuery}
     */
    SeriesEpisodesQuery: SeriesEpisodesQuery,
    /**
     * The SeriesEpisodesQueryParams model constructor.
     * @property {module:model/SeriesEpisodesQueryParams}
     */
    SeriesEpisodesQueryParams: SeriesEpisodesQueryParams,
    /**
     * The SeriesEpisodesSummary model constructor.
     * @property {module:model/SeriesEpisodesSummary}
     */
    SeriesEpisodesSummary: SeriesEpisodesSummary,
    /**
     * The SeriesImageQueryResult model constructor.
     * @property {module:model/SeriesImageQueryResult}
     */
    SeriesImageQueryResult: SeriesImageQueryResult,
    /**
     * The SeriesImageQueryResults model constructor.
     * @property {module:model/SeriesImageQueryResults}
     */
    SeriesImageQueryResults: SeriesImageQueryResults,
    /**
     * The SeriesImagesCount model constructor.
     * @property {module:model/SeriesImagesCount}
     */
    SeriesImagesCount: SeriesImagesCount,
    /**
     * The SeriesImagesCounts model constructor.
     * @property {module:model/SeriesImagesCounts}
     */
    SeriesImagesCounts: SeriesImagesCounts,
    /**
     * The SeriesImagesQueryParam model constructor.
     * @property {module:model/SeriesImagesQueryParam}
     */
    SeriesImagesQueryParam: SeriesImagesQueryParam,
    /**
     * The SeriesImagesQueryParams model constructor.
     * @property {module:model/SeriesImagesQueryParams}
     */
    SeriesImagesQueryParams: SeriesImagesQueryParams,
    /**
     * The SeriesSearchData model constructor.
     * @property {module:model/SeriesSearchData}
     */
    SeriesSearchData: SeriesSearchData,
    /**
     * The Token model constructor.
     * @property {module:model/Token}
     */
    Token: Token,
    /**
     * The Update model constructor.
     * @property {module:model/Update}
     */
    Update: Update,
    /**
     * The UpdateData model constructor.
     * @property {module:model/UpdateData}
     */
    UpdateData: UpdateData,
    /**
     * The UpdateDataQueryParams model constructor.
     * @property {module:model/UpdateDataQueryParams}
     */
    UpdateDataQueryParams: UpdateDataQueryParams,
    /**
     * The User model constructor.
     * @property {module:model/User}
     */
    User: User,
    /**
     * The UserData model constructor.
     * @property {module:model/UserData}
     */
    UserData: UserData,
    /**
     * The UserFavorites model constructor.
     * @property {module:model/UserFavorites}
     */
    UserFavorites: UserFavorites,
    /**
     * The UserFavoritesData model constructor.
     * @property {module:model/UserFavoritesData}
     */
    UserFavoritesData: UserFavoritesData,
    /**
     * The UserRatings model constructor.
     * @property {module:model/UserRatings}
     */
    UserRatings: UserRatings,
    /**
     * The UserRatingsData model constructor.
     * @property {module:model/UserRatingsData}
     */
    UserRatingsData: UserRatingsData,
    /**
     * The UserRatingsDataNoLinks model constructor.
     * @property {module:model/UserRatingsDataNoLinks}
     */
    UserRatingsDataNoLinks: UserRatingsDataNoLinks,
    /**
     * The UserRatingsQueryParams model constructor.
     * @property {module:model/UserRatingsQueryParams}
     */
    UserRatingsQueryParams: UserRatingsQueryParams,
    /**
     * The AuthenticationApi service constructor.
     * @property {module:api/AuthenticationApi}
     */
    AuthenticationApi: AuthenticationApi,
    /**
     * The EpisodesApi service constructor.
     * @property {module:api/EpisodesApi}
     */
    EpisodesApi: EpisodesApi,
    /**
     * The LanguagesApi service constructor.
     * @property {module:api/LanguagesApi}
     */
    LanguagesApi: LanguagesApi,
    /**
     * The SearchApi service constructor.
     * @property {module:api/SearchApi}
     */
    SearchApi: SearchApi,
    /**
     * The SeriesApi service constructor.
     * @property {module:api/SeriesApi}
     */
    SeriesApi: SeriesApi,
    /**
     * The UpdatesApi service constructor.
     * @property {module:api/UpdatesApi}
     */
    UpdatesApi: UpdatesApi,
    /**
     * The UsersApi service constructor.
     * @property {module:api/UsersApi}
     */
    UsersApi: UsersApi
  };

  return exports;
}));

},{"./ApiClient":8,"./api/AuthenticationApi":9,"./api/EpisodesApi":10,"./api/LanguagesApi":11,"./api/SearchApi":12,"./api/SeriesApi":13,"./api/UpdatesApi":14,"./api/UsersApi":15,"./model/Auth":17,"./model/AuthenticationString":18,"./model/BasicEpisode":19,"./model/Conflict":20,"./model/Episode":21,"./model/EpisodeDataQueryParams":22,"./model/EpisodeRecordData":23,"./model/FilterKeys":24,"./model/InlineResponse200":25,"./model/InlineResponse2001":26,"./model/InlineResponse20010":27,"./model/InlineResponse20010Data":28,"./model/InlineResponse20010RatingsInfo":29,"./model/InlineResponse20011":30,"./model/InlineResponse20011Data":31,"./model/InlineResponse20012":32,"./model/InlineResponse20012Data":33,"./model/InlineResponse20013":34,"./model/InlineResponse20013Data":35,"./model/InlineResponse20014":36,"./model/InlineResponse20014Data":37,"./model/InlineResponse20015":38,"./model/InlineResponse20015Data":39,"./model/InlineResponse20016":40,"./model/InlineResponse2001Data":41,"./model/InlineResponse2002":42,"./model/InlineResponse2003":43,"./model/InlineResponse2004":44,"./model/InlineResponse2005":45,"./model/InlineResponse2005Data":46,"./model/InlineResponse2006":47,"./model/InlineResponse2006Data":48,"./model/InlineResponse2007":49,"./model/InlineResponse2007Data":50,"./model/InlineResponse2007Links":51,"./model/InlineResponse2008":52,"./model/InlineResponse2009":53,"./model/InlineResponse2009Data":54,"./model/InlineResponse200Data":55,"./model/InlineResponse200Errors":56,"./model/InlineResponse401":57,"./model/InlineResponse404":58,"./model/InlineResponse409":59,"./model/JSONErrors":60,"./model/Language":61,"./model/LanguageData":62,"./model/Links":63,"./model/NotAuthorized":64,"./model/NotFound":65,"./model/Series":66,"./model/SeriesActors":67,"./model/SeriesActorsData":68,"./model/SeriesData":69,"./model/SeriesEpisodes":70,"./model/SeriesEpisodesQuery":71,"./model/SeriesEpisodesQueryParams":72,"./model/SeriesEpisodesSummary":73,"./model/SeriesImageQueryResult":74,"./model/SeriesImageQueryResults":75,"./model/SeriesImagesCount":76,"./model/SeriesImagesCounts":77,"./model/SeriesImagesQueryParam":78,"./model/SeriesImagesQueryParams":79,"./model/SeriesSearchData":80,"./model/Token":81,"./model/Update":82,"./model/UpdateData":83,"./model/UpdateDataQueryParams":84,"./model/User":85,"./model/UserData":86,"./model/UserFavorites":87,"./model/UserFavoritesData":88,"./model/UserRatings":89,"./model/UserRatingsData":90,"./model/UserRatingsDataNoLinks":91,"./model/UserRatingsQueryParams":92}],17:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.Auth = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Auth model module.
   * @module model/Auth
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>Auth</code>.
   * @alias module:model/Auth
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>Auth</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Auth} obj Optional instance to populate.
   * @return {module:model/Auth} The populated <code>Auth</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('apikey')) {
        obj['apikey'] = ApiClient.convertToType(data['apikey'], 'String');
      }
      if (data.hasOwnProperty('userkey')) {
        obj['userkey'] = ApiClient.convertToType(data['userkey'], 'String');
      }
      if (data.hasOwnProperty('username')) {
        obj['username'] = ApiClient.convertToType(data['username'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} apikey
   */
  exports.prototype['apikey'] = undefined;
  /**
   * @member {String} userkey
   */
  exports.prototype['userkey'] = undefined;
  /**
   * @member {String} username
   */
  exports.prototype['username'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],18:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.AuthenticationString = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The AuthenticationString model module.
   * @module model/AuthenticationString
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>AuthenticationString</code>.
   * @alias module:model/AuthenticationString
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>AuthenticationString</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/AuthenticationString} obj Optional instance to populate.
   * @return {module:model/AuthenticationString} The populated <code>AuthenticationString</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('apikey')) {
        obj['apikey'] = ApiClient.convertToType(data['apikey'], 'String');
      }
      if (data.hasOwnProperty('userkey')) {
        obj['userkey'] = ApiClient.convertToType(data['userkey'], 'String');
      }
      if (data.hasOwnProperty('username')) {
        obj['username'] = ApiClient.convertToType(data['username'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} apikey
   */
  exports.prototype['apikey'] = undefined;
  /**
   * @member {String} userkey
   */
  exports.prototype['userkey'] = undefined;
  /**
   * @member {String} username
   */
  exports.prototype['username'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],19:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.BasicEpisode = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The BasicEpisode model module.
   * @module model/BasicEpisode
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>BasicEpisode</code>.
   * @alias module:model/BasicEpisode
   * @class
   */
  var exports = function() {
    var _this = this;











  };

  /**
   * Constructs a <code>BasicEpisode</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/BasicEpisode} obj Optional instance to populate.
   * @return {module:model/BasicEpisode} The populated <code>BasicEpisode</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('absoluteNumber')) {
        obj['absoluteNumber'] = ApiClient.convertToType(data['absoluteNumber'], 'Number');
      }
      if (data.hasOwnProperty('airedEpisodeNumber')) {
        obj['airedEpisodeNumber'] = ApiClient.convertToType(data['airedEpisodeNumber'], 'Number');
      }
      if (data.hasOwnProperty('airedSeason')) {
        obj['airedSeason'] = ApiClient.convertToType(data['airedSeason'], 'Number');
      }
      if (data.hasOwnProperty('dvdEpisodeNumber')) {
        obj['dvdEpisodeNumber'] = ApiClient.convertToType(data['dvdEpisodeNumber'], 'Number');
      }
      if (data.hasOwnProperty('dvdSeason')) {
        obj['dvdSeason'] = ApiClient.convertToType(data['dvdSeason'], 'Number');
      }
      if (data.hasOwnProperty('episodeName')) {
        obj['episodeName'] = ApiClient.convertToType(data['episodeName'], 'String');
      }
      if (data.hasOwnProperty('firstAired')) {
        obj['firstAired'] = ApiClient.convertToType(data['firstAired'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'Number');
      }
      if (data.hasOwnProperty('overview')) {
        obj['overview'] = ApiClient.convertToType(data['overview'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {Number} absoluteNumber
   */
  exports.prototype['absoluteNumber'] = undefined;
  /**
   * @member {Number} airedEpisodeNumber
   */
  exports.prototype['airedEpisodeNumber'] = undefined;
  /**
   * @member {Number} airedSeason
   */
  exports.prototype['airedSeason'] = undefined;
  /**
   * @member {Number} dvdEpisodeNumber
   */
  exports.prototype['dvdEpisodeNumber'] = undefined;
  /**
   * @member {Number} dvdSeason
   */
  exports.prototype['dvdSeason'] = undefined;
  /**
   * @member {String} episodeName
   */
  exports.prototype['episodeName'] = undefined;
  /**
   * @member {String} firstAired
   */
  exports.prototype['firstAired'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {Number} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;
  /**
   * @member {String} overview
   */
  exports.prototype['overview'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],20:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.Conflict = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Conflict model module.
   * @module model/Conflict
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>Conflict</code>.
   * @alias module:model/Conflict
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>Conflict</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Conflict} obj Optional instance to populate.
   * @return {module:model/Conflict} The populated <code>Conflict</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Error')) {
        obj['Error'] = ApiClient.convertToType(data['Error'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} Error
   * @default 'Conflict'
   */
  exports.prototype['Error'] = 'Conflict';



  return exports;
}));



},{"../ApiClient":8}],21:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.Episode = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Episode model module.
   * @module model/Episode
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>Episode</code>.
   * @alias module:model/Episode
   * @class
   */
  var exports = function() {
    var _this = this;
































  };

  /**
   * Constructs a <code>Episode</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Episode} obj Optional instance to populate.
   * @return {module:model/Episode} The populated <code>Episode</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('absoluteNumber')) {
        obj['absoluteNumber'] = ApiClient.convertToType(data['absoluteNumber'], 'Number');
      }
      if (data.hasOwnProperty('airedEpisodeNumber')) {
        obj['airedEpisodeNumber'] = ApiClient.convertToType(data['airedEpisodeNumber'], 'Number');
      }
      if (data.hasOwnProperty('airedSeason')) {
        obj['airedSeason'] = ApiClient.convertToType(data['airedSeason'], 'Number');
      }
      if (data.hasOwnProperty('airsAfterSeason')) {
        obj['airsAfterSeason'] = ApiClient.convertToType(data['airsAfterSeason'], 'Number');
      }
      if (data.hasOwnProperty('airsBeforeEpisode')) {
        obj['airsBeforeEpisode'] = ApiClient.convertToType(data['airsBeforeEpisode'], 'Number');
      }
      if (data.hasOwnProperty('airsBeforeSeason')) {
        obj['airsBeforeSeason'] = ApiClient.convertToType(data['airsBeforeSeason'], 'Number');
      }
      if (data.hasOwnProperty('director')) {
        obj['director'] = ApiClient.convertToType(data['director'], 'String');
      }
      if (data.hasOwnProperty('directors')) {
        obj['directors'] = ApiClient.convertToType(data['directors'], ['String']);
      }
      if (data.hasOwnProperty('dvdChapter')) {
        obj['dvdChapter'] = ApiClient.convertToType(data['dvdChapter'], 'Number');
      }
      if (data.hasOwnProperty('dvdDiscid')) {
        obj['dvdDiscid'] = ApiClient.convertToType(data['dvdDiscid'], 'String');
      }
      if (data.hasOwnProperty('dvdEpisodeNumber')) {
        obj['dvdEpisodeNumber'] = ApiClient.convertToType(data['dvdEpisodeNumber'], 'Number');
      }
      if (data.hasOwnProperty('dvdSeason')) {
        obj['dvdSeason'] = ApiClient.convertToType(data['dvdSeason'], 'Number');
      }
      if (data.hasOwnProperty('episodeName')) {
        obj['episodeName'] = ApiClient.convertToType(data['episodeName'], 'String');
      }
      if (data.hasOwnProperty('filename')) {
        obj['filename'] = ApiClient.convertToType(data['filename'], 'String');
      }
      if (data.hasOwnProperty('firstAired')) {
        obj['firstAired'] = ApiClient.convertToType(data['firstAired'], 'String');
      }
      if (data.hasOwnProperty('guestStars')) {
        obj['guestStars'] = ApiClient.convertToType(data['guestStars'], ['String']);
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('imdbId')) {
        obj['imdbId'] = ApiClient.convertToType(data['imdbId'], 'String');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'Number');
      }
      if (data.hasOwnProperty('lastUpdatedBy')) {
        obj['lastUpdatedBy'] = ApiClient.convertToType(data['lastUpdatedBy'], 'String');
      }
      if (data.hasOwnProperty('overview')) {
        obj['overview'] = ApiClient.convertToType(data['overview'], 'String');
      }
      if (data.hasOwnProperty('productionCode')) {
        obj['productionCode'] = ApiClient.convertToType(data['productionCode'], 'String');
      }
      if (data.hasOwnProperty('seriesId')) {
        obj['seriesId'] = ApiClient.convertToType(data['seriesId'], 'String');
      }
      if (data.hasOwnProperty('showUrl')) {
        obj['showUrl'] = ApiClient.convertToType(data['showUrl'], 'String');
      }
      if (data.hasOwnProperty('siteRating')) {
        obj['siteRating'] = ApiClient.convertToType(data['siteRating'], 'Number');
      }
      if (data.hasOwnProperty('siteRatingCount')) {
        obj['siteRatingCount'] = ApiClient.convertToType(data['siteRatingCount'], 'Number');
      }
      if (data.hasOwnProperty('thumbAdded')) {
        obj['thumbAdded'] = ApiClient.convertToType(data['thumbAdded'], 'String');
      }
      if (data.hasOwnProperty('thumbAuthor')) {
        obj['thumbAuthor'] = ApiClient.convertToType(data['thumbAuthor'], 'Number');
      }
      if (data.hasOwnProperty('thumbHeight')) {
        obj['thumbHeight'] = ApiClient.convertToType(data['thumbHeight'], 'String');
      }
      if (data.hasOwnProperty('thumbWidth')) {
        obj['thumbWidth'] = ApiClient.convertToType(data['thumbWidth'], 'String');
      }
      if (data.hasOwnProperty('writers')) {
        obj['writers'] = ApiClient.convertToType(data['writers'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Number} absoluteNumber
   */
  exports.prototype['absoluteNumber'] = undefined;
  /**
   * @member {Number} airedEpisodeNumber
   */
  exports.prototype['airedEpisodeNumber'] = undefined;
  /**
   * @member {Number} airedSeason
   */
  exports.prototype['airedSeason'] = undefined;
  /**
   * @member {Number} airsAfterSeason
   */
  exports.prototype['airsAfterSeason'] = undefined;
  /**
   * @member {Number} airsBeforeEpisode
   */
  exports.prototype['airsBeforeEpisode'] = undefined;
  /**
   * @member {Number} airsBeforeSeason
   */
  exports.prototype['airsBeforeSeason'] = undefined;
  /**
   * @member {String} director
   */
  exports.prototype['director'] = undefined;
  /**
   * @member {Array.<String>} directors
   */
  exports.prototype['directors'] = undefined;
  /**
   * @member {Number} dvdChapter
   */
  exports.prototype['dvdChapter'] = undefined;
  /**
   * @member {String} dvdDiscid
   */
  exports.prototype['dvdDiscid'] = undefined;
  /**
   * @member {Number} dvdEpisodeNumber
   */
  exports.prototype['dvdEpisodeNumber'] = undefined;
  /**
   * @member {Number} dvdSeason
   */
  exports.prototype['dvdSeason'] = undefined;
  /**
   * @member {String} episodeName
   */
  exports.prototype['episodeName'] = undefined;
  /**
   * @member {String} filename
   */
  exports.prototype['filename'] = undefined;
  /**
   * @member {String} firstAired
   */
  exports.prototype['firstAired'] = undefined;
  /**
   * @member {Array.<String>} guestStars
   */
  exports.prototype['guestStars'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} imdbId
   */
  exports.prototype['imdbId'] = undefined;
  /**
   * @member {Number} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;
  /**
   * @member {String} lastUpdatedBy
   */
  exports.prototype['lastUpdatedBy'] = undefined;
  /**
   * @member {String} overview
   */
  exports.prototype['overview'] = undefined;
  /**
   * @member {String} productionCode
   */
  exports.prototype['productionCode'] = undefined;
  /**
   * @member {String} seriesId
   */
  exports.prototype['seriesId'] = undefined;
  /**
   * @member {String} showUrl
   */
  exports.prototype['showUrl'] = undefined;
  /**
   * @member {Number} siteRating
   */
  exports.prototype['siteRating'] = undefined;
  /**
   * @member {Number} siteRatingCount
   */
  exports.prototype['siteRatingCount'] = undefined;
  /**
   * @member {String} thumbAdded
   */
  exports.prototype['thumbAdded'] = undefined;
  /**
   * @member {Number} thumbAuthor
   */
  exports.prototype['thumbAuthor'] = undefined;
  /**
   * @member {String} thumbHeight
   */
  exports.prototype['thumbHeight'] = undefined;
  /**
   * @member {String} thumbWidth
   */
  exports.prototype['thumbWidth'] = undefined;
  /**
   * @member {Array.<String>} writers
   */
  exports.prototype['writers'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],22:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.EpisodeDataQueryParams = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The EpisodeDataQueryParams model module.
   * @module model/EpisodeDataQueryParams
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>EpisodeDataQueryParams</code>.
   * @alias module:model/EpisodeDataQueryParams
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>EpisodeDataQueryParams</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/EpisodeDataQueryParams} obj Optional instance to populate.
   * @return {module:model/EpisodeDataQueryParams} The populated <code>EpisodeDataQueryParams</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],23:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse200Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse200Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.EpisodeRecordData = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse200Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse200Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The EpisodeRecordData model module.
   * @module model/EpisodeRecordData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>EpisodeRecordData</code>.
   * @alias module:model/EpisodeRecordData
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>EpisodeRecordData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/EpisodeRecordData} obj Optional instance to populate.
   * @return {module:model/EpisodeRecordData} The populated <code>EpisodeRecordData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse200Data.constructFromObject(data['data']);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse200Data} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse200Data":55,"./InlineResponse200Errors":56}],24:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.FilterKeys = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The FilterKeys model module.
   * @module model/FilterKeys
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>FilterKeys</code>.
   * @alias module:model/FilterKeys
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>FilterKeys</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/FilterKeys} obj Optional instance to populate.
   * @return {module:model/FilterKeys} The populated <code>FilterKeys</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],25:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse200Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse200Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse200 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse200Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse200Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The InlineResponse200 model module.
   * @module model/InlineResponse200
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse200</code>.
   * @alias module:model/InlineResponse200
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InlineResponse200</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse200} obj Optional instance to populate.
   * @return {module:model/InlineResponse200} The populated <code>InlineResponse200</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse200Data.constructFromObject(data['data']);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse200Data} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse200Data":55,"./InlineResponse200Errors":56}],26:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2001Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2001Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2001 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2001Data);
  }
}(this, function(ApiClient, InlineResponse2001Data) {
  'use strict';




  /**
   * The InlineResponse2001 model module.
   * @module model/InlineResponse2001
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2001</code>.
   * @alias module:model/InlineResponse2001
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse2001</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2001} obj Optional instance to populate.
   * @return {module:model/InlineResponse2001} The populated <code>InlineResponse2001</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse2001Data]);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse2001Data>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2001Data":41}],27:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20010Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20010Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20010 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20010Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse20010Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The InlineResponse20010 model module.
   * @module model/InlineResponse20010
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20010</code>.
   * @alias module:model/InlineResponse20010
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InlineResponse20010</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20010} obj Optional instance to populate.
   * @return {module:model/InlineResponse20010} The populated <code>InlineResponse20010</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20010Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20010Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20010Data":28,"./InlineResponse200Errors":56}],28:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20010RatingsInfo'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20010RatingsInfo'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20010Data = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20010RatingsInfo);
  }
}(this, function(ApiClient, InlineResponse20010RatingsInfo) {
  'use strict';




  /**
   * The InlineResponse20010Data model module.
   * @module model/InlineResponse20010Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20010Data</code>.
   * @alias module:model/InlineResponse20010Data
   * @class
   */
  var exports = function() {
    var _this = this;









  };

  /**
   * Constructs a <code>InlineResponse20010Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20010Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse20010Data} The populated <code>InlineResponse20010Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('fileName')) {
        obj['fileName'] = ApiClient.convertToType(data['fileName'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('keyType')) {
        obj['keyType'] = ApiClient.convertToType(data['keyType'], 'String');
      }
      if (data.hasOwnProperty('languageId')) {
        obj['languageId'] = ApiClient.convertToType(data['languageId'], 'Number');
      }
      if (data.hasOwnProperty('ratingsInfo')) {
        obj['ratingsInfo'] = InlineResponse20010RatingsInfo.constructFromObject(data['ratingsInfo']);
      }
      if (data.hasOwnProperty('resolution')) {
        obj['resolution'] = ApiClient.convertToType(data['resolution'], 'String');
      }
      if (data.hasOwnProperty('subKey')) {
        obj['subKey'] = ApiClient.convertToType(data['subKey'], 'String');
      }
      if (data.hasOwnProperty('thumbnail')) {
        obj['thumbnail'] = ApiClient.convertToType(data['thumbnail'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} fileName
   */
  exports.prototype['fileName'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} keyType
   */
  exports.prototype['keyType'] = undefined;
  /**
   * @member {Number} languageId
   */
  exports.prototype['languageId'] = undefined;
  /**
   * @member {module:model/InlineResponse20010RatingsInfo} ratingsInfo
   */
  exports.prototype['ratingsInfo'] = undefined;
  /**
   * @member {String} resolution
   */
  exports.prototype['resolution'] = undefined;
  /**
   * @member {String} subKey
   */
  exports.prototype['subKey'] = undefined;
  /**
   * @member {String} thumbnail
   */
  exports.prototype['thumbnail'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20010RatingsInfo":29}],29:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20010RatingsInfo = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse20010RatingsInfo model module.
   * @module model/InlineResponse20010RatingsInfo
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20010RatingsInfo</code>.
   * @alias module:model/InlineResponse20010RatingsInfo
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InlineResponse20010RatingsInfo</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20010RatingsInfo} obj Optional instance to populate.
   * @return {module:model/InlineResponse20010RatingsInfo} The populated <code>InlineResponse20010RatingsInfo</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('average')) {
        obj['average'] = ApiClient.convertToType(data['average'], 'Number');
      }
      if (data.hasOwnProperty('count')) {
        obj['count'] = ApiClient.convertToType(data['count'], 'Number');
      }
    }
    return obj;
  }

  /**
   * Average rating for the given record.
   * @member {Number} average
   */
  exports.prototype['average'] = undefined;
  /**
   * Number of ratings for the given record.
   * @member {Number} count
   */
  exports.prototype['count'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],30:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20011Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20011Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20011 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20011Data);
  }
}(this, function(ApiClient, InlineResponse20011Data) {
  'use strict';




  /**
   * The InlineResponse20011 model module.
   * @module model/InlineResponse20011
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20011</code>.
   * @alias module:model/InlineResponse20011
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse20011</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20011} obj Optional instance to populate.
   * @return {module:model/InlineResponse20011} The populated <code>InlineResponse20011</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20011Data]);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20011Data>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20011Data":31}],31:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20011Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse20011Data model module.
   * @module model/InlineResponse20011Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20011Data</code>.
   * @alias module:model/InlineResponse20011Data
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>InlineResponse20011Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20011Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse20011Data} The populated <code>InlineResponse20011Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('keyType')) {
        obj['keyType'] = ApiClient.convertToType(data['keyType'], 'String');
      }
      if (data.hasOwnProperty('languageId')) {
        obj['languageId'] = ApiClient.convertToType(data['languageId'], 'String');
      }
      if (data.hasOwnProperty('resolution')) {
        obj['resolution'] = ApiClient.convertToType(data['resolution'], ['String']);
      }
      if (data.hasOwnProperty('subKey')) {
        obj['subKey'] = ApiClient.convertToType(data['subKey'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {String} keyType
   */
  exports.prototype['keyType'] = undefined;
  /**
   * @member {String} languageId
   */
  exports.prototype['languageId'] = undefined;
  /**
   * @member {Array.<String>} resolution
   */
  exports.prototype['resolution'] = undefined;
  /**
   * @member {Array.<String>} subKey
   */
  exports.prototype['subKey'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],32:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20012Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20012Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20012 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20012Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse20012Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The InlineResponse20012 model module.
   * @module model/InlineResponse20012
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20012</code>.
   * @alias module:model/InlineResponse20012
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InlineResponse20012</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20012} obj Optional instance to populate.
   * @return {module:model/InlineResponse20012} The populated <code>InlineResponse20012</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20012Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20012Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20012Data":33,"./InlineResponse200Errors":56}],33:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20012Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse20012Data model module.
   * @module model/InlineResponse20012Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20012Data</code>.
   * @alias module:model/InlineResponse20012Data
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InlineResponse20012Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20012Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse20012Data} The populated <code>InlineResponse20012Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {Number} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],34:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20013Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20013Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20013 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20013Data);
  }
}(this, function(ApiClient, InlineResponse20013Data) {
  'use strict';




  /**
   * The InlineResponse20013 model module.
   * @module model/InlineResponse20013
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20013</code>.
   * @alias module:model/InlineResponse20013
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse20013</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20013} obj Optional instance to populate.
   * @return {module:model/InlineResponse20013} The populated <code>InlineResponse20013</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse20013Data.constructFromObject(data['data']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse20013Data} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20013Data":35}],35:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20013Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse20013Data model module.
   * @module model/InlineResponse20013Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20013Data</code>.
   * @alias module:model/InlineResponse20013Data
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>InlineResponse20013Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20013Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse20013Data} The populated <code>InlineResponse20013Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('favoritesDisplaymode')) {
        obj['favoritesDisplaymode'] = ApiClient.convertToType(data['favoritesDisplaymode'], 'String');
      }
      if (data.hasOwnProperty('language')) {
        obj['language'] = ApiClient.convertToType(data['language'], 'String');
      }
      if (data.hasOwnProperty('userName')) {
        obj['userName'] = ApiClient.convertToType(data['userName'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} favoritesDisplaymode
   */
  exports.prototype['favoritesDisplaymode'] = undefined;
  /**
   * @member {String} language
   */
  exports.prototype['language'] = undefined;
  /**
   * @member {String} userName
   */
  exports.prototype['userName'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],36:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20014Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20014Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20014 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20014Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse20014Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The InlineResponse20014 model module.
   * @module model/InlineResponse20014
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20014</code>.
   * @alias module:model/InlineResponse20014
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InlineResponse20014</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20014} obj Optional instance to populate.
   * @return {module:model/InlineResponse20014} The populated <code>InlineResponse20014</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse20014Data.constructFromObject(data['data']);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse20014Data} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20014Data":37,"./InlineResponse200Errors":56}],37:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20014Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse20014Data model module.
   * @module model/InlineResponse20014Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20014Data</code>.
   * @alias module:model/InlineResponse20014Data
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse20014Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20014Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse20014Data} The populated <code>InlineResponse20014Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('favorites')) {
        obj['favorites'] = ApiClient.convertToType(data['favorites'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} favorites
   */
  exports.prototype['favorites'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],38:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20015Data', 'model/InlineResponse2007Links', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20015Data'), require('./InlineResponse2007Links'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20015 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20015Data, root.TheTvdbApiV2.InlineResponse2007Links, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse20015Data, InlineResponse2007Links, InlineResponse200Errors) {
  'use strict';




  /**
   * The InlineResponse20015 model module.
   * @module model/InlineResponse20015
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20015</code>.
   * @alias module:model/InlineResponse20015
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>InlineResponse20015</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20015} obj Optional instance to populate.
   * @return {module:model/InlineResponse20015} The populated <code>InlineResponse20015</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20015Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
      if (data.hasOwnProperty('links')) {
        obj['links'] = InlineResponse2007Links.constructFromObject(data['links']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20015Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;
  /**
   * @member {module:model/InlineResponse2007Links} links
   */
  exports.prototype['links'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20015Data":39,"./InlineResponse2007Links":51,"./InlineResponse200Errors":56}],39:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20015Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse20015Data model module.
   * @module model/InlineResponse20015Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20015Data</code>.
   * @alias module:model/InlineResponse20015Data
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>InlineResponse20015Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20015Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse20015Data} The populated <code>InlineResponse20015Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('rating')) {
        obj['rating'] = ApiClient.convertToType(data['rating'], 'Number');
      }
      if (data.hasOwnProperty('ratingItemId')) {
        obj['ratingItemId'] = ApiClient.convertToType(data['ratingItemId'], 'Number');
      }
      if (data.hasOwnProperty('ratingType')) {
        obj['ratingType'] = ApiClient.convertToType(data['ratingType'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {Number} rating
   */
  exports.prototype['rating'] = undefined;
  /**
   * @member {Number} ratingItemId
   */
  exports.prototype['ratingItemId'] = undefined;
  /**
   * @member {String} ratingType
   */
  exports.prototype['ratingType'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],40:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20015Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20015Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse20016 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20015Data);
  }
}(this, function(ApiClient, InlineResponse20015Data) {
  'use strict';




  /**
   * The InlineResponse20016 model module.
   * @module model/InlineResponse20016
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse20016</code>.
   * @alias module:model/InlineResponse20016
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse20016</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse20016} obj Optional instance to populate.
   * @return {module:model/InlineResponse20016} The populated <code>InlineResponse20016</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20015Data]);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20015Data>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20015Data":39}],41:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2001Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2001Data model module.
   * @module model/InlineResponse2001Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2001Data</code>.
   * @alias module:model/InlineResponse2001Data
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>InlineResponse2001Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2001Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse2001Data} The populated <code>InlineResponse2001Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('abbreviation')) {
        obj['abbreviation'] = ApiClient.convertToType(data['abbreviation'], 'String');
      }
      if (data.hasOwnProperty('englishName')) {
        obj['englishName'] = ApiClient.convertToType(data['englishName'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} abbreviation
   */
  exports.prototype['abbreviation'] = undefined;
  /**
   * @member {String} englishName
   */
  exports.prototype['englishName'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],42:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2002 = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2002 model module.
   * @module model/InlineResponse2002
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2002</code>.
   * @alias module:model/InlineResponse2002
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse2002</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2002} obj Optional instance to populate.
   * @return {module:model/InlineResponse2002} The populated <code>InlineResponse2002</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('token')) {
        obj['token'] = ApiClient.convertToType(data['token'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} token
   */
  exports.prototype['token'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],43:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2003 = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2003 model module.
   * @module model/InlineResponse2003
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2003</code>.
   * @alias module:model/InlineResponse2003
   * @class
   */
  var exports = function() {
    var _this = this;









  };

  /**
   * Constructs a <code>InlineResponse2003</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2003} obj Optional instance to populate.
   * @return {module:model/InlineResponse2003} The populated <code>InlineResponse2003</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('aliases')) {
        obj['aliases'] = ApiClient.convertToType(data['aliases'], ['String']);
      }
      if (data.hasOwnProperty('banner')) {
        obj['banner'] = ApiClient.convertToType(data['banner'], 'String');
      }
      if (data.hasOwnProperty('firstAired')) {
        obj['firstAired'] = ApiClient.convertToType(data['firstAired'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('network')) {
        obj['network'] = ApiClient.convertToType(data['network'], 'String');
      }
      if (data.hasOwnProperty('overview')) {
        obj['overview'] = ApiClient.convertToType(data['overview'], 'String');
      }
      if (data.hasOwnProperty('seriesName')) {
        obj['seriesName'] = ApiClient.convertToType(data['seriesName'], 'String');
      }
      if (data.hasOwnProperty('status')) {
        obj['status'] = ApiClient.convertToType(data['status'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} aliases
   */
  exports.prototype['aliases'] = undefined;
  /**
   * @member {String} banner
   */
  exports.prototype['banner'] = undefined;
  /**
   * @member {String} firstAired
   */
  exports.prototype['firstAired'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} network
   */
  exports.prototype['network'] = undefined;
  /**
   * @member {String} overview
   */
  exports.prototype['overview'] = undefined;
  /**
   * @member {String} seriesName
   */
  exports.prototype['seriesName'] = undefined;
  /**
   * @member {String} status
   */
  exports.prototype['status'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],44:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2004 = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2004 model module.
   * @module model/InlineResponse2004
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2004</code>.
   * @alias module:model/InlineResponse2004
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse2004</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2004} obj Optional instance to populate.
   * @return {module:model/InlineResponse2004} The populated <code>InlineResponse2004</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],45:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2005Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2005Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2005 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2005Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse2005Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The InlineResponse2005 model module.
   * @module model/InlineResponse2005
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2005</code>.
   * @alias module:model/InlineResponse2005
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InlineResponse2005</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2005} obj Optional instance to populate.
   * @return {module:model/InlineResponse2005} The populated <code>InlineResponse2005</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse2005Data.constructFromObject(data['data']);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse2005Data} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2005Data":46,"./InlineResponse200Errors":56}],46:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2005Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2005Data model module.
   * @module model/InlineResponse2005Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2005Data</code>.
   * @alias module:model/InlineResponse2005Data
   * @class
   */
  var exports = function() {
    var _this = this;






















  };

  /**
   * Constructs a <code>InlineResponse2005Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2005Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse2005Data} The populated <code>InlineResponse2005Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('added')) {
        obj['added'] = ApiClient.convertToType(data['added'], 'String');
      }
      if (data.hasOwnProperty('airsDayOfWeek')) {
        obj['airsDayOfWeek'] = ApiClient.convertToType(data['airsDayOfWeek'], 'String');
      }
      if (data.hasOwnProperty('airsTime')) {
        obj['airsTime'] = ApiClient.convertToType(data['airsTime'], 'String');
      }
      if (data.hasOwnProperty('aliases')) {
        obj['aliases'] = ApiClient.convertToType(data['aliases'], ['String']);
      }
      if (data.hasOwnProperty('banner')) {
        obj['banner'] = ApiClient.convertToType(data['banner'], 'String');
      }
      if (data.hasOwnProperty('firstAired')) {
        obj['firstAired'] = ApiClient.convertToType(data['firstAired'], 'String');
      }
      if (data.hasOwnProperty('genre')) {
        obj['genre'] = ApiClient.convertToType(data['genre'], ['String']);
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('imdbId')) {
        obj['imdbId'] = ApiClient.convertToType(data['imdbId'], 'String');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'Number');
      }
      if (data.hasOwnProperty('network')) {
        obj['network'] = ApiClient.convertToType(data['network'], 'String');
      }
      if (data.hasOwnProperty('networkId')) {
        obj['networkId'] = ApiClient.convertToType(data['networkId'], 'String');
      }
      if (data.hasOwnProperty('overview')) {
        obj['overview'] = ApiClient.convertToType(data['overview'], 'String');
      }
      if (data.hasOwnProperty('rating')) {
        obj['rating'] = ApiClient.convertToType(data['rating'], 'String');
      }
      if (data.hasOwnProperty('runtime')) {
        obj['runtime'] = ApiClient.convertToType(data['runtime'], 'String');
      }
      if (data.hasOwnProperty('seriesId')) {
        obj['seriesId'] = ApiClient.convertToType(data['seriesId'], 'Number');
      }
      if (data.hasOwnProperty('seriesName')) {
        obj['seriesName'] = ApiClient.convertToType(data['seriesName'], 'String');
      }
      if (data.hasOwnProperty('siteRating')) {
        obj['siteRating'] = ApiClient.convertToType(data['siteRating'], 'Number');
      }
      if (data.hasOwnProperty('siteRatingCount')) {
        obj['siteRatingCount'] = ApiClient.convertToType(data['siteRatingCount'], 'Number');
      }
      if (data.hasOwnProperty('status')) {
        obj['status'] = ApiClient.convertToType(data['status'], 'String');
      }
      if (data.hasOwnProperty('zap2itId')) {
        obj['zap2itId'] = ApiClient.convertToType(data['zap2itId'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} added
   */
  exports.prototype['added'] = undefined;
  /**
   * @member {String} airsDayOfWeek
   */
  exports.prototype['airsDayOfWeek'] = undefined;
  /**
   * @member {String} airsTime
   */
  exports.prototype['airsTime'] = undefined;
  /**
   * @member {Array.<String>} aliases
   */
  exports.prototype['aliases'] = undefined;
  /**
   * @member {String} banner
   */
  exports.prototype['banner'] = undefined;
  /**
   * @member {String} firstAired
   */
  exports.prototype['firstAired'] = undefined;
  /**
   * @member {Array.<String>} genre
   */
  exports.prototype['genre'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} imdbId
   */
  exports.prototype['imdbId'] = undefined;
  /**
   * @member {Number} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;
  /**
   * @member {String} network
   */
  exports.prototype['network'] = undefined;
  /**
   * @member {String} networkId
   */
  exports.prototype['networkId'] = undefined;
  /**
   * @member {String} overview
   */
  exports.prototype['overview'] = undefined;
  /**
   * @member {String} rating
   */
  exports.prototype['rating'] = undefined;
  /**
   * @member {String} runtime
   */
  exports.prototype['runtime'] = undefined;
  /**
   * @member {Number} seriesId
   */
  exports.prototype['seriesId'] = undefined;
  /**
   * @member {String} seriesName
   */
  exports.prototype['seriesName'] = undefined;
  /**
   * @member {Number} siteRating
   */
  exports.prototype['siteRating'] = undefined;
  /**
   * @member {Number} siteRatingCount
   */
  exports.prototype['siteRatingCount'] = undefined;
  /**
   * @member {String} status
   */
  exports.prototype['status'] = undefined;
  /**
   * @member {String} zap2itId
   */
  exports.prototype['zap2itId'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],47:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2006Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2006Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2006 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2006Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse2006Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The InlineResponse2006 model module.
   * @module model/InlineResponse2006
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2006</code>.
   * @alias module:model/InlineResponse2006
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>InlineResponse2006</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2006} obj Optional instance to populate.
   * @return {module:model/InlineResponse2006} The populated <code>InlineResponse2006</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse2006Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse2006Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2006Data":48,"./InlineResponse200Errors":56}],48:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2006Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2006Data model module.
   * @module model/InlineResponse2006Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2006Data</code>.
   * @alias module:model/InlineResponse2006Data
   * @class
   */
  var exports = function() {
    var _this = this;










  };

  /**
   * Constructs a <code>InlineResponse2006Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2006Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse2006Data} The populated <code>InlineResponse2006Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('image')) {
        obj['image'] = ApiClient.convertToType(data['image'], 'String');
      }
      if (data.hasOwnProperty('imageAdded')) {
        obj['imageAdded'] = ApiClient.convertToType(data['imageAdded'], 'String');
      }
      if (data.hasOwnProperty('imageAuthor')) {
        obj['imageAuthor'] = ApiClient.convertToType(data['imageAuthor'], 'Number');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'String');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('role')) {
        obj['role'] = ApiClient.convertToType(data['role'], 'String');
      }
      if (data.hasOwnProperty('seriesId')) {
        obj['seriesId'] = ApiClient.convertToType(data['seriesId'], 'Number');
      }
      if (data.hasOwnProperty('sortOrder')) {
        obj['sortOrder'] = ApiClient.convertToType(data['sortOrder'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} image
   */
  exports.prototype['image'] = undefined;
  /**
   * @member {String} imageAdded
   */
  exports.prototype['imageAdded'] = undefined;
  /**
   * @member {Number} imageAuthor
   */
  exports.prototype['imageAuthor'] = undefined;
  /**
   * @member {String} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {String} role
   */
  exports.prototype['role'] = undefined;
  /**
   * @member {Number} seriesId
   */
  exports.prototype['seriesId'] = undefined;
  /**
   * @member {Number} sortOrder
   */
  exports.prototype['sortOrder'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],49:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2007Data', 'model/InlineResponse2007Links', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2007Data'), require('./InlineResponse2007Links'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2007 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2007Data, root.TheTvdbApiV2.InlineResponse2007Links, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse2007Data, InlineResponse2007Links, InlineResponse200Errors) {
  'use strict';




  /**
   * The InlineResponse2007 model module.
   * @module model/InlineResponse2007
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2007</code>.
   * @alias module:model/InlineResponse2007
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>InlineResponse2007</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2007} obj Optional instance to populate.
   * @return {module:model/InlineResponse2007} The populated <code>InlineResponse2007</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse2007Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
      if (data.hasOwnProperty('links')) {
        obj['links'] = InlineResponse2007Links.constructFromObject(data['links']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse2007Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;
  /**
   * @member {module:model/InlineResponse2007Links} links
   */
  exports.prototype['links'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2007Data":50,"./InlineResponse2007Links":51,"./InlineResponse200Errors":56}],50:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2007Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2007Data model module.
   * @module model/InlineResponse2007Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2007Data</code>.
   * @alias module:model/InlineResponse2007Data
   * @class
   */
  var exports = function() {
    var _this = this;











  };

  /**
   * Constructs a <code>InlineResponse2007Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2007Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse2007Data} The populated <code>InlineResponse2007Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('absoluteNumber')) {
        obj['absoluteNumber'] = ApiClient.convertToType(data['absoluteNumber'], 'Number');
      }
      if (data.hasOwnProperty('airedEpisodeNumber')) {
        obj['airedEpisodeNumber'] = ApiClient.convertToType(data['airedEpisodeNumber'], 'Number');
      }
      if (data.hasOwnProperty('airedSeason')) {
        obj['airedSeason'] = ApiClient.convertToType(data['airedSeason'], 'Number');
      }
      if (data.hasOwnProperty('dvdEpisodeNumber')) {
        obj['dvdEpisodeNumber'] = ApiClient.convertToType(data['dvdEpisodeNumber'], 'Number');
      }
      if (data.hasOwnProperty('dvdSeason')) {
        obj['dvdSeason'] = ApiClient.convertToType(data['dvdSeason'], 'Number');
      }
      if (data.hasOwnProperty('episodeName')) {
        obj['episodeName'] = ApiClient.convertToType(data['episodeName'], 'String');
      }
      if (data.hasOwnProperty('firstAired')) {
        obj['firstAired'] = ApiClient.convertToType(data['firstAired'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'Number');
      }
      if (data.hasOwnProperty('overview')) {
        obj['overview'] = ApiClient.convertToType(data['overview'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {Number} absoluteNumber
   */
  exports.prototype['absoluteNumber'] = undefined;
  /**
   * @member {Number} airedEpisodeNumber
   */
  exports.prototype['airedEpisodeNumber'] = undefined;
  /**
   * @member {Number} airedSeason
   */
  exports.prototype['airedSeason'] = undefined;
  /**
   * @member {Number} dvdEpisodeNumber
   */
  exports.prototype['dvdEpisodeNumber'] = undefined;
  /**
   * @member {Number} dvdSeason
   */
  exports.prototype['dvdSeason'] = undefined;
  /**
   * @member {String} episodeName
   */
  exports.prototype['episodeName'] = undefined;
  /**
   * @member {String} firstAired
   */
  exports.prototype['firstAired'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {Number} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;
  /**
   * @member {String} overview
   */
  exports.prototype['overview'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],51:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2007Links = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2007Links model module.
   * @module model/InlineResponse2007Links
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2007Links</code>.
   * @alias module:model/InlineResponse2007Links
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>InlineResponse2007Links</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2007Links} obj Optional instance to populate.
   * @return {module:model/InlineResponse2007Links} The populated <code>InlineResponse2007Links</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('first')) {
        obj['first'] = ApiClient.convertToType(data['first'], 'Number');
      }
      if (data.hasOwnProperty('last')) {
        obj['last'] = ApiClient.convertToType(data['last'], 'Number');
      }
      if (data.hasOwnProperty('next')) {
        obj['next'] = ApiClient.convertToType(data['next'], 'Number');
      }
      if (data.hasOwnProperty('previous')) {
        obj['previous'] = ApiClient.convertToType(data['previous'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} first
   */
  exports.prototype['first'] = undefined;
  /**
   * @member {Number} last
   */
  exports.prototype['last'] = undefined;
  /**
   * @member {Number} next
   */
  exports.prototype['next'] = undefined;
  /**
   * @member {Number} previous
   */
  exports.prototype['previous'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],52:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2008 = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2008 model module.
   * @module model/InlineResponse2008
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2008</code>.
   * @alias module:model/InlineResponse2008
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>InlineResponse2008</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2008} obj Optional instance to populate.
   * @return {module:model/InlineResponse2008} The populated <code>InlineResponse2008</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('airedEpisodes')) {
        obj['airedEpisodes'] = ApiClient.convertToType(data['airedEpisodes'], 'String');
      }
      if (data.hasOwnProperty('airedSeasons')) {
        obj['airedSeasons'] = ApiClient.convertToType(data['airedSeasons'], ['String']);
      }
      if (data.hasOwnProperty('dvdEpisodes')) {
        obj['dvdEpisodes'] = ApiClient.convertToType(data['dvdEpisodes'], 'String');
      }
      if (data.hasOwnProperty('dvdSeasons')) {
        obj['dvdSeasons'] = ApiClient.convertToType(data['dvdSeasons'], ['String']);
      }
    }
    return obj;
  }

  /**
   * Number of all aired episodes for this series
   * @member {String} airedEpisodes
   */
  exports.prototype['airedEpisodes'] = undefined;
  /**
   * @member {Array.<String>} airedSeasons
   */
  exports.prototype['airedSeasons'] = undefined;
  /**
   * Number of all dvd episodes for this series
   * @member {String} dvdEpisodes
   */
  exports.prototype['dvdEpisodes'] = undefined;
  /**
   * @member {Array.<String>} dvdSeasons
   */
  exports.prototype['dvdSeasons'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],53:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2009Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2009Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2009 = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2009Data);
  }
}(this, function(ApiClient, InlineResponse2009Data) {
  'use strict';




  /**
   * The InlineResponse2009 model module.
   * @module model/InlineResponse2009
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2009</code>.
   * @alias module:model/InlineResponse2009
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse2009</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2009} obj Optional instance to populate.
   * @return {module:model/InlineResponse2009} The populated <code>InlineResponse2009</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse2009Data.constructFromObject(data['data']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse2009Data} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2009Data":54}],54:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse2009Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse2009Data model module.
   * @module model/InlineResponse2009Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse2009Data</code>.
   * @alias module:model/InlineResponse2009Data
   * @class
   */
  var exports = function() {
    var _this = this;






  };

  /**
   * Constructs a <code>InlineResponse2009Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse2009Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse2009Data} The populated <code>InlineResponse2009Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('fanart')) {
        obj['fanart'] = ApiClient.convertToType(data['fanart'], 'Number');
      }
      if (data.hasOwnProperty('poster')) {
        obj['poster'] = ApiClient.convertToType(data['poster'], 'Number');
      }
      if (data.hasOwnProperty('season')) {
        obj['season'] = ApiClient.convertToType(data['season'], 'Number');
      }
      if (data.hasOwnProperty('seasonwide')) {
        obj['seasonwide'] = ApiClient.convertToType(data['seasonwide'], 'Number');
      }
      if (data.hasOwnProperty('series')) {
        obj['series'] = ApiClient.convertToType(data['series'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} fanart
   */
  exports.prototype['fanart'] = undefined;
  /**
   * @member {Number} poster
   */
  exports.prototype['poster'] = undefined;
  /**
   * @member {Number} season
   */
  exports.prototype['season'] = undefined;
  /**
   * @member {Number} seasonwide
   */
  exports.prototype['seasonwide'] = undefined;
  /**
   * @member {Number} series
   */
  exports.prototype['series'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],55:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse200Data = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse200Data model module.
   * @module model/InlineResponse200Data
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse200Data</code>.
   * @alias module:model/InlineResponse200Data
   * @class
   */
  var exports = function() {
    var _this = this;
































  };

  /**
   * Constructs a <code>InlineResponse200Data</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse200Data} obj Optional instance to populate.
   * @return {module:model/InlineResponse200Data} The populated <code>InlineResponse200Data</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('absoluteNumber')) {
        obj['absoluteNumber'] = ApiClient.convertToType(data['absoluteNumber'], 'Number');
      }
      if (data.hasOwnProperty('airedEpisodeNumber')) {
        obj['airedEpisodeNumber'] = ApiClient.convertToType(data['airedEpisodeNumber'], 'Number');
      }
      if (data.hasOwnProperty('airedSeason')) {
        obj['airedSeason'] = ApiClient.convertToType(data['airedSeason'], 'Number');
      }
      if (data.hasOwnProperty('airsAfterSeason')) {
        obj['airsAfterSeason'] = ApiClient.convertToType(data['airsAfterSeason'], 'Number');
      }
      if (data.hasOwnProperty('airsBeforeEpisode')) {
        obj['airsBeforeEpisode'] = ApiClient.convertToType(data['airsBeforeEpisode'], 'Number');
      }
      if (data.hasOwnProperty('airsBeforeSeason')) {
        obj['airsBeforeSeason'] = ApiClient.convertToType(data['airsBeforeSeason'], 'Number');
      }
      if (data.hasOwnProperty('director')) {
        obj['director'] = ApiClient.convertToType(data['director'], 'String');
      }
      if (data.hasOwnProperty('directors')) {
        obj['directors'] = ApiClient.convertToType(data['directors'], ['String']);
      }
      if (data.hasOwnProperty('dvdChapter')) {
        obj['dvdChapter'] = ApiClient.convertToType(data['dvdChapter'], 'Number');
      }
      if (data.hasOwnProperty('dvdDiscid')) {
        obj['dvdDiscid'] = ApiClient.convertToType(data['dvdDiscid'], 'String');
      }
      if (data.hasOwnProperty('dvdEpisodeNumber')) {
        obj['dvdEpisodeNumber'] = ApiClient.convertToType(data['dvdEpisodeNumber'], 'Number');
      }
      if (data.hasOwnProperty('dvdSeason')) {
        obj['dvdSeason'] = ApiClient.convertToType(data['dvdSeason'], 'Number');
      }
      if (data.hasOwnProperty('episodeName')) {
        obj['episodeName'] = ApiClient.convertToType(data['episodeName'], 'String');
      }
      if (data.hasOwnProperty('filename')) {
        obj['filename'] = ApiClient.convertToType(data['filename'], 'String');
      }
      if (data.hasOwnProperty('firstAired')) {
        obj['firstAired'] = ApiClient.convertToType(data['firstAired'], 'String');
      }
      if (data.hasOwnProperty('guestStars')) {
        obj['guestStars'] = ApiClient.convertToType(data['guestStars'], ['String']);
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('imdbId')) {
        obj['imdbId'] = ApiClient.convertToType(data['imdbId'], 'String');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'Number');
      }
      if (data.hasOwnProperty('lastUpdatedBy')) {
        obj['lastUpdatedBy'] = ApiClient.convertToType(data['lastUpdatedBy'], 'String');
      }
      if (data.hasOwnProperty('overview')) {
        obj['overview'] = ApiClient.convertToType(data['overview'], 'String');
      }
      if (data.hasOwnProperty('productionCode')) {
        obj['productionCode'] = ApiClient.convertToType(data['productionCode'], 'String');
      }
      if (data.hasOwnProperty('seriesId')) {
        obj['seriesId'] = ApiClient.convertToType(data['seriesId'], 'String');
      }
      if (data.hasOwnProperty('showUrl')) {
        obj['showUrl'] = ApiClient.convertToType(data['showUrl'], 'String');
      }
      if (data.hasOwnProperty('siteRating')) {
        obj['siteRating'] = ApiClient.convertToType(data['siteRating'], 'Number');
      }
      if (data.hasOwnProperty('siteRatingCount')) {
        obj['siteRatingCount'] = ApiClient.convertToType(data['siteRatingCount'], 'Number');
      }
      if (data.hasOwnProperty('thumbAdded')) {
        obj['thumbAdded'] = ApiClient.convertToType(data['thumbAdded'], 'String');
      }
      if (data.hasOwnProperty('thumbAuthor')) {
        obj['thumbAuthor'] = ApiClient.convertToType(data['thumbAuthor'], 'Number');
      }
      if (data.hasOwnProperty('thumbHeight')) {
        obj['thumbHeight'] = ApiClient.convertToType(data['thumbHeight'], 'String');
      }
      if (data.hasOwnProperty('thumbWidth')) {
        obj['thumbWidth'] = ApiClient.convertToType(data['thumbWidth'], 'String');
      }
      if (data.hasOwnProperty('writers')) {
        obj['writers'] = ApiClient.convertToType(data['writers'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Number} absoluteNumber
   */
  exports.prototype['absoluteNumber'] = undefined;
  /**
   * @member {Number} airedEpisodeNumber
   */
  exports.prototype['airedEpisodeNumber'] = undefined;
  /**
   * @member {Number} airedSeason
   */
  exports.prototype['airedSeason'] = undefined;
  /**
   * @member {Number} airsAfterSeason
   */
  exports.prototype['airsAfterSeason'] = undefined;
  /**
   * @member {Number} airsBeforeEpisode
   */
  exports.prototype['airsBeforeEpisode'] = undefined;
  /**
   * @member {Number} airsBeforeSeason
   */
  exports.prototype['airsBeforeSeason'] = undefined;
  /**
   * @member {String} director
   */
  exports.prototype['director'] = undefined;
  /**
   * @member {Array.<String>} directors
   */
  exports.prototype['directors'] = undefined;
  /**
   * @member {Number} dvdChapter
   */
  exports.prototype['dvdChapter'] = undefined;
  /**
   * @member {String} dvdDiscid
   */
  exports.prototype['dvdDiscid'] = undefined;
  /**
   * @member {Number} dvdEpisodeNumber
   */
  exports.prototype['dvdEpisodeNumber'] = undefined;
  /**
   * @member {Number} dvdSeason
   */
  exports.prototype['dvdSeason'] = undefined;
  /**
   * @member {String} episodeName
   */
  exports.prototype['episodeName'] = undefined;
  /**
   * @member {String} filename
   */
  exports.prototype['filename'] = undefined;
  /**
   * @member {String} firstAired
   */
  exports.prototype['firstAired'] = undefined;
  /**
   * @member {Array.<String>} guestStars
   */
  exports.prototype['guestStars'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} imdbId
   */
  exports.prototype['imdbId'] = undefined;
  /**
   * @member {Number} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;
  /**
   * @member {String} lastUpdatedBy
   */
  exports.prototype['lastUpdatedBy'] = undefined;
  /**
   * @member {String} overview
   */
  exports.prototype['overview'] = undefined;
  /**
   * @member {String} productionCode
   */
  exports.prototype['productionCode'] = undefined;
  /**
   * @member {String} seriesId
   */
  exports.prototype['seriesId'] = undefined;
  /**
   * @member {String} showUrl
   */
  exports.prototype['showUrl'] = undefined;
  /**
   * @member {Number} siteRating
   */
  exports.prototype['siteRating'] = undefined;
  /**
   * @member {Number} siteRatingCount
   */
  exports.prototype['siteRatingCount'] = undefined;
  /**
   * @member {String} thumbAdded
   */
  exports.prototype['thumbAdded'] = undefined;
  /**
   * @member {Number} thumbAuthor
   */
  exports.prototype['thumbAuthor'] = undefined;
  /**
   * @member {String} thumbHeight
   */
  exports.prototype['thumbHeight'] = undefined;
  /**
   * @member {String} thumbWidth
   */
  exports.prototype['thumbWidth'] = undefined;
  /**
   * @member {Array.<String>} writers
   */
  exports.prototype['writers'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],56:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse200Errors = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse200Errors model module.
   * @module model/InlineResponse200Errors
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse200Errors</code>.
   * @alias module:model/InlineResponse200Errors
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>InlineResponse200Errors</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse200Errors} obj Optional instance to populate.
   * @return {module:model/InlineResponse200Errors} The populated <code>InlineResponse200Errors</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('invalidFilters')) {
        obj['invalidFilters'] = ApiClient.convertToType(data['invalidFilters'], ['String']);
      }
      if (data.hasOwnProperty('invalidLanguage')) {
        obj['invalidLanguage'] = ApiClient.convertToType(data['invalidLanguage'], 'String');
      }
      if (data.hasOwnProperty('invalidQueryParams')) {
        obj['invalidQueryParams'] = ApiClient.convertToType(data['invalidQueryParams'], ['String']);
      }
    }
    return obj;
  }

  /**
   * Invalid filters passed to route
   * @member {Array.<String>} invalidFilters
   */
  exports.prototype['invalidFilters'] = undefined;
  /**
   * Invalid language or translation missing
   * @member {String} invalidLanguage
   */
  exports.prototype['invalidLanguage'] = undefined;
  /**
   * Invalid query params passed to route
   * @member {Array.<String>} invalidQueryParams
   */
  exports.prototype['invalidQueryParams'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],57:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse401 = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse401 model module.
   * @module model/InlineResponse401
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse401</code>.
   * @alias module:model/InlineResponse401
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse401</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse401} obj Optional instance to populate.
   * @return {module:model/InlineResponse401} The populated <code>InlineResponse401</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Error')) {
        obj['Error'] = ApiClient.convertToType(data['Error'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} Error
   * @default 'Not Authorized'
   */
  exports.prototype['Error'] = 'Not Authorized';



  return exports;
}));



},{"../ApiClient":8}],58:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse404 = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse404 model module.
   * @module model/InlineResponse404
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse404</code>.
   * @alias module:model/InlineResponse404
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse404</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse404} obj Optional instance to populate.
   * @return {module:model/InlineResponse404} The populated <code>InlineResponse404</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Error')) {
        obj['Error'] = ApiClient.convertToType(data['Error'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} Error
   * @default 'Not Found'
   */
  exports.prototype['Error'] = 'Not Found';



  return exports;
}));



},{"../ApiClient":8}],59:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.InlineResponse409 = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The InlineResponse409 model module.
   * @module model/InlineResponse409
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>InlineResponse409</code>.
   * @alias module:model/InlineResponse409
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>InlineResponse409</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/InlineResponse409} obj Optional instance to populate.
   * @return {module:model/InlineResponse409} The populated <code>InlineResponse409</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Error')) {
        obj['Error'] = ApiClient.convertToType(data['Error'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} Error
   * @default 'Conflict'
   */
  exports.prototype['Error'] = 'Conflict';



  return exports;
}));



},{"../ApiClient":8}],60:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.JSONErrors = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The JSONErrors model module.
   * @module model/JSONErrors
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>JSONErrors</code>.
   * @alias module:model/JSONErrors
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>JSONErrors</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/JSONErrors} obj Optional instance to populate.
   * @return {module:model/JSONErrors} The populated <code>JSONErrors</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('invalidFilters')) {
        obj['invalidFilters'] = ApiClient.convertToType(data['invalidFilters'], ['String']);
      }
      if (data.hasOwnProperty('invalidLanguage')) {
        obj['invalidLanguage'] = ApiClient.convertToType(data['invalidLanguage'], 'String');
      }
      if (data.hasOwnProperty('invalidQueryParams')) {
        obj['invalidQueryParams'] = ApiClient.convertToType(data['invalidQueryParams'], ['String']);
      }
    }
    return obj;
  }

  /**
   * Invalid filters passed to route
   * @member {Array.<String>} invalidFilters
   */
  exports.prototype['invalidFilters'] = undefined;
  /**
   * Invalid language or translation missing
   * @member {String} invalidLanguage
   */
  exports.prototype['invalidLanguage'] = undefined;
  /**
   * Invalid query params passed to route
   * @member {Array.<String>} invalidQueryParams
   */
  exports.prototype['invalidQueryParams'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],61:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.Language = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Language model module.
   * @module model/Language
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>Language</code>.
   * @alias module:model/Language
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>Language</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Language} obj Optional instance to populate.
   * @return {module:model/Language} The populated <code>Language</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('abbreviation')) {
        obj['abbreviation'] = ApiClient.convertToType(data['abbreviation'], 'String');
      }
      if (data.hasOwnProperty('englishName')) {
        obj['englishName'] = ApiClient.convertToType(data['englishName'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} abbreviation
   */
  exports.prototype['abbreviation'] = undefined;
  /**
   * @member {String} englishName
   */
  exports.prototype['englishName'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],62:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2001Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2001Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.LanguageData = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2001Data);
  }
}(this, function(ApiClient, InlineResponse2001Data) {
  'use strict';




  /**
   * The LanguageData model module.
   * @module model/LanguageData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>LanguageData</code>.
   * @alias module:model/LanguageData
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>LanguageData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/LanguageData} obj Optional instance to populate.
   * @return {module:model/LanguageData} The populated <code>LanguageData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse2001Data]);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse2001Data>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2001Data":41}],63:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.Links = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Links model module.
   * @module model/Links
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>Links</code>.
   * @alias module:model/Links
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>Links</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Links} obj Optional instance to populate.
   * @return {module:model/Links} The populated <code>Links</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('first')) {
        obj['first'] = ApiClient.convertToType(data['first'], 'Number');
      }
      if (data.hasOwnProperty('last')) {
        obj['last'] = ApiClient.convertToType(data['last'], 'Number');
      }
      if (data.hasOwnProperty('next')) {
        obj['next'] = ApiClient.convertToType(data['next'], 'Number');
      }
      if (data.hasOwnProperty('previous')) {
        obj['previous'] = ApiClient.convertToType(data['previous'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} first
   */
  exports.prototype['first'] = undefined;
  /**
   * @member {Number} last
   */
  exports.prototype['last'] = undefined;
  /**
   * @member {Number} next
   */
  exports.prototype['next'] = undefined;
  /**
   * @member {Number} previous
   */
  exports.prototype['previous'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],64:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.NotAuthorized = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The NotAuthorized model module.
   * @module model/NotAuthorized
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>NotAuthorized</code>.
   * @alias module:model/NotAuthorized
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>NotAuthorized</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/NotAuthorized} obj Optional instance to populate.
   * @return {module:model/NotAuthorized} The populated <code>NotAuthorized</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Error')) {
        obj['Error'] = ApiClient.convertToType(data['Error'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} Error
   * @default 'Not Authorized'
   */
  exports.prototype['Error'] = 'Not Authorized';



  return exports;
}));



},{"../ApiClient":8}],65:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.NotFound = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The NotFound model module.
   * @module model/NotFound
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>NotFound</code>.
   * @alias module:model/NotFound
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>NotFound</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/NotFound} obj Optional instance to populate.
   * @return {module:model/NotFound} The populated <code>NotFound</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('Error')) {
        obj['Error'] = ApiClient.convertToType(data['Error'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} Error
   * @default 'Not Found'
   */
  exports.prototype['Error'] = 'Not Found';



  return exports;
}));



},{"../ApiClient":8}],66:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.Series = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Series model module.
   * @module model/Series
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>Series</code>.
   * @alias module:model/Series
   * @class
   */
  var exports = function() {
    var _this = this;






















  };

  /**
   * Constructs a <code>Series</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Series} obj Optional instance to populate.
   * @return {module:model/Series} The populated <code>Series</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('added')) {
        obj['added'] = ApiClient.convertToType(data['added'], 'String');
      }
      if (data.hasOwnProperty('airsDayOfWeek')) {
        obj['airsDayOfWeek'] = ApiClient.convertToType(data['airsDayOfWeek'], 'String');
      }
      if (data.hasOwnProperty('airsTime')) {
        obj['airsTime'] = ApiClient.convertToType(data['airsTime'], 'String');
      }
      if (data.hasOwnProperty('aliases')) {
        obj['aliases'] = ApiClient.convertToType(data['aliases'], ['String']);
      }
      if (data.hasOwnProperty('banner')) {
        obj['banner'] = ApiClient.convertToType(data['banner'], 'String');
      }
      if (data.hasOwnProperty('firstAired')) {
        obj['firstAired'] = ApiClient.convertToType(data['firstAired'], 'String');
      }
      if (data.hasOwnProperty('genre')) {
        obj['genre'] = ApiClient.convertToType(data['genre'], ['String']);
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('imdbId')) {
        obj['imdbId'] = ApiClient.convertToType(data['imdbId'], 'String');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'Number');
      }
      if (data.hasOwnProperty('network')) {
        obj['network'] = ApiClient.convertToType(data['network'], 'String');
      }
      if (data.hasOwnProperty('networkId')) {
        obj['networkId'] = ApiClient.convertToType(data['networkId'], 'String');
      }
      if (data.hasOwnProperty('overview')) {
        obj['overview'] = ApiClient.convertToType(data['overview'], 'String');
      }
      if (data.hasOwnProperty('rating')) {
        obj['rating'] = ApiClient.convertToType(data['rating'], 'String');
      }
      if (data.hasOwnProperty('runtime')) {
        obj['runtime'] = ApiClient.convertToType(data['runtime'], 'String');
      }
      if (data.hasOwnProperty('seriesId')) {
        obj['seriesId'] = ApiClient.convertToType(data['seriesId'], 'Number');
      }
      if (data.hasOwnProperty('seriesName')) {
        obj['seriesName'] = ApiClient.convertToType(data['seriesName'], 'String');
      }
      if (data.hasOwnProperty('siteRating')) {
        obj['siteRating'] = ApiClient.convertToType(data['siteRating'], 'Number');
      }
      if (data.hasOwnProperty('siteRatingCount')) {
        obj['siteRatingCount'] = ApiClient.convertToType(data['siteRatingCount'], 'Number');
      }
      if (data.hasOwnProperty('status')) {
        obj['status'] = ApiClient.convertToType(data['status'], 'String');
      }
      if (data.hasOwnProperty('zap2itId')) {
        obj['zap2itId'] = ApiClient.convertToType(data['zap2itId'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} added
   */
  exports.prototype['added'] = undefined;
  /**
   * @member {String} airsDayOfWeek
   */
  exports.prototype['airsDayOfWeek'] = undefined;
  /**
   * @member {String} airsTime
   */
  exports.prototype['airsTime'] = undefined;
  /**
   * @member {Array.<String>} aliases
   */
  exports.prototype['aliases'] = undefined;
  /**
   * @member {String} banner
   */
  exports.prototype['banner'] = undefined;
  /**
   * @member {String} firstAired
   */
  exports.prototype['firstAired'] = undefined;
  /**
   * @member {Array.<String>} genre
   */
  exports.prototype['genre'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} imdbId
   */
  exports.prototype['imdbId'] = undefined;
  /**
   * @member {Number} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;
  /**
   * @member {String} network
   */
  exports.prototype['network'] = undefined;
  /**
   * @member {String} networkId
   */
  exports.prototype['networkId'] = undefined;
  /**
   * @member {String} overview
   */
  exports.prototype['overview'] = undefined;
  /**
   * @member {String} rating
   */
  exports.prototype['rating'] = undefined;
  /**
   * @member {String} runtime
   */
  exports.prototype['runtime'] = undefined;
  /**
   * @member {Number} seriesId
   */
  exports.prototype['seriesId'] = undefined;
  /**
   * @member {String} seriesName
   */
  exports.prototype['seriesName'] = undefined;
  /**
   * @member {Number} siteRating
   */
  exports.prototype['siteRating'] = undefined;
  /**
   * @member {Number} siteRatingCount
   */
  exports.prototype['siteRatingCount'] = undefined;
  /**
   * @member {String} status
   */
  exports.prototype['status'] = undefined;
  /**
   * @member {String} zap2itId
   */
  exports.prototype['zap2itId'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],67:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2006Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2006Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesActors = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2006Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse2006Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The SeriesActors model module.
   * @module model/SeriesActors
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesActors</code>.
   * @alias module:model/SeriesActors
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>SeriesActors</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesActors} obj Optional instance to populate.
   * @return {module:model/SeriesActors} The populated <code>SeriesActors</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse2006Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse2006Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2006Data":48,"./InlineResponse200Errors":56}],68:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesActorsData = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The SeriesActorsData model module.
   * @module model/SeriesActorsData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesActorsData</code>.
   * @alias module:model/SeriesActorsData
   * @class
   */
  var exports = function() {
    var _this = this;










  };

  /**
   * Constructs a <code>SeriesActorsData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesActorsData} obj Optional instance to populate.
   * @return {module:model/SeriesActorsData} The populated <code>SeriesActorsData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('image')) {
        obj['image'] = ApiClient.convertToType(data['image'], 'String');
      }
      if (data.hasOwnProperty('imageAdded')) {
        obj['imageAdded'] = ApiClient.convertToType(data['imageAdded'], 'String');
      }
      if (data.hasOwnProperty('imageAuthor')) {
        obj['imageAuthor'] = ApiClient.convertToType(data['imageAuthor'], 'Number');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'String');
      }
      if (data.hasOwnProperty('name')) {
        obj['name'] = ApiClient.convertToType(data['name'], 'String');
      }
      if (data.hasOwnProperty('role')) {
        obj['role'] = ApiClient.convertToType(data['role'], 'String');
      }
      if (data.hasOwnProperty('seriesId')) {
        obj['seriesId'] = ApiClient.convertToType(data['seriesId'], 'Number');
      }
      if (data.hasOwnProperty('sortOrder')) {
        obj['sortOrder'] = ApiClient.convertToType(data['sortOrder'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} image
   */
  exports.prototype['image'] = undefined;
  /**
   * @member {String} imageAdded
   */
  exports.prototype['imageAdded'] = undefined;
  /**
   * @member {Number} imageAuthor
   */
  exports.prototype['imageAuthor'] = undefined;
  /**
   * @member {String} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;
  /**
   * @member {String} name
   */
  exports.prototype['name'] = undefined;
  /**
   * @member {String} role
   */
  exports.prototype['role'] = undefined;
  /**
   * @member {Number} seriesId
   */
  exports.prototype['seriesId'] = undefined;
  /**
   * @member {Number} sortOrder
   */
  exports.prototype['sortOrder'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],69:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2005Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2005Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesData = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2005Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse2005Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The SeriesData model module.
   * @module model/SeriesData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesData</code>.
   * @alias module:model/SeriesData
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>SeriesData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesData} obj Optional instance to populate.
   * @return {module:model/SeriesData} The populated <code>SeriesData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse2005Data.constructFromObject(data['data']);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse2005Data} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2005Data":46,"./InlineResponse200Errors":56}],70:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2007Data', 'model/InlineResponse2007Links', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2007Data'), require('./InlineResponse2007Links'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesEpisodes = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2007Data, root.TheTvdbApiV2.InlineResponse2007Links, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse2007Data, InlineResponse2007Links, InlineResponse200Errors) {
  'use strict';




  /**
   * The SeriesEpisodes model module.
   * @module model/SeriesEpisodes
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesEpisodes</code>.
   * @alias module:model/SeriesEpisodes
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>SeriesEpisodes</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesEpisodes} obj Optional instance to populate.
   * @return {module:model/SeriesEpisodes} The populated <code>SeriesEpisodes</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse2007Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
      if (data.hasOwnProperty('links')) {
        obj['links'] = InlineResponse2007Links.constructFromObject(data['links']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse2007Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;
  /**
   * @member {module:model/InlineResponse2007Links} links
   */
  exports.prototype['links'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2007Data":50,"./InlineResponse2007Links":51,"./InlineResponse200Errors":56}],71:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2007Data', 'model/InlineResponse2007Links', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2007Data'), require('./InlineResponse2007Links'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesEpisodesQuery = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2007Data, root.TheTvdbApiV2.InlineResponse2007Links, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse2007Data, InlineResponse2007Links, InlineResponse200Errors) {
  'use strict';




  /**
   * The SeriesEpisodesQuery model module.
   * @module model/SeriesEpisodesQuery
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesEpisodesQuery</code>.
   * @alias module:model/SeriesEpisodesQuery
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>SeriesEpisodesQuery</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesEpisodesQuery} obj Optional instance to populate.
   * @return {module:model/SeriesEpisodesQuery} The populated <code>SeriesEpisodesQuery</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse2007Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
      if (data.hasOwnProperty('links')) {
        obj['links'] = InlineResponse2007Links.constructFromObject(data['links']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse2007Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;
  /**
   * @member {module:model/InlineResponse2007Links} links
   */
  exports.prototype['links'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2007Data":50,"./InlineResponse2007Links":51,"./InlineResponse200Errors":56}],72:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesEpisodesQueryParams = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The SeriesEpisodesQueryParams model module.
   * @module model/SeriesEpisodesQueryParams
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesEpisodesQueryParams</code>.
   * @alias module:model/SeriesEpisodesQueryParams
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>SeriesEpisodesQueryParams</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesEpisodesQueryParams} obj Optional instance to populate.
   * @return {module:model/SeriesEpisodesQueryParams} The populated <code>SeriesEpisodesQueryParams</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],73:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesEpisodesSummary = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The SeriesEpisodesSummary model module.
   * @module model/SeriesEpisodesSummary
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesEpisodesSummary</code>.
   * @alias module:model/SeriesEpisodesSummary
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>SeriesEpisodesSummary</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesEpisodesSummary} obj Optional instance to populate.
   * @return {module:model/SeriesEpisodesSummary} The populated <code>SeriesEpisodesSummary</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('airedEpisodes')) {
        obj['airedEpisodes'] = ApiClient.convertToType(data['airedEpisodes'], 'String');
      }
      if (data.hasOwnProperty('airedSeasons')) {
        obj['airedSeasons'] = ApiClient.convertToType(data['airedSeasons'], ['String']);
      }
      if (data.hasOwnProperty('dvdEpisodes')) {
        obj['dvdEpisodes'] = ApiClient.convertToType(data['dvdEpisodes'], 'String');
      }
      if (data.hasOwnProperty('dvdSeasons')) {
        obj['dvdSeasons'] = ApiClient.convertToType(data['dvdSeasons'], ['String']);
      }
    }
    return obj;
  }

  /**
   * Number of all aired episodes for this series
   * @member {String} airedEpisodes
   */
  exports.prototype['airedEpisodes'] = undefined;
  /**
   * @member {Array.<String>} airedSeasons
   */
  exports.prototype['airedSeasons'] = undefined;
  /**
   * Number of all dvd episodes for this series
   * @member {String} dvdEpisodes
   */
  exports.prototype['dvdEpisodes'] = undefined;
  /**
   * @member {Array.<String>} dvdSeasons
   */
  exports.prototype['dvdSeasons'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],74:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20010RatingsInfo'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20010RatingsInfo'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesImageQueryResult = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20010RatingsInfo);
  }
}(this, function(ApiClient, InlineResponse20010RatingsInfo) {
  'use strict';




  /**
   * The SeriesImageQueryResult model module.
   * @module model/SeriesImageQueryResult
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesImageQueryResult</code>.
   * @alias module:model/SeriesImageQueryResult
   * @class
   */
  var exports = function() {
    var _this = this;









  };

  /**
   * Constructs a <code>SeriesImageQueryResult</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesImageQueryResult} obj Optional instance to populate.
   * @return {module:model/SeriesImageQueryResult} The populated <code>SeriesImageQueryResult</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('fileName')) {
        obj['fileName'] = ApiClient.convertToType(data['fileName'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('keyType')) {
        obj['keyType'] = ApiClient.convertToType(data['keyType'], 'String');
      }
      if (data.hasOwnProperty('languageId')) {
        obj['languageId'] = ApiClient.convertToType(data['languageId'], 'Number');
      }
      if (data.hasOwnProperty('ratingsInfo')) {
        obj['ratingsInfo'] = InlineResponse20010RatingsInfo.constructFromObject(data['ratingsInfo']);
      }
      if (data.hasOwnProperty('resolution')) {
        obj['resolution'] = ApiClient.convertToType(data['resolution'], 'String');
      }
      if (data.hasOwnProperty('subKey')) {
        obj['subKey'] = ApiClient.convertToType(data['subKey'], 'String');
      }
      if (data.hasOwnProperty('thumbnail')) {
        obj['thumbnail'] = ApiClient.convertToType(data['thumbnail'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} fileName
   */
  exports.prototype['fileName'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} keyType
   */
  exports.prototype['keyType'] = undefined;
  /**
   * @member {Number} languageId
   */
  exports.prototype['languageId'] = undefined;
  /**
   * @member {module:model/InlineResponse20010RatingsInfo} ratingsInfo
   */
  exports.prototype['ratingsInfo'] = undefined;
  /**
   * @member {String} resolution
   */
  exports.prototype['resolution'] = undefined;
  /**
   * @member {String} subKey
   */
  exports.prototype['subKey'] = undefined;
  /**
   * @member {String} thumbnail
   */
  exports.prototype['thumbnail'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20010RatingsInfo":29}],75:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20010Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20010Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesImageQueryResults = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20010Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse20010Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The SeriesImageQueryResults model module.
   * @module model/SeriesImageQueryResults
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesImageQueryResults</code>.
   * @alias module:model/SeriesImageQueryResults
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>SeriesImageQueryResults</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesImageQueryResults} obj Optional instance to populate.
   * @return {module:model/SeriesImageQueryResults} The populated <code>SeriesImageQueryResults</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20010Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20010Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20010Data":28,"./InlineResponse200Errors":56}],76:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesImagesCount = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The SeriesImagesCount model module.
   * @module model/SeriesImagesCount
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesImagesCount</code>.
   * @alias module:model/SeriesImagesCount
   * @class
   */
  var exports = function() {
    var _this = this;






  };

  /**
   * Constructs a <code>SeriesImagesCount</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesImagesCount} obj Optional instance to populate.
   * @return {module:model/SeriesImagesCount} The populated <code>SeriesImagesCount</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('fanart')) {
        obj['fanart'] = ApiClient.convertToType(data['fanart'], 'Number');
      }
      if (data.hasOwnProperty('poster')) {
        obj['poster'] = ApiClient.convertToType(data['poster'], 'Number');
      }
      if (data.hasOwnProperty('season')) {
        obj['season'] = ApiClient.convertToType(data['season'], 'Number');
      }
      if (data.hasOwnProperty('seasonwide')) {
        obj['seasonwide'] = ApiClient.convertToType(data['seasonwide'], 'Number');
      }
      if (data.hasOwnProperty('series')) {
        obj['series'] = ApiClient.convertToType(data['series'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} fanart
   */
  exports.prototype['fanart'] = undefined;
  /**
   * @member {Number} poster
   */
  exports.prototype['poster'] = undefined;
  /**
   * @member {Number} season
   */
  exports.prototype['season'] = undefined;
  /**
   * @member {Number} seasonwide
   */
  exports.prototype['seasonwide'] = undefined;
  /**
   * @member {Number} series
   */
  exports.prototype['series'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],77:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse2009Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse2009Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesImagesCounts = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse2009Data);
  }
}(this, function(ApiClient, InlineResponse2009Data) {
  'use strict';




  /**
   * The SeriesImagesCounts model module.
   * @module model/SeriesImagesCounts
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesImagesCounts</code>.
   * @alias module:model/SeriesImagesCounts
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>SeriesImagesCounts</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesImagesCounts} obj Optional instance to populate.
   * @return {module:model/SeriesImagesCounts} The populated <code>SeriesImagesCounts</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse2009Data.constructFromObject(data['data']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse2009Data} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse2009Data":54}],78:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesImagesQueryParam = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The SeriesImagesQueryParam model module.
   * @module model/SeriesImagesQueryParam
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesImagesQueryParam</code>.
   * @alias module:model/SeriesImagesQueryParam
   * @class
   */
  var exports = function() {
    var _this = this;





  };

  /**
   * Constructs a <code>SeriesImagesQueryParam</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesImagesQueryParam} obj Optional instance to populate.
   * @return {module:model/SeriesImagesQueryParam} The populated <code>SeriesImagesQueryParam</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('keyType')) {
        obj['keyType'] = ApiClient.convertToType(data['keyType'], 'String');
      }
      if (data.hasOwnProperty('languageId')) {
        obj['languageId'] = ApiClient.convertToType(data['languageId'], 'String');
      }
      if (data.hasOwnProperty('resolution')) {
        obj['resolution'] = ApiClient.convertToType(data['resolution'], ['String']);
      }
      if (data.hasOwnProperty('subKey')) {
        obj['subKey'] = ApiClient.convertToType(data['subKey'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {String} keyType
   */
  exports.prototype['keyType'] = undefined;
  /**
   * @member {String} languageId
   */
  exports.prototype['languageId'] = undefined;
  /**
   * @member {Array.<String>} resolution
   */
  exports.prototype['resolution'] = undefined;
  /**
   * @member {Array.<String>} subKey
   */
  exports.prototype['subKey'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],79:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20011Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20011Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesImagesQueryParams = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20011Data);
  }
}(this, function(ApiClient, InlineResponse20011Data) {
  'use strict';




  /**
   * The SeriesImagesQueryParams model module.
   * @module model/SeriesImagesQueryParams
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesImagesQueryParams</code>.
   * @alias module:model/SeriesImagesQueryParams
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>SeriesImagesQueryParams</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesImagesQueryParams} obj Optional instance to populate.
   * @return {module:model/SeriesImagesQueryParams} The populated <code>SeriesImagesQueryParams</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20011Data]);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20011Data>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20011Data":31}],80:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.SeriesSearchData = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The SeriesSearchData model module.
   * @module model/SeriesSearchData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>SeriesSearchData</code>.
   * @alias module:model/SeriesSearchData
   * @class
   */
  var exports = function() {
    var _this = this;









  };

  /**
   * Constructs a <code>SeriesSearchData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/SeriesSearchData} obj Optional instance to populate.
   * @return {module:model/SeriesSearchData} The populated <code>SeriesSearchData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('aliases')) {
        obj['aliases'] = ApiClient.convertToType(data['aliases'], ['String']);
      }
      if (data.hasOwnProperty('banner')) {
        obj['banner'] = ApiClient.convertToType(data['banner'], 'String');
      }
      if (data.hasOwnProperty('firstAired')) {
        obj['firstAired'] = ApiClient.convertToType(data['firstAired'], 'String');
      }
      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('network')) {
        obj['network'] = ApiClient.convertToType(data['network'], 'String');
      }
      if (data.hasOwnProperty('overview')) {
        obj['overview'] = ApiClient.convertToType(data['overview'], 'String');
      }
      if (data.hasOwnProperty('seriesName')) {
        obj['seriesName'] = ApiClient.convertToType(data['seriesName'], 'String');
      }
      if (data.hasOwnProperty('status')) {
        obj['status'] = ApiClient.convertToType(data['status'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} aliases
   */
  exports.prototype['aliases'] = undefined;
  /**
   * @member {String} banner
   */
  exports.prototype['banner'] = undefined;
  /**
   * @member {String} firstAired
   */
  exports.prototype['firstAired'] = undefined;
  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {String} network
   */
  exports.prototype['network'] = undefined;
  /**
   * @member {String} overview
   */
  exports.prototype['overview'] = undefined;
  /**
   * @member {String} seriesName
   */
  exports.prototype['seriesName'] = undefined;
  /**
   * @member {String} status
   */
  exports.prototype['status'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],81:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.Token = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Token model module.
   * @module model/Token
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>Token</code>.
   * @alias module:model/Token
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>Token</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Token} obj Optional instance to populate.
   * @return {module:model/Token} The populated <code>Token</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('token')) {
        obj['token'] = ApiClient.convertToType(data['token'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} token
   */
  exports.prototype['token'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],82:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.Update = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The Update model module.
   * @module model/Update
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>Update</code>.
   * @alias module:model/Update
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>Update</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/Update} obj Optional instance to populate.
   * @return {module:model/Update} The populated <code>Update</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('id')) {
        obj['id'] = ApiClient.convertToType(data['id'], 'Number');
      }
      if (data.hasOwnProperty('lastUpdated')) {
        obj['lastUpdated'] = ApiClient.convertToType(data['lastUpdated'], 'Number');
      }
    }
    return obj;
  }

  /**
   * @member {Number} id
   */
  exports.prototype['id'] = undefined;
  /**
   * @member {Number} lastUpdated
   */
  exports.prototype['lastUpdated'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],83:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20012Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20012Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UpdateData = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20012Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse20012Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The UpdateData model module.
   * @module model/UpdateData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UpdateData</code>.
   * @alias module:model/UpdateData
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>UpdateData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UpdateData} obj Optional instance to populate.
   * @return {module:model/UpdateData} The populated <code>UpdateData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20012Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20012Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20012Data":33,"./InlineResponse200Errors":56}],84:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UpdateDataQueryParams = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The UpdateDataQueryParams model module.
   * @module model/UpdateDataQueryParams
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UpdateDataQueryParams</code>.
   * @alias module:model/UpdateDataQueryParams
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>UpdateDataQueryParams</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UpdateDataQueryParams} obj Optional instance to populate.
   * @return {module:model/UpdateDataQueryParams} The populated <code>UpdateDataQueryParams</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],85:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.User = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The User model module.
   * @module model/User
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>User</code>.
   * @alias module:model/User
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>User</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/User} obj Optional instance to populate.
   * @return {module:model/User} The populated <code>User</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('favoritesDisplaymode')) {
        obj['favoritesDisplaymode'] = ApiClient.convertToType(data['favoritesDisplaymode'], 'String');
      }
      if (data.hasOwnProperty('language')) {
        obj['language'] = ApiClient.convertToType(data['language'], 'String');
      }
      if (data.hasOwnProperty('userName')) {
        obj['userName'] = ApiClient.convertToType(data['userName'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {String} favoritesDisplaymode
   */
  exports.prototype['favoritesDisplaymode'] = undefined;
  /**
   * @member {String} language
   */
  exports.prototype['language'] = undefined;
  /**
   * @member {String} userName
   */
  exports.prototype['userName'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],86:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20013Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20013Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UserData = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20013Data);
  }
}(this, function(ApiClient, InlineResponse20013Data) {
  'use strict';




  /**
   * The UserData model module.
   * @module model/UserData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UserData</code>.
   * @alias module:model/UserData
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>UserData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UserData} obj Optional instance to populate.
   * @return {module:model/UserData} The populated <code>UserData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse20013Data.constructFromObject(data['data']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse20013Data} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20013Data":35}],87:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UserFavorites = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The UserFavorites model module.
   * @module model/UserFavorites
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UserFavorites</code>.
   * @alias module:model/UserFavorites
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>UserFavorites</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UserFavorites} obj Optional instance to populate.
   * @return {module:model/UserFavorites} The populated <code>UserFavorites</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('favorites')) {
        obj['favorites'] = ApiClient.convertToType(data['favorites'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} favorites
   */
  exports.prototype['favorites'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],88:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20014Data', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20014Data'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UserFavoritesData = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20014Data, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse20014Data, InlineResponse200Errors) {
  'use strict';




  /**
   * The UserFavoritesData model module.
   * @module model/UserFavoritesData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UserFavoritesData</code>.
   * @alias module:model/UserFavoritesData
   * @class
   */
  var exports = function() {
    var _this = this;



  };

  /**
   * Constructs a <code>UserFavoritesData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UserFavoritesData} obj Optional instance to populate.
   * @return {module:model/UserFavoritesData} The populated <code>UserFavoritesData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = InlineResponse20014Data.constructFromObject(data['data']);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
    }
    return obj;
  }

  /**
   * @member {module:model/InlineResponse20014Data} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20014Data":37,"./InlineResponse200Errors":56}],89:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UserRatings = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The UserRatings model module.
   * @module model/UserRatings
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UserRatings</code>.
   * @alias module:model/UserRatings
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>UserRatings</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UserRatings} obj Optional instance to populate.
   * @return {module:model/UserRatings} The populated <code>UserRatings</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('rating')) {
        obj['rating'] = ApiClient.convertToType(data['rating'], 'Number');
      }
      if (data.hasOwnProperty('ratingItemId')) {
        obj['ratingItemId'] = ApiClient.convertToType(data['ratingItemId'], 'Number');
      }
      if (data.hasOwnProperty('ratingType')) {
        obj['ratingType'] = ApiClient.convertToType(data['ratingType'], 'String');
      }
    }
    return obj;
  }

  /**
   * @member {Number} rating
   */
  exports.prototype['rating'] = undefined;
  /**
   * @member {Number} ratingItemId
   */
  exports.prototype['ratingItemId'] = undefined;
  /**
   * @member {String} ratingType
   */
  exports.prototype['ratingType'] = undefined;



  return exports;
}));



},{"../ApiClient":8}],90:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20015Data', 'model/InlineResponse2007Links', 'model/InlineResponse200Errors'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20015Data'), require('./InlineResponse2007Links'), require('./InlineResponse200Errors'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UserRatingsData = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20015Data, root.TheTvdbApiV2.InlineResponse2007Links, root.TheTvdbApiV2.InlineResponse200Errors);
  }
}(this, function(ApiClient, InlineResponse20015Data, InlineResponse2007Links, InlineResponse200Errors) {
  'use strict';




  /**
   * The UserRatingsData model module.
   * @module model/UserRatingsData
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UserRatingsData</code>.
   * @alias module:model/UserRatingsData
   * @class
   */
  var exports = function() {
    var _this = this;




  };

  /**
   * Constructs a <code>UserRatingsData</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UserRatingsData} obj Optional instance to populate.
   * @return {module:model/UserRatingsData} The populated <code>UserRatingsData</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20015Data]);
      }
      if (data.hasOwnProperty('errors')) {
        obj['errors'] = InlineResponse200Errors.constructFromObject(data['errors']);
      }
      if (data.hasOwnProperty('links')) {
        obj['links'] = InlineResponse2007Links.constructFromObject(data['links']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20015Data>} data
   */
  exports.prototype['data'] = undefined;
  /**
   * @member {module:model/InlineResponse200Errors} errors
   */
  exports.prototype['errors'] = undefined;
  /**
   * @member {module:model/InlineResponse2007Links} links
   */
  exports.prototype['links'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20015Data":39,"./InlineResponse2007Links":51,"./InlineResponse200Errors":56}],91:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/InlineResponse20015Data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./InlineResponse20015Data'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UserRatingsDataNoLinks = factory(root.TheTvdbApiV2.ApiClient, root.TheTvdbApiV2.InlineResponse20015Data);
  }
}(this, function(ApiClient, InlineResponse20015Data) {
  'use strict';




  /**
   * The UserRatingsDataNoLinks model module.
   * @module model/UserRatingsDataNoLinks
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UserRatingsDataNoLinks</code>.
   * @alias module:model/UserRatingsDataNoLinks
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>UserRatingsDataNoLinks</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UserRatingsDataNoLinks} obj Optional instance to populate.
   * @return {module:model/UserRatingsDataNoLinks} The populated <code>UserRatingsDataNoLinks</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], [InlineResponse20015Data]);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<module:model/InlineResponse20015Data>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8,"./InlineResponse20015Data":39}],92:[function(require,module,exports){
/**
 * TheTVDB API v2
 * API v2 targets v1 functionality with a few minor additions. The API is accessible via https://api.thetvdb.com and provides the following REST endpoints in JSON format.   How to use this API documentation ----------------   You may browse the API routes without authentication, but if you wish to send requests to the API and see response data, then you must authenticate. 1. Obtain a JWT token by `POST`ing  to the `/login` route in the `Authentication` section with your API key and credentials. 1. Paste the JWT token from the response into the \"JWT Token\" field at the top of the page and click the 'Add Token' button.   You will now be able to use the remaining routes to send requests to the API and get a response.   Language Selection ----------------   Language selection is done via the `Accept-Language` header. At the moment, you may only pass one language abbreviation in the header at a time. Valid language abbreviations can be found at the `/languages` route..   Authentication ----------------   Authentication to use the API is similar to the How-to section above. Users must `POST` to the `/login` route with their API key and credentials in the following format in order to obtain a JWT token.  `{\"apikey\":\"APIKEY\",\"username\":\"USERNAME\",\"userkey\":\"USERKEY\"}`  Note that the username and key are ONLY required for the `/user` routes. The user's key is labled `Account Identifier` in the account section of the main site. The token is then used in all subsequent requests by providing it in the `Authorization` header. The header will look like: `Authorization: Bearer <yourJWTtoken>`. Currently, the token expires after 24 hours. You can `GET` the `/refresh_token` route to extend that expiration date.   Versioning ----------------   You may request a different version of the API by including an `Accept` header in your request with the following format: `Accept:application/vnd.thetvdb.v$VERSION`. This documentation automatically uses the version seen at the top and bottom of the page.
 *
 * OpenAPI spec version: 2.1.2
 *
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'));
  } else {
    // Browser globals (root is window)
    if (!root.TheTvdbApiV2) {
      root.TheTvdbApiV2 = {};
    }
    root.TheTvdbApiV2.UserRatingsQueryParams = factory(root.TheTvdbApiV2.ApiClient);
  }
}(this, function(ApiClient) {
  'use strict';




  /**
   * The UserRatingsQueryParams model module.
   * @module model/UserRatingsQueryParams
   * @version 2.1.2
   */

  /**
   * Constructs a new <code>UserRatingsQueryParams</code>.
   * @alias module:model/UserRatingsQueryParams
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>UserRatingsQueryParams</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/UserRatingsQueryParams} obj Optional instance to populate.
   * @return {module:model/UserRatingsQueryParams} The populated <code>UserRatingsQueryParams</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = ApiClient.convertToType(data['data'], ['String']);
      }
    }
    return obj;
  }

  /**
   * @member {Array.<String>} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));



},{"../ApiClient":8}]},{},[16])
//# sourceMappingURL=bundle.map.js
