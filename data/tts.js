self.on("click", function(){
  var text = window.getSelection().toString();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  speechSynthesis.speak(u);
});
