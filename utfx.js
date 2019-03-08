/**
 * utfx namespace.
//? if (UTFX_STANDALONE)
 * @exports utfx
//? else
 * @inner
 * @type {!Object.<string,*>}
 */
var utfx = {};

/**
 * Maximum valid code point.
 * @type {number}
 * @const
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.MAX_CODEPOINT = 0x10FFFF;

/**
 * Encodes UTF8 code points to UTF8 bytes.
 * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
 *  respectively `null` if there are no more code points left or a single numeric code point.
 * @param {!function(number)} dst Bytes destination as a function successively called with the next byte
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.encodeUTF8 = function(src, dst) {
    var cp = null;
    if (typeof src === 'number')
        cp = src,
        src = function() { return null; };
    while (cp !== null || (cp = src()) !== null) {
        if (cp < 0x80)
            dst(cp&0x7F);
        else if (cp < 0x800)
            dst(((cp>>6)&0x1F)|0xC0),
            dst((cp&0x3F)|0x80);
        else if (cp < 0x10000)
            dst(((cp>>12)&0x0F)|0xE0),
            dst(((cp>>6)&0x3F)|0x80),
            dst((cp&0x3F)|0x80);
        else 
            dst(((cp>>18)&0x07)|0xF0),
            dst(((cp>>12)&0x3F)|0x80),
            dst(((cp>>6)&0x3F)|0x80),
            dst((cp&0x3F)|0x80);
        cp = null;
    }
};

/**
 * Decodes UTF8 bytes to UTF8 code points.
 * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
 *  are no more bytes left.
 * @param {!function(number)} dst Code points destination as a function successively called with each decoded code point.
 * @throws {RangeError} If a starting byte is invalid in UTF8
 * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the
 *  remaining bytes.
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.decodeUTF8 = function(src, dst) {
    var a, b, c, d, fail = function(b) {
        b = b.slice(0, b.indexOf(null));
        var err = Error(b.toString());
        err.name = "TruncatedError";
        err['bytes'] = b;
        throw err;
    };
    while ((a = src()) !== null) {
        if ((a&0x80) === 0)
            dst(a);
        else if ((a&0xE0) === 0xC0)
            ((b = src()) === null) && fail([a, b]),
            dst(((a&0x1F)<<6) | (b&0x3F));
        else if ((a&0xF0) === 0xE0)
            ((b=src()) === null || (c=src()) === null) && fail([a, b, c]),
            dst(((a&0x0F)<<12) | ((b&0x3F)<<6) | (c&0x3F));
        else if ((a&0xF8) === 0xF0)
            ((b=src()) === null || (c=src()) === null || (d=src()) === null) && fail([a, b, c ,d]),
            dst(((a&0x07)<<18) | ((b&0x3F)<<12) | ((c&0x3F)<<6) | (d&0x3F));
        else throw RangeError("Illegal starting byte: "+a);
    }
};

/**
 * Converts UTF16 characters to UTF8 code points.
 * @param {!function():number|null} src Characters source as a function returning the next char code respectively
 *  `null` if there are no more characters left.
 * @param {!function(number)} dst Code points destination as a function successively called with each converted code
 *  point.
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.UTF16toUTF8 = function(src, dst) {
    var c1, c2 = null;
    while (true) {
        if ((c1 = c2 !== null ? c2 : src()) === null)
            break;
        if (c1 >= 0xD800 && c1 <= 0xDFFF) {
            if ((c2 = src()) !== null) {
                if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
                    dst((c1-0xD800)*0x400+c2-0xDC00+0x10000);
                    c2 = null; continue;
                }
            }
        }
        dst(c1);
    }
    if (c2 !== null) dst(c2);
};

/**
 * Converts UTF8 code points to UTF16 characters.
 * @param {(!function():number|null) | number} src Code points source, either as a function returning the next code point
 *  respectively `null` if there are no more code points left or a single numeric code point.
 * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
 * @throws {RangeError} If a code point is out of range
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.UTF8toUTF16 = function(src, dst) {
    var cp = null;
    if (typeof src === 'number')
        cp = src, src = function() { return null; };
    while (cp !== null || (cp = src()) !== null) {
        if (cp <= 0xFFFF)
            dst(cp);
        else
            cp -= 0x10000,
            dst((cp>>10)+0xD800),
            dst((cp%0x400)+0xDC00);
        cp = null;
    }
};

/**
 * Converts and encodes UTF16 characters to UTF8 bytes.
 * @param {!function():number|null} src Characters source as a function returning the next char code respectively `null`
 *  if there are no more characters left.
 * @param {!function(number)} dst Bytes destination as a function successively called with the next byte.
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.encodeUTF16toUTF8 = function(src, dst) {
    utfx.UTF16toUTF8(src, function(cp) {
        utfx.encodeUTF8(cp, dst);
    });
};

/**
 * Decodes and converts UTF8 bytes to UTF16 characters.
 * @param {!function():number|null} src Bytes source as a function returning the next byte respectively `null` if there
 *  are no more bytes left.
 * @param {!function(number)} dst Characters destination as a function successively called with each converted char code.
 * @throws {RangeError} If a starting byte is invalid in UTF8
 * @throws {Error} If the last sequence is truncated. Has an array property `bytes` holding the remaining bytes.
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.decodeUTF8toUTF16 = function(src, dst) {
    utfx.decodeUTF8(src, function(cp) {
        utfx.UTF8toUTF16(cp, dst);
    });
};

/**
 * Calculates the byte length of an UTF8 code point.
 * @param {number} cp UTF8 code point
 * @returns {number} Byte length
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.calculateCodePoint = function(cp) {
    return (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
};

/**
 * Calculates the number of UTF8 bytes required to store UTF8 code points.
 * @param {(!function():number|null)} src Code points source as a function returning the next code point respectively
 *  `null` if there are no more code points left.
 * @returns {number} The number of UTF8 bytes required
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.calculateUTF8 = function(src) {
    var cp, l=0;
    while ((cp = src()) !== null)
        l += (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
    return l;
};

/**
 * Calculates the number of UTF8 code points respectively UTF8 bytes required to store UTF16 char codes.
 * @param {(!function():number|null)} src Characters source as a function returning the next char code respectively
 *  `null` if there are no more characters left.
 * @returns {!Array.<number>} The number of UTF8 code points at index 0 and the number of UTF8 bytes required at index 1.
 //? if (UTFX_STANDALONE)
 * @expose
 */
