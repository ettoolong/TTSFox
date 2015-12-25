self.on("click", function(){
  var ttsprefs = {speechLanguage: 'en-US'};
  var ttsprefsStr = document.body.getAttribute('ttsprefs');
  if(ttsprefsStr) {
    ttsprefs = JSON.parse(ttsprefsStr);
  }
  var text = window.getSelection().toString();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = ttsprefs.speechLanguage;
  speechSynthesis.speak(u);
});
