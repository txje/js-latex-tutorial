function load(fname) {
  $.get(fname, function(data) {
    $("#tex").text(data);
  });
}

function status(s) {
  $("#status").text(s);
}

$(function() {

  load("sample0.tex");

  $("#compile").click(function() {
    var pdftex = new PDFTeX();
    var latex_code = $("#tex").val(); 

    status("Thinking...");

    // register images
    pdftex.FS_createPath('/', 'images', /*canRead=*/true, /*canWrite=*/true).then(function() {

      pdftex.FS_createLazyFile('/images', 'fancy_figure.png', window.location.pathname + 'images/fancy_figure.png', /*canRead=*/true, /*canWrite=*/true).then(function() {

        pdftex.compile(latex_code).then(function(pdf_dataurl) {

          //window.open(pdf_dataurl) 

          var rawdata = base64toUint8(pdf_dataurl.substring(pdf_dataurl.indexOf(',') + 1));

          // disabling workers avoids x-ref origin issues, which we don't have
          PDFJS.disableWorker = false;

          // Asynchronous download PDF as an ArrayBuffer
          PDFJS.getDocument(rawdata).then(function getPdfHelloWorld(pdf) {
            pdf.getPage(1).then(function getPageHelloWorld(page) {
              renderPage(page);
            });

            status("");
          });
        });
      });
    });
  });

});

function renderPage(page) {
  var viewport = page.getViewport(1);
  var $canvas = $("<canvas></canvas>");

  //Set the canvas height and width to the height and width of the viewport
  var canvas = $canvas.get(0);
  var context = canvas.getContext("2d");
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  //Append the canvas to the pdf container div
  var $pdfContainer = $("#pdf_container");
  $pdfContainer.css("height", canvas.height + "px").css("width", canvas.width + "px");
  $pdfContainer.append($canvas);

  //The following few lines of code set up scaling on the context if we are on a HiDPI display
  var outputScale = getOutputScale();
  if (outputScale.scaled) {
      var cssScale = 'scale(' + (1 / outputScale.sx) + ', ' + (1 / outputScale.sy) + ')';
      CustomStyle.setProp('transform', canvas, cssScale);
      CustomStyle.setProp('transformOrigin', canvas, '0% 0%');

      if ($textLayerDiv.get(0)) {
          CustomStyle.setProp('transform', $textLayerDiv.get(0), cssScale);
          CustomStyle.setProp('transformOrigin', $textLayerDiv.get(0), '0% 0%');
      }
  }

  context._scaleX = outputScale.sx;
  context._scaleY = outputScale.sy;
  if (outputScale.scaled) {
      context.scale(outputScale.sx, outputScale.sy);
  }

  var canvasOffset = $canvas.offset();
  var $textLayerDiv = $("<div />")
      .addClass("textLayer")
      .css("height", viewport.height + "px")
      .css("width", viewport.width + "px")
      .offset({
          top: canvasOffset.top,
          left: canvasOffset.left
      });

  //Append the text-layer div to the DOM as a child of the PDF container div.
  $pdfContainer.append($textLayerDiv);

  page.getTextContent().then(function (textContent) {
      var textLayer = new TextLayerBuilder($textLayerDiv.get(0));
      textLayer.setTextContent({bidiTexts: textContent});

      var renderContext = {
          canvasContext: context,
          viewport: viewport,
          textLayer: textLayer
      };

      page.render(renderContext);

      // actually do it
      textLayer.beginLayout();
      textLayer.renderLayer();
      textLayer.endLayout();
  });
}

function base64toUint8(b64) {
  uint8 = new Uint8Array(atob(b64).split("").map(function(c) {
    return c.charCodeAt(0);
  }));
  return uint8;
}