utfx.calculateUTF16asUTF8 = function(src) {
    var n=0, l=0;
    utfx.UTF16toUTF8(src, function(cp) {

        ++n; l += (cp < 0x80) ? 1 : (cp < 0x800) ? 2 : (cp < 0x10000) ? 3 : 4;
    });
    return [n,l];
};
// 二进制转字符串
utfx.parseMessage = function (str){
    let view = new DataView(str);
    let Strlength = view.getUint32(0);
    let	offset = 4;
    let result = []; // Unicode编码字符
    let end = offset + Strlength;
    utfx.decodeUTF8toUTF16(function () {
        return offset < end ? view.getUint8(offset++) : null; // 返回null时会退出此转换函数
    }.bind(this), (char) => {
        result.push(char);
    });

    let strResult = result.reduce((prev, next)=>{
        return prev + String.fromCharCode(next);
    }, '');
    return strResult;
};

// 字符串转二进制
utfx.abcd = function (str){
    function stringSource(s) {
        var i = 0;
        return function () {
            return i < s.length ? s.charCodeAt(i++) : null;
        };
    }
    let strCodes = stringSource(str);
    let length = utfx.calculateUTF16asUTF8(strCodes)[1];
    let buffer = new ArrayBuffer(length + 4); // 初始化长度为UTF8编码后字符串长度+4个Byte的二进制缓冲区
    let view = new DataView(buffer);
    let offset = 4;
    view.setUint32(0, length); // 将长度放置在字符串的头部
    utfx.encodeUTF16toUTF8(stringSource(str), function (b) {
        view.setUint8(offset++, b);
    }.bind(this));
    return view;
};
//字节长度计算
utfx.getBytes = function (Wnum,str,Bnum){
    let newBushu = []
    let newStr;
    if(str.length < Wnum){   // 如果字符的长度小于  定义的位数
        for(let i = 0 ; i < Wnum-str.length; i++){    // 定义的位数 - 字符的长度  来补0
            newBushu.push(Bnum)
        }
        newStr = newBushu.join('')+str
    }else{
        newStr = str
    }
    return newStr
};