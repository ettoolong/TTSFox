self.port.on("prefsChange", function (ttsPrefs) {
  document.body.setAttribute('ttsprefs', JSON.stringify(ttsPrefs));
});
