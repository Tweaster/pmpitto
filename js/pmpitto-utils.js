"use strict";

var app_id = "org.projectfurnace.pmpitto";


function hashCode(str) {
  var hash = 0, i, chr, len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function numberToBase64(n)
{
  var alphabet = "0123456789abcdefghijklmnopqrstuvwxyz-_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  var base = 64;
  while (n > 0)
  {
    var divResult = Math.floor(n / base);
    result += alphabet[n - divResult * base];
    n = divResult;
  }
  return result;
}

function guid() 
{
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  //return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  //return s4() + s4() + '-' + s4() + '-' + s4();
  var n = Math.floor((1 + Math.random()) * 0x100000000);
  return numberToBase64(n) + numberToBase64(Date.now());
}


function toSingleWord(multiWords)
{
  return multiWords.replace(" ", "_");
}



String.format = function() {
  var s = arguments[0];
  for (var i = 0; i < arguments.length - 1; i++) {       
    var reg = new RegExp("\\{" + i + "\\}", "gm");             
    s = s.replace(reg, arguments[i + 1]);
  }

  return s;
}



function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}



function percentageAsString(currentValue, maxValue)
{
  var result = Math.floor(currentValue * 100.0 / (maxValue < 1.0 ? 1.0 : maxValue));
  return result.toString() + '%';
}


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#FF';
    for (var i = 0; i < 4; i++ ) {
        color += letters[Math.floor(Math.random() * 10)];
    }

    return color;
}





function doubleDigitPrecision(n)
{
  return Math.floor(n * 100.0) / 100.0;
}


function dateAsString(date)
{
  return (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + '/' + date.getFullYear().toString();
}


function dateAsIndex(date)
{
  var tmp = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - tmp.getTime()) / 86400000);
}


/*************** COMPRESSION *************/


function encodeData(data)
{
  var data_raw = JSON.stringify(data);

  var huffman = Huffman.treeFromText(data_raw); // generate the tree
  var treeEncoded = huffman.encodeTree(); // will return an javascript array with tree representation
  
  var treeJSON = JSON.stringify(treeEncoded); // get a JSON string for easy transportation 

  var encoded_data = huffman.encode(data_raw);

  var t = treeJSON.replace("'", "\'");
  var d = encoded_data.replace("'", "\'");

  return JSON.stringify( { t : t, d :  d});
  //return JSON.stringify( { t : treeJSON, d :  encoded_data});
}

function decodeData(raw_data)
{

  var data = JSON.parse(raw_data);
  {
    if (data != null && typeof(data) != "undefined" && data.t != null && typeof(data.t) != "undefined" && data.d != null && typeof(data.d) != "undefined")
    {
      var t = data.t.replace("\'", "'");
      var d = data.d.replace("\'", "'");


      var tree = Huffman.Tree.decodeTree(JSON.parse(t)); // restore the tree based on array representation
      var d_data = tree.decode(d);
      return JSON.parse(d_data);

      //var tree = Huffman.Tree.decodeTree(data.t); // restore the tree based on array representation
      //var d_data = tree.decode(data.d);
      //return JSON.parse(d_data);
    }
  }
  return null;
}
