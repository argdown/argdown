import { saveAs } from "file-saver";

// Edge Blob polyfill https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
    value: function (callback, type, quality) {
      var canvas = this;
      setTimeout(function () {
        var binStr = atob(canvas.toDataURL(type, quality).split(",")[1]);
        var len = binStr.length;
        var arr = new Uint8Array(len);

        for (var i = 0; i < len; i++) {
          arr[i] = binStr.charCodeAt(i);
        }

        callback(new Blob([arr], { type: type || "image/png" }));
      });
    },
  });
}

function getSvgString(el, width, height, scale) {
  var source = new XMLSerializer().serializeToString(el);

  source = source.replace(/(\w+)?:?xlink=/g, "xmlns:xlink="); // Fix root xlink without namespace
  source = source.replace(/NS\d+:href/g, "xlink:href"); // Safari NS namespace fix

  // add name spaces.
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(
      /^<svg/,
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"',
    );
  }

  // add preserverAspectRatio="xMinYMin meet"
  // add viewBox="0 0 500 500"
  // set explicit size
  source = source.replace(/width="100%"/, 'width="' + width * scale + 'px"');
  source = source.replace(
    /height="100%"/,
    'height="' +
      height * scale +
      'px" viewBox="0 0 ' +
      width +
      " " +
      height +
      '" preserveAspectRatio="xMinYMin meet"',
  );

  // add xml declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  return source;
}

function svgString2Image(svgString, width, height, callback) {
  // Try using Blob and ObjectURL first (more reliable)
  try {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    const image = new Image();
    image.onload = function () {
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      
      canvas.toBlob(function (blob) {
        URL.revokeObjectURL(url); // Clean up
        if (blob) {
          const filesize = Math.round(blob.length / 1024) + " KB";
          if (callback) callback(blob, filesize);
        } else {
          console.warn('Canvas toBlob returned null, falling back to base64');
          fallbackToBase64();
        }
      });
    };
    image.onerror = function() {
      URL.revokeObjectURL(url);
      console.warn('ObjectURL failed, falling back to base64');
      fallbackToBase64();
    };
    image.src = url;
  } catch (e) {
    console.warn('Blob/ObjectURL failed, falling back to base64:', e);
    fallbackToBase64();
  }

  function fallbackToBase64() {
    const imgsrc = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    const image = new Image();
    image.onload = function () {
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob(function (blob) {
        if (blob) {
          const filesize = Math.round(blob.length / 1024) + " KB";
          if (callback) callback(blob, filesize);
        } else {
          console.error('Failed to create PNG blob');
          if (callback) callback(null);
        }
      });
    };
    image.src = imgsrc;
  }
}

export function saveAsSvg(el, isDagreSvg = false) {
  var width = el.clientWidth;
  var height = el.clientHeight;
  if (width === 0 || height === 0) {
    var box = el.getBoundingClientRect();
    width = box.right - box.left;
    height = box.bottom - box.top;
  }
  var source = getSvgString(el, width, height, 1);
  
  // Fix Dagre SVG styling and markers
  if (isDagreSvg) {
    source = source.replace(/width="100%"/g, 'width="100%"');
    source = source.replace(/height="100%"/g, 'height="100%"');
    // Add any Dagre-specific fixes here
  }
  
  var blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  saveAs(blob, "map.svg");
}

export function saveAsPng(el, scale, isDagreSvg = false) {
  var width = el.clientWidth;
  var height = el.clientHeight;
  if (width === 0 || height === 0) {
    var box = el.getBoundingClientRect();
    width = box.right - box.left;
    height = box.bottom - box.top;
  }
  var source = getSvgString(el, width, height, scale);
  
  // Fix Dagre SVG styling and markers
  if (isDagreSvg) {
    source = source.replace(/width="100%"/g, 'width="100%"');
    source = source.replace(/height="100%"/g, 'height="100%"');
    // Add any Dagre-specific fixes here
  }
  
  width *= scale;
  height *= scale;
  svgString2Image(source, width, height, function (blob) {
    if (!blob) {
      console.error('Failed to create PNG blob');
      return;
    }
    saveAs(blob, "map.png");
  });
}
