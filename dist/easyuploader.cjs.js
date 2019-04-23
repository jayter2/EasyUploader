/*
 * EasyUploader v0.0.8
 * (c) 2018-2019 shinn_lancelot
 * Released under the MIT License.
 */
'use strict';

/**
 * The default options file.
 * el: Bind to the element node.
 * name: The input element name which is created.
 * id: The input element id which is created.
 * accept: The input element accept which is created.
 * file: Bind to the input(type=file).
 * method: The http request type.
 * url: The file upload URL.
 * resType: The return type of the file after uploading.
 * autoUpload: Whether the file is automatically uploaded after selecting it.
 * maxFileSize: Maximum file size allowed to upload.
 * tipClass: The class of tip element node.
 * autoDrag: Whether drag upload is allowed.
 * fixOrientation: Whether to automatically correct the orientation of uploading photos.
 * allowFileExt: File extensions that allow uploading.
 * language: The tip info language.
 * compress: Whether to compress or not.
 * resize: Redefine the maxWidth and maxHeight.
 * compressQuality: The picture compression quality.
 */
var defaultOptions = {
  'el': '',
  'name': 'file',
  'id': '',
  'accept': '',
  'file': '#file',
  'method': 'post',
  'url': '',
  'resType': 'json',
  'autoUpload': true,
  'maxFileSize': '2M',
  'tipClass': '',
  'allowDrag': false,
  'clip': false,
  'fixOrientation': true,
  'allowFileExt': [],
  'language': 'en',
  'compress': true,
  'resize': {
    'maxWidth': 800,
    'maxHeight': 800
  },
  'compressQuality': 0.92
};

/**
 * The tip infos config file.
 */
var tipInfos = {
  'en': {
    'noFile': 'Please choose the file first.',
    'fileTooLarge': 'The file is too Large. The maxFileSize is {0}.',
    'fileExtNotAllow': 'The file extension is not allowed to upload. Please upload the {0} file.'
  },
  'cn': {
    'noFile': '请先选择文件',
    'fileTooLarge': '文件太大，最大允许为{0}',
    'fileExtNotAllow': '文件扩展名不允许上传，请上传{0}格式的文件'
  }
};

/**
 * Common static function class.
 */
var defaultExport = function defaultExport () {};

defaultExport.extend = function extend (obj, newObj) {
  for (var key in newObj) {
    if (!(key in obj)) {
      obj[key] = newObj[key];
    } else if (obj[key].constructor === newObj[key].constructor) {
      if (obj[key].constructor === Object) {
        var childObj = obj[key];

        var childNewObj = newObj[key];
        for (var k in childNewObj) {
          childObj[k] = childNewObj[k];
        }
        obj[key] = childObj;
      } else {
        obj[key] = newObj[key];
      }
    }
  }
  return obj
};

/**
   * Converts base64 to ArrayBuffer.
   * @param {*} base64 The file's base64.
   */
defaultExport.base64ToArrayBuffer = function base64ToArrayBuffer (base64) {
  base64 = base64.replace(/^data:([^;]+);base64,/gim, '');
  var binary = atob(base64);

  var length = binary.length;

  var buffer = new ArrayBuffer(length);

  var view = new Uint8Array(buffer);
  for (var i = 0; i < length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer
};

/**
   * Get the jpg file's orientation.
   * @param {*} arrayBuffer The jpg file's arrayBuffer.
   */
defaultExport.getOrientation = function getOrientation (arrayBuffer) {
  var dataView = new DataView(arrayBuffer);

  var length = dataView.byteLength;

  var orientation;

  var exifIDCode;

  var tiffOffset;

  var firstIFDOffset;

  var littleEndian;

  var endianness;

  var app1Start;

  var ifdStart;

  var offset;

  var i;

  if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
    offset = 2;
    while (offset < length) {
      if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
        app1Start = offset;
        break
      }
      offset++;
    }
  }
  if (app1Start) {
    exifIDCode = app1Start + 4;
    tiffOffset = app1Start + 10;
    if (this.getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
      endianness = dataView.getUint16(tiffOffset);
      littleEndian = endianness === 0x4949;
      if (littleEndian || endianness === 0x4D4D) {
        if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
          firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
          if (firstIFDOffset >= 0x00000008) {
            ifdStart = tiffOffset + firstIFDOffset;
          }
        }
      }
    }
  }
  if (ifdStart) {
    length = dataView.getUint16(ifdStart, littleEndian);
    for (i = 0; i < length; i++) {
      offset = ifdStart + i * 12 + 2;
      if (dataView.getUint16(offset, littleEndian) === 0x0112) {
        offset += 8;
        orientation = dataView.getUint16(offset, littleEndian);
        if (navigator.userAgent.indexOf('Safari') > -1) {
          dataView.setUint16(offset, 1, littleEndian);
        }
        break
      }
    }
  }
  return orientation
};

