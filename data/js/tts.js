var ttsfox = {
  initCount: 0,
  ttsprefs: {pitch: 2, rate: 4, volume: 10}, //initian all preferences to default value
  prefsMapping: {
    pitch: [0, 0.5, 1.0, 1.5, 2.0],
    rate: [0.1, 0.125, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 10.0],
    volume: [0.01, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    //voice: [] base on system
  },
  voices: [],
  cancel: function() {
    if(window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },
  speech: function(text, setting) {
    if(window.speechSynthesis) {
      setting = setting || {};
      var u = new window.SpeechSynthesisUtterance(text);
      u.pitch  = setting.pitch || this.prefsMapping.pitch[this.ttsprefs.pitch];
      u.rate   = setting.rate || this.prefsMapping.rate[this.ttsprefs.rate];
      u.volume = setting.volume || this.prefsMapping.volume[this.ttsprefs.volume];
      u.voice  = this.voices[setting.voice];
      //u.lang   = this.voices[setting.voice].lang;

      u.onstart = function(event) {
        document.getElementById("btnSpeech").style.display = "none";
        document.getElementById("btnCancel").style.display = "inline-block";
        var speechText = document.getElementById('speechText');
        speechText.readOnly = true;
        speechText.focus();
      }
      u.onend = function(event) {
        document.getElementById("btnCancel").style.display = "none";
        document.getElementById("btnSpeech").style.display = "inline-block";
        var speechText = document.getElementById('speechText');
        speechText.setSelectionRange(0, 0);
        speechText.readOnly = false;
      }
      u.onboundary = function(event) {
        if(setting.highlight) {
          var speechText = document.getElementById("speechText");
          var text = speechText.value;
          var tmpText = text.substring(event.charIndex);
          var nextSpace = tmpText.search("[ ,.;]");
          //var nextSpace = text.indexOf(' ', event.charIndex);
          if(nextSpace === -1) {
            nextSpace = text.length;
          }
          else {
            nextSpace = event.charIndex + nextSpace;
          }
          speechText.setSelectionRange(event.charIndex, nextSpace);
        }
      }
      window.speechSynthesis.speak(u);
    }
  }
};

function speech() {
  if(ttsfox.voices && ttsfox.voices.length) {
    var setting =  {
      voice: document.getElementById("input_voice").selectedIndex,
      pitch: ttsfox.prefsMapping.pitch[document.getElementById("input_pitch").value],
      rate: ttsfox.prefsMapping.rate[document.getElementById("input_rate").value],
      volume: ttsfox.prefsMapping.volume[document.getElementById("input_volume").value],
    };
    if(ttsfox.voices[setting.voice].lang == "en-US") {
      setting.highlight = true;
    }
    ttsfox.speech(speechText.value, setting);
  } else {
    //TODO: show alert
  }
}

function cancel() {
  ttsfox.cancel();
}

function startup() {
  if(window.speechSynthesis){

    function tryInit() {
      var voices = window.speechSynthesis.getVoices() || [];
      if(voices.length) {
        ttsfox.voices = voices;
        var input_voice = document.getElementById("input_voice");
        for(var i = 0; i < voices.length ; i++) {
          var option = document.createElement("option");
          option.textContent = voices[i].name + " (" + voices[i].lang + ")";

          //if(voices[i].default) {
          //  option.textContent += ' -- DEFAULT';
          //}
          option.setAttribute("data-lang", voices[i].lang);
          option.setAttribute("data-name", voices[i].name);
          input_voice.appendChild(option);
          if(voices[i].lang == "en-US") {
            option.selected = true;
          }
        }
      }
      else {
        ttsfox.initCount++;
        if(ttsfox.initCount<100)
          setTimeout(tryInit, 100);
      }
    }
    setTimeout(tryInit, 100);
  }
  document.body.addEventListener("addon-message", function(event) {
    var speechText = document.getElementById("speechText");
    var detail = JSON.parse(event.detail);
    if(detail.cmd == "setData") {
      ttsfox.ttsprefs = window.ttsData.prefs;
      ttsfox.l10n = window.ttsData.l10n;
      document.getElementById("input_pitch").value = ttsfox.ttsprefs.pitch;
      document.getElementById("input_rate").value = ttsfox.ttsprefs.rate;
      document.getElementById("input_volume").value = ttsfox.ttsprefs.volume;
      setLabelText(ttsfox.ttsprefs.pitch, "pitch");
      setLabelText(ttsfox.ttsprefs.rate, "rate");
      setLabelText(ttsfox.ttsprefs.volume, "volume");
      if(window.ttsData.text){
        var speechText = document.getElementById("speechText");
        speechText.value = window.ttsData.text;
      }
    }
    else if(detail.cmd == "setText") {
      speechText.value = detail.text;
    }
  }, false);
}

function setLabelText(value, name) {
  var elem = document.getElementById(name + "_value");
  var prefsMapping = {
    pitch: [0, 0.5, 1.0, 1.5, 2.0],
    volume: ["1%", "10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"]
  }
  while(elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
  var textNode;
  if(name == "rate") {
    textNode = document.createTextNode(ttsfox.l10n.rate[value]);
  }
  else {
    textNode = document.createTextNode(prefsMapping[name][value]);
  }
  elem.appendChild(textNode);
}

window.addEventListener("load", startup, true);
