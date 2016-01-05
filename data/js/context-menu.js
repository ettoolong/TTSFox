var ttsfox = {
  ttsprefs: {lang: 0, pitch: 2, rate: 4, volume: 10}, //initian all preferences to default value
  prefsMapping: {
    lang: ['en-US', 'fr-FR', 'ja-JP', 'ko-KR', 'zh-TW', 'zh-CN'],
    pitch: [0, 0.5, 1.0, 1.5, 2.0],
    rate: [0.1, 0.125, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 10.0],
    volume: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    //voice: [] base on system
  },
  speech: function(text) {
    if(unsafeWindow.speechSynthesis){
      var u = new unsafeWindow.SpeechSynthesisUtterance(text);
      u.lang   = this.prefsMapping.lang[this.ttsprefs.lang];
      u.pitch  = this.prefsMapping.pitch[this.ttsprefs.pitch];
      u.rate   = this.prefsMapping.rate[this.ttsprefs.rate];
      u.volume = this.prefsMapping.volume[this.ttsprefs.volume];
      unsafeWindow.speechSynthesis.speak(u);
    }
  }
};

self.on('click', function(){
  ttsfox.ttsprefs = unsafeWindow.ttsprefs;
  var text = unsafeWindow.getSelection().toString();
  ttsfox.speech(text);
});