/**
   * Unicode to string.
   * @param {*} dataView
   * @param {*} start
   * @param {*} length
   */
defaultExport.getStringFromCharCode = function getStringFromCharCode (dataView, start, length) {
  var string = '';

  var i;
  for (i = start, length += start; i < length; i++) {
    string += String.fromCharCode(dataView.getUint8(i));
  }
  return string
};

/**
   * Get the random nonce.
   * @param {*} length The nonce length.
   */
defaultExport.getNonce = function getNonce (length) {
    if ( length === void 0 ) length = 16;

  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';

  var nonce = '';
  for (var i = 0; i < length; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce
};

/**
   * Replace the string's placeholder.
   * @param {*} str The string.
   * @param {*} arr The new string array.
   */
defaultExport.replacePlaceholders = function replacePlaceholders (str, arr) {
    if ( str === void 0 ) str = '';
    if ( arr === void 0 ) arr = [];

  for (var i = 0; i < arr.length; i++) {
    str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), arr[i]);
  }
  return str
};

/**
   * Handle the result.
   * @param {*} res The result data.
   * @param {*} type Handle type. json | text
   */
defaultExport.handleRes = function handleRes (res, type) {
  if (type === 'json') {
    return JSON.parse(res)
  } else if (type === 'text') {
    return res
  } else {
    return res
  }
};

/**
 * Replace eval function.
 */
defaultExport.evil = function evil (fn) {
  var Fn = Function;
  return new Fn('return ' + fn)()
};

if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function (callback, type, quality) {
      var binStr = atob(this.toDataURL(type, quality).split(',')[1]);

      var len = binStr.length;

      var arr = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        arr[i] = binStr.charCodeAt(i);
      }
      callback(new Blob([arr], { type: type || 'image/png' }));
    }
  });
}

var EasyUploader = function EasyUploader (options) {
  if ( options === void 0 ) options = {};

  if (!(this instanceof EasyUploader)) {
    return new EasyUploader(options)
  }

  // The common params.
  this.fileObj = '';
  this.elObj = '';
  this.fileType = '';
  this.fileName = '';
  this.fileSize = '';
  this.fileExt = '';
  this.fileObjClickStatus = true;
  this.canvas = document.createElement('canvas');
  this.context = this.canvas.getContext('2d');
  this.formData = new FormData();
  this.tips = {};

  // Extend config options.
  this.options = defaultExport.extend(JSON.parse(JSON.stringify(defaultOptions)), options);
  // Init function.
  this.init();
};

/**
 * Init function.
 */
EasyUploader.prototype.init = function init () {
  var _tipInfos = JSON.parse(JSON.stringify(tipInfos));
  this.tips = _tipInfos.hasOwnProperty(this.options.language) ? _tipInfos[this.options.language] : _tipInfos['en'];

  if (this.options.el) {
    this.elObj = document.querySelector(this.options.el);
    this.createInput();
    this.bindElToInput();
    this.options.allowDrag && this.listenDrag(this.elObj);
  } else {
    this.fileObj = document.querySelector(this.options.file);
    this.options.allowDrag && this.listenDrag(this.fileObj);
  }

  this.listenFileObjClick();
  this.listenFileObjChange();
};

/**
 * Create the input(type=file).
 */
