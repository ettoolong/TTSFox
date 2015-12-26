self.port.on("prefsChange", function (ttsPrefs) {
  document.body.setAttribute('ttsprefs', JSON.stringify(ttsPrefs));

  //

});

var synth = window.speechSynthesis;
var voices = synth.getVoices();
self.port.emit("gotVoiceList", voices);
