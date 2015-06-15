var fs = require('fs');
var _ = require('lodash');
var MultiFormatReader = require('../zxing/MultiFormatReader');
var PDF417Reader = require('../zxing/pdf417/PDF417Reader');
var DecodeHintType = require('../zxing/DecodeHintType');
var HashTable = require('../zxing/common/flexdatatypes/HashTable');
var ResultParser = require('../zxing/client/result/ResultParser');
var BufferedImageLuminanceSource = require('../zxing/BufferedImageLuminanceSource');
var BinaryBitmap = require('../zxing/BinaryBitmap');
var HybridBinarizer = require('../zxing/common/HybridBinarizer');
var BarcodeFormat = require('../zxing/BarcodeFormat');

var getPixels = require('get-pixels');

getPixels('pdf417-1.png', function(err, pixels) {
  if (err) {
    console.error(error);
    return false;
  }
  var width = pixels.shape[0];
  var height = pixels.shape[1];
  var bmd = _.values(pixels.data);

  decodeBitmapData(bmd, width, height);
});

function decodeBitmapData(bmpd, width, height, appendOutput) {
  var lsource = new BufferedImageLuminanceSource(bmpd);
  var bitmap = new BinaryBitmap(new HybridBinarizer(lsource));
  var ht = getAllHints();

  //var reader = new MultiFormatReader();
  var reader = new PDF417Reader();
  var res = reader.decode(bitmap, ht);

  console.log('result', res);

  if (res == null) {
    console.log('Could not get data');
  } else {
    var parsedResult = ResultParser.parseResult(res);
    console.log(parsedResult.getDisplayResult());
  }

  function getAllHints() {
    var ht = new HashTable();
    ht.Add(DecodeHintType.POSSIBLE_FORMATS,BarcodeFormat.PDF417);
    //ht.Add(DecodeHintType.TRY_HARDER,true);
    return ht;
  }
}
