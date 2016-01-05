self.port.on('prefsChange', function (preferences) {
  unsafeWindow.ttsprefs = cloneInto(preferences, unsafeWindow);
});

// self.port.on('detach', function() {
// });

if(unsafeWindow.speechSynthesis) {
  var voices = unsafeWindow.speechSynthesis.getVoices();
  self.port.emit('gotVoiceList', voices);
}
