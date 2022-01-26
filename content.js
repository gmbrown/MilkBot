window.onload=function() {
  console.log("Hello from MilkBot!")
}

$(document).ready(function() {
  $("#cht_bx").bind("DOMNodeInserted", function() {
    console.log("chat box update")
  });
});
