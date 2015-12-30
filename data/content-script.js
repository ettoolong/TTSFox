self.port.on('prefsChange', function (ttsPrefs) {
  document.body.setAttribute('ttsprefs', JSON.stringify(ttsPrefs));
});

if(window.speechSynthesis) {
  var voices = window.speechSynthesis.getVoices();
  self.port.emit('gotVoiceList', voices);
}