EasyUploader.prototype.createInput = function createInput () {
  this.options.id || (this.options.id = 'easyuploader_' + defaultExport.getNonce());
  var input = document.createElement('input');
  input.type = 'file';
  input.name = this.options.name;
  input.id = this.options.id;
  input.accept = this.options.accept;
  input.setAttribute('style', 'display: none !important;');
  this.elObj.parentNode.insertBefore(input, this.elObj.nextElementSibling);
  this.fileObj = document.querySelector('#' + this.options.id);
};

/**
 * Bind fileObj click event to elObj click event.
 */
EasyUploader.prototype.bindElToInput = function bindElToInput () {
  var _this = this;
  _this.elObj.addEventListener('click', function (e) {
    e.preventDefault();
    _this.fileObj.click();
  });
};

/**
 * Enable fileObj click event.
 */
EasyUploader.prototype.enableFileObjClick = function enableFileObjClick () {
  this.fileObjClickStatus = true;
};

/**
 * Disable fileObj click event.
 */
EasyUploader.prototype.disableFileObjClick = function disableFileObjClick () {
  this.fileObjClickStatus = false;
};

/**
 * Listen fileObj click event.
 */
EasyUploader.prototype.listenFileObjClick = function listenFileObjClick () {
  var _this = this;
  _this.fileObj.addEventListener('click', function (e) {
    _this.fileObjClickStatus || e.preventDefault();
  });
};

/**
 * Listen fileObj change event.
 */
EasyUploader.prototype.listenFileObjChange = function listenFileObjChange () {
  var _this = this;
  _this.fileObj.addEventListener('change', function () {
    _this.fileType = _this.fileObj.files[0].type;
    _this.fileName = _this.fileObj.files[0].name;
    _this.fileExt = _this.fileName.split('.').pop().toLowerCase();
    _this.fileSize = _this.fileObj.files[0].size;
    if (_this.checkFile()) {
      if (_this.needCanvas()) {
        _this.drawAndRenderCanvas();
      } else {
        _this.options.autoUpload && _this.uploadFile(_this.fileObj.files[0]);
      }
    }
  });
};

/**
 * Listen drag event
 * @param {*} obj The listen obj.
 */
EasyUploader.prototype.listenDrag = function listenDrag (obj) {
  var _this = this;
  obj.addEventListener('drop', function (e) {
    e.preventDefault();
    _this.options.onDrop && _this.options.onDrop(e);
    _this.fileObj.files = e.dataTransfer.files;
  });
  obj.addEventListener('dragover', function (e) {
    e.preventDefault();
    _this.options.onDragOver && _this.options.onDragOver(e);
  });
  obj.addEventListener('dragenter', function (e) {
    e.preventDefault();
    _this.options.onDragEnter && _this.options.onDragEnter(e);
  });
  obj.addEventListener('dragleave', function (e) {
    e.preventDefault();
    _this.options.onDragLeave && _this.options.onDragLeave(e);
  });
};

/**
 * Draw and render canvas.
 */
