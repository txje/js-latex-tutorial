function load(fname) {
  $.get(fname, function(data) {
    $("#tex").text(data);
  });
}

function status(s) {
  $("#status").text(s);
}

$(function() {

  load("overview.tex");

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
            $("#pdf_container").empty();
            console.log("pages:", pdf.numPages);
            for(var i = 1; i <= pdf.numPages; i++) {
              pdf.getPage(i).then(function getPageHelloWorld(page) {
                renderPage(page);
              });
            }

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

  var renderContext = {
      canvasContext: context,
      viewport: viewport
  };

  page.render(renderContext);
}

function base64toUint8(b64) {
  uint8 = new Uint8Array(atob(b64).split("").map(function(c) {
    return c.charCodeAt(0);
  }));
  return uint8;
}
