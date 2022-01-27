window.onload=function() {
  console.log("Hello from MilkBot!")
}

handStringLogged = ""

$(document).ready(function() {
  $("#cht_bx").bind("DOMNodeInserted", function() {
      chatBoxText = $("#cht_bx").text()
      handStringIndex = chatBoxText.lastIndexOf("you were dealt")
      foldedIndex = chatBoxText.lastIndexOf("you folded")
      timedOutIndex = chatBoxText.lastIndexOf("you timed out and folded")
      foldedIndex = Math.max(foldedIndex, timedOutIndex)
      if (handStringIndex == -1 || foldedIndex > handStringIndex) {
        handString = "None"
      }
      else {
        handString = chatBoxText.substring(handStringIndex + 14, handStringIndex+ 21)
    }
    if (handStringLogged != handString) {
      console.log(handString)
      handStringLogged = handString
    }
 });
});
