let currentPrefs = {};
let initCount = 0;
let optionPage = false;

let ttsfox = {
  initCount: 0,
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
  pause: function() {
    if(window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  },
  resume: function() {
    if(window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  },
  speech: function(text, setting) {
    if(window.speechSynthesis) {
      setting = setting || {};
      let u = new window.SpeechSynthesisUtterance(text);
      u.pitch  = setting.pitch || this.prefsMapping.pitch[currentPrefs.pitch];
      u.rate   = setting.rate || this.prefsMapping.rate[currentPrefs.rate];
      u.volume = setting.volume || this.prefsMapping.volume[currentPrefs.volume];
      u.voice  = this.voices[setting.voice];
      //u.lang   = this.voices[setting.voice].lang;

      u.onpause = function(event) {
        document.getElementById('btnResume').style.display = 'inline-block';
        document.getElementById('btnPause').style.display = 'none';
      }

      u.onresume = function(event) {
        document.getElementById('btnPause').style.display = 'inline-block';
        document.getElementById('btnResume').style.display = 'none';
        let speechText = document.getElementById('speechText');
        speechText.focus();
      }

      u.onstart = function(event) {
        document.getElementById('btnSpeech').style.display = 'none';
        document.getElementById('btnCancel').style.display = 'inline-block';
        document.getElementById('btnPause').removeAttribute('disabled');
        document.getElementById('btnResume').style.display = 'none';
        let speechText = document.getElementById('speechText');
        speechText.readOnly = true;
        speechText.focus();
      }

      u.onend = function(event) {
        document.getElementById('btnCancel').style.display = 'none';
        document.getElementById('btnSpeech').style.display = 'inline-block';
        document.getElementById('btnPause').setAttribute('disabled', true);
        document.getElementById('btnPause').style.display = 'inline-block';
        document.getElementById('btnResume').style.display = 'none';
        let speechText = document.getElementById('speechText');
        speechText.setSelectionRange(0, 0);
        speechText.readOnly = false;
      }
      u.onboundary = function(event) {
        if(setting.highlight) {
          let speechText = document.getElementById('speechText');
          let text = speechText.value;
          let tmpText = text.substring(event.charIndex);
          let nextSpace = tmpText.search('[ ,.;]');
          //let nextSpace = text.indexOf(' ', event.charIndex);
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

const storageChangeHandler = (changes, area) => {
  if(area === 'local') {
    let changedItems = Object.keys(changes);
    for (let item of changedItems) {
      switch (item) {
        case 'cacheText':
          document.getElementById('speechText').value = changes[item].newValue;
          break;
      }
    }
  }
};

const speech = () => {
  if(ttsfox.voices && ttsfox.voices.length) {
    let setting =  {
      voice: document.getElementById('voice').selectedIndex,
      pitch: ttsfox.prefsMapping.pitch[document.getElementById('pitch').value],
      rate: ttsfox.prefsMapping.rate[document.getElementById('rate').value],
      volume: ttsfox.prefsMapping.volume[document.getElementById('volume').value],
    };
    if(ttsfox.voices[setting.voice].lang == 'en-US') {
      setting.highlight = true;
    }
    ttsfox.speech(speechText.value, setting);
  } else {
    //TODO: show alert
  }
};

const cancel = () => {
  ttsfox.cancel();
};

const pause = () => {
  ttsfox.pause();
}

const resume = () => {
  ttsfox.resume();
}

const tryInit = () => {
  let voices = window.speechSynthesis.getVoices() || [];
  if(voices.length) {
    ttsfox.voices = voices;
    let input_voice = document.getElementById('voice');
    for(let i = 0; i < voices.length ; i++) {
      let option = document.createElement('option');
      option.textContent = voices[i].name + ' (' + voices[i].lang + ')';

      //if(voices[i].default) {
      //  option.textContent += ' -- DEFAULT';
      //}
      option.setAttribute('data-lang', voices[i].lang);
      option.setAttribute('data-name', voices[i].name);
      input_voice.appendChild(option);
      if(option.textContent === currentPrefs.voice) {
        option.selected = true;
      }
    }
    if(input_voice.selectedIndex === -1) {
      for(let i = 0; i < voices.length ; i++) {
        if(voices[i].lang == 'en-US') {
          option.selected = true;
          break;
        }
      }
    }
    if(!optionPage && currentPrefs.autoStartSpeech) {
      speech();
    }
  }
  else {
    initCount++;
    if(initCount<100)
      setTimeout(tryInit, 100);
  }
};

const setLabelText = (name, value) => {
  // let value = event.target.value;
  // let name = event.target.getAttribute('id');
  let elem = document.getElementById(name + '_value');
  let prefsMapping = {
    pitch: [0, 0.5, 1.0, 1.5, 2.0],
    volume: ['1%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%']
  }
  while(elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
  let textNode;
  if(name == 'rate') {
    textNode = document.createTextNode(browser.i18n.getMessage('rateS' + value));
  }
  else {
    textNode = document.createTextNode(prefsMapping[name][value]);
  }
  elem.appendChild(textNode);
};

const startup = () => {
  if(!optionPage) {
    browser.storage.onChanged.addListener(storageChangeHandler);
    document.getElementById('btnSpeech').addEventListener('click', speech, false);
    document.getElementById('btnCancel').addEventListener('click', cancel, false);
    document.getElementById('btnPause').addEventListener('click', pause, false);
    document.getElementById('btnResume').addEventListener('click', resume, false);
    document.getElementById('speechText').value = currentPrefs.cacheText;
  }
  else {
    //
  }

  document.getElementById('pitch').addEventListener('input', event => {
    setLabelText('pitch', event.target.value);
  }, false);
  document.getElementById('rate').addEventListener('input', event => {
    setLabelText('rate', event.target.value);
  }, false);
  document.getElementById('volume').addEventListener('input', event => {
    setLabelText('volume', event.target.value)
  }, false);

  if(window.speechSynthesis){
    setTimeout(tryInit, 100);
  }
}

const saveToPreference = (id, value) => {
  let update = {};
  update[id] = value;
  browser.storage.local.set(update).then(null, err => {});
}

const handleVelueChange = id => {
  let elem = document.getElementById(id);
  if(elem) {
    let elemType = elem.getAttribute('type');
    if(elemType === 'radioGroup') {
      let radios = Array.from(elem.querySelectorAll('input[name='+id+']'));
      for(let radio of radios) {
        radio.addEventListener('input', event => {
          if(radio.checked)
            saveToPreference(id, parseInt(radio.getAttribute("value")));
        });
      }
    }
    else if(elemType === 'checkbox') {
      elem.addEventListener('input', event => {
        saveToPreference(id, elem.checked ? true : false);
      });
    }
    else if(elemType === 'range') {
      elem.addEventListener('input', event => {
        saveToPreference(id, parseInt(elem.value));
      });
    }
    else if(elemType === 'option') {
      elem.addEventListener('input', event => {
        saveToPreference(id, elem.value);
      });
    }
  }
}

const setValueToElem = (id, value) => {
  let elem = document.getElementById(id);
  if(elem) {
    let elemType = elem.getAttribute('type');
    if(elemType === 'range') {
      elem.value = value;
    }
    else if(elemType === 'checkbox') {
      elem.checked = value;
    }
    else if(elemType === 'radioGroup') {
      let radios = Array.from(elem.querySelectorAll('input[name='+id+']'));
      for(let radio of radios) {
        if(parseInt(radio.getAttribute('value')) === value) {
          radio.checked = true;
          break;
        }
      }
    }
  }
}

const init = preferences => {
  currentPrefs = preferences;
  for(let p in preferences) {
    setValueToElem(p, preferences[p]);
    handleVelueChange(p);
  }
  document.title = browser.i18n.getMessage('speech');
  let l10nTags = Array.from(document.querySelectorAll('[data-l10n-id]'));
  l10nTags.forEach(tag => {
    tag.textContent = browser.i18n.getMessage(tag.getAttribute('data-l10n-id'));
  });

  setLabelText('pitch', currentPrefs.pitch);
  setLabelText('rate', currentPrefs.rate);
  setLabelText('volume', currentPrefs.volume);
}

window.addEventListener('load', event => {
  if(document.getElementById('ttsfox-option'))
    optionPage = true;
  browser.storage.local.get().then(results => {
    if ((typeof results.length === 'number') && (results.length > 0)) {
      results = results[0];
    }
    if (results.version) {
      init(results);
      startup();
    }
  });
}, true);