EasyUploader.prototype.drawAndRenderCanvas = function drawAndRenderCanvas () {
  var _this = this;

  var reader = new FileReader();

  var image = new Image();

  var arrayBuffer = new ArrayBuffer();

  var orientation = 1;

  var width = '';

  var height = '';

  reader.readAsDataURL(_this.fileObj.files[0]);
  reader.onload = function (e) {
    arrayBuffer = defaultExport.base64ToArrayBuffer(e.target.result);
    orientation = defaultExport.getOrientation(arrayBuffer);
    image.src = e.target.result;
  };

  image.onload = function () {
    if (_this.options.compress) {
      if (image.width > _this.options.resize.maxWidth || image.height > _this.options.resize.maxHeight) {
        if (image.width > image.height) {
          width = _this.options.resize.maxWidth;
          height = (image.height / image.width) * _this.options.resize.maxWidth;
        } else {
          width = (image.width / image.height) * _this.options.resize.maxHeight;
          height = _this.options.resize.maxHeight;
        }
      } else {
        width = image.width;
        height = image.height;
      }
    } else {
      width = image.width;
      height = image.height;
      _this.options.compressQuality = 1;
    }

    if (_this.options.fixOrientation) {
      switch (orientation) {
        // 180 degree
        case 3:
          _this.canvas.width = width;
          _this.canvas.height = height;
          _this.context.rotate(180 * Math.PI / 180);
          _this.context.drawImage(image, -width, -height, width, height);
          break

        // clockwise 90 degree
        case 6:
          _this.canvas.width = height;
          _this.canvas.height = width;
          _this.context.rotate(90 * Math.PI / 180);
          _this.context.drawImage(image, 0, -height, width, height);
          break

        // clockwise 270 degree
        case 8:
          _this.canvas.width = height;
          _this.canvas.height = width;
          _this.context.rotate(270 * Math.PI / 180);
          _this.context.drawImage(image, -width, 0, width, height);
          break

        // 0 degree and default
        case 1:
        default:
          _this.canvas.width = width;
          _this.canvas.height = height;
          _this.context.drawImage(image, 0, 0, width, height);
      }
    } else {
      _this.canvas.width = width;
      _this.canvas.height = height;
      _this.context.drawImage(image, 0, 0, width, height);
    }

    _this.canvas.setAttribute('style', 'display: none !important;');
    document.querySelector('body').appendChild(_this.canvas);
    _this.options.autoUpload && _this.uploadCanvas();
  };
};

/**
 * The upload file function.
 */
EasyUploader.prototype.upload = function upload () {
  if (this.fileType.indexOf('image/') >= 0 && this.options.compress) {
    this.uploadCanvas();
  } else {
    this.uploadFile(this.fileObj.files[0]);
  }
};

/**
 * Upload the canvas picture.
 */
EasyUploader.prototype.uploadCanvas = function uploadCanvas () {
  var _this = this;

  if (!_this.fileObj.files[0]) {
    _this.renderTipDom(this.tips.noFile);
    return
  }

  _this.canvas.toBlob(function (blob) {
    _this.uploadFile(blob);
  }, _this.fileType, _this.options.compressQuality);
};

/**
 * Upload file.
 * @param {*} value The input file's value.
 */
EasyUploader.prototype.uploadFile = function uploadFile (value) {
    var this$1 = this;

  var _this = this;

  if (!_this.fileObj.files[0]) {
    _this.renderTipDom(this.tips.noFile);
    return
  }

  _this.formData.append(_this.options.name, value, _this.fileName);
  var xhr = new XMLHttpRequest();
  xhr.open(_this.options.method, _this.options.url, true);
  xhr.upload.addEventListener('progress', function (e) {
    _this.options.onUploadProgress && _this.options.onUploadProgress(e);
  });
  xhr.upload.addEventListener('loadstart', function (e) {
    _this.options.onUploadStart && _this.options.onUploadStart(e);
  });
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
        _this.options.onUploadComplete && _this.options.onUploadComplete(defaultExport.handleRes(xhr.responseText, this$1.options.resType.toLowerCase()));
      } else {
        _this.options.onUploadError && _this.options.onUploadError(xhr.status);
      }
      if (_this.needCanvas()) {
        _this.canvas.remove();
      }
      _this.fileObj.value = '';
    }
  };
  // xhr.setRequestHeader('Content-type', 'multipart/form-data');
  xhr.send(_this.formData);
};

/**
 * Render tipDom to body.
 * @param {*} text The tip text.
 */
