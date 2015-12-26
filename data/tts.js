self.on("click", function(){
  var mapping = {
    lang: ['en-US', 'zh-TW'],
    pitch: [0, 0.5, 1.0, 1.5, 2.0],
    rate: [0.1, 0.125, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 10.0],
    volume: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    //voice: [] base on system
  };
  var ttsprefs = {lang: 0, pitch: 2, rate: 4, volume: 10}; //initian all preferences to default value
  var ttsprefsStr = document.body.getAttribute('ttsprefs');
  if(ttsprefsStr) {
    ttsprefs = JSON.parse(ttsprefsStr);
  }
  var text = window.getSelection().toString();
  var u = new SpeechSynthesisUtterance(text);
  u.lang   = mapping.lang[ttsprefs.lang];
  u.pitch  = mapping.pitch[ttsprefs.pitch];
  u.rate   = mapping.rate[ttsprefs.rate];
  u.volume = mapping.volume[ttsprefs.volume];
  speechSynthesis.speak(u);
});