EasyUploader.prototype.renderTipDom = function renderTipDom (text) {
  var oldTipDiv = document.getElementById('easyuploader_tipdom');
  oldTipDiv && oldTipDiv.remove();
  var tipDiv = document.createElement('div');
  tipDiv.id = 'easyuploader_tipdom';
  tipDiv.innerHTML = text;
  if (this.options.tipClass) {
    tipDiv.className = this.options.tipClass;
  } else {
    tipDiv.setAttribute('style', 'max-width: 100%;padding: 16px 20px;font-size: 14px;color: #fff;box-sizing: border-box;border-radius: 2px;filter: Alpha(opacity=80);opacity: 0.8;-moz-opacity: 0.8;user-select: none;position: fixed;top: 50%;left: 50%;z-index: 100000;transform: translate(-50%, -50%);-webkit-transform: translate(-50%, -50%);text-align: center;background: #000;word-wrap: break-word;word-break: break-all;');
  }
  document.querySelector('body').appendChild(tipDiv);
  setTimeout(function () {
    var opacity = tipDiv.style.opacity;
    if (opacity > 0) {
      opacity = (opacity - 0.2).toFixed(1);
      if (opacity < 0) {
        opacity = 0;
      }
      var hideTip = setInterval(function () {
        tipDiv.style.opacity = opacity;
        tipDiv.style.filter = 'Alpha((opacity = ' + opacity * 100 + '))';
        if (opacity <= 0) {
          tipDiv.remove();
          clearInterval(hideTip);
        } else {
          opacity = (opacity - 0.1).toFixed(1);
          if (opacity < 0) {
            opacity = 0;
          }
        }
      }, 10);
    } else {
      tipDiv.remove();
    }
  }, 1500);
};

/**
 * Check the file,such as fileType and maxFileSize.
 */
EasyUploader.prototype.checkFile = function checkFile () {
  var maxFileSize = this.options.maxFileSize;

  var maxFileSizeWithLetter = 0;

  var letterStr = '';
  if (maxFileSize.indexOf('B') > 0) {
    maxFileSize = maxFileSize.replace(/B/g, '');
    letterStr = 'B';
  }
  if (maxFileSize.indexOf('K') > 0) {
    maxFileSizeWithLetter = defaultExport.evil(maxFileSize.replace(/K/g, ''));
    maxFileSize = maxFileSizeWithLetter * 1024;
    letterStr = 'K' + letterStr;
  } else if (maxFileSize.indexOf('M') > 0) {
    maxFileSizeWithLetter = defaultExport.evil(maxFileSize.replace(/M/g, ''));
    maxFileSize = maxFileSizeWithLetter * 1024 * 1024;
    letterStr = 'M' + letterStr;
  } else if (maxFileSize.indexOf('G') > 0) {
    maxFileSizeWithLetter = defaultExport.evil(maxFileSize.replace(/G/g, ''));
    maxFileSize = maxFileSizeWithLetter * 1024 * 1024 * 1024;
    letterStr = 'G' + letterStr;
  } else if (maxFileSize.indexOf('T') > 0) {
    maxFileSizeWithLetter = defaultExport.evil(maxFileSize.replace(/T/g, ''));
    maxFileSize = maxFileSizeWithLetter * 1024 * 1024 * 1024 * 1024;
    letterStr = 'T' + letterStr;
  } else if (maxFileSize.indexOf('P') > 0) {
    maxFileSizeWithLetter = defaultExport.evil(maxFileSize.replace(/P/g, ''));
    maxFileSize = maxFileSizeWithLetter * 1024 * 1024 * 1024 * 1024 * 1024;
    letterStr = 'P' + letterStr;
  } else {
    maxFileSizeWithLetter = defaultExport.evil(maxFileSize);
    maxFileSize = maxFileSizeWithLetter;
    letterStr = 'B';
  }

  if (this.fileSize > maxFileSize) {
    this.renderTipDom(defaultExport.replacePlaceholders(
      this.tips.fileTooLarge,
      [maxFileSizeWithLetter + letterStr]
    ));
    this.fileObj.value = '';
    return false
  }

  if (this.options.allowFileExt.length > 0 && this.options.allowFileExt.indexOf(this.fileExt) === -1) {
    this.renderTipDom(defaultExport.replacePlaceholders(
      this.tips.fileExtNotAllow,
      [this.options.allowFileExt.join('，')]
    ));

    this.fileObj.value = '';
    return false
  }

  return true
};

/**
 * need to use canvas?
 */
EasyUploader.prototype.needCanvas = function needCanvas () {
  if (this.fileType.indexOf('image/') >= 0 && (this.options.compress || this.options.clip)) {
    return true
  }

  return false
};

module.exports = EasyUploader;
