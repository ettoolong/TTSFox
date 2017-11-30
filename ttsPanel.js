let currentPrefs = {};
let initCount = 0;
let optionPage = false;
let highlightRule = {
  'en-US': {highlight: true, singleChar: true},
  'ru-RU': {highlight: true, singleChar: false},
  'default': {highlight: false}
};

//
//document.getElementById
let elem_voice;
let elem_pitch;
let elem_rate;
let elem_btnResume;
let elem_btnPause;
let elem_btnSpeech;
let elem_btnCancel;
let elem_speechText;
let elem_currentText;
let elem_volume;
let elem_readSelectedFragment;
let elem_label_readSelectedFragment;
let elem_startFromCursorPos;
let elem_label_startFromCursorPos;
let elem_textareaCover;

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
        elem_btnResume.style.display = 'inline-block';
        elem_btnPause.style.display = 'none';
      }

      u.onresume = function(event) {
        elem_btnPause.style.display = 'inline-block';
        elem_btnResume.style.display = 'none';
        // elem_speechText.focus();
      }

      u.onstart = function(event) {
        elem_btnSpeech.style.display = 'none';
        elem_btnCancel.style.display = 'inline-block';
        elem_btnPause.removeAttribute('disabled');
        elem_btnResume.style.display = 'none';
        elem_speechText.readOnly = true;
        elem_speechText.style.display = 'none';
        elem_textareaCover.style.display = 'block';
        syncDivAndTextarea({text: true});
        // elem_speechText.focus();
      }

      u.onend = function(event) {
        elem_btnCancel.style.display = 'none';
        elem_btnSpeech.style.display = 'inline-block';
        elem_btnPause.setAttribute('disabled', true);
        elem_btnPause.style.display = 'inline-block';
        elem_btnResume.style.display = 'none';
        setSelectionRange(0, 0);
        //speechText.setSelectionRange(0, 0);
        elem_speechText.readOnly = false;
        elem_speechText.style.display = 'block';
        elem_textareaCover.style.display = 'none';
        syncDivAndTextarea({text: true, scrollPosition: true, selectionRang:true});
        elem_speechText.focus();
      }
      u.onboundary = function(event) {
        if(setting.highlight) {
          if(setting.highlightRule.highlight) {
            let start = event.charIndex + setting.startPosition;
            let text = elem_speechText.value;
            let tmpText = text.substring(start);
            let nextSpace = tmpText.search('[ ,.;\n]');
            //console.log(nextSpace);
            if(nextSpace == 1 && setting.highlightRule.singleChar === false ) {
              let tmpText2 = text.substring(start+2);
              let nextSpace2 = tmpText2.search('[ ,.;\n]');
              if(nextSpace2 === -1) {
                nextSpace = -1;
              }
              else {
                nextSpace += nextSpace2 + 1;
              }
            }
            //let nextSpace = text.indexOf(' ', event.charIndex);
            if(nextSpace === -1) {
              nextSpace = text.length;
            }
            else {
              nextSpace = start + nextSpace;
            }
            setSelectionRange(start, nextSpace);
            //speechText.setSelectionRange(event.charIndex, nextSpace);
          }
          else {
            let start = event.charIndex + setting.startPosition + 4;
            if(start > text.length) start = text.length;
            setSelectionRange(start, start, true);
          }
        }
      }
      window.speechSynthesis.speak(u);
    }
  }
};

const syncOption = (changes, area) => {
  let syncOptionList = [
    'contextMenuEnabled', 'contextMenuAction',
    'iconColor', 'hotkeyAction', 'voice',
    'pitch', 'rate', 'volume', 'autoStartSpeech'
  ];
  if(area === 'local') {
    let changedItems = Object.keys(changes);
    for (let item of changedItems) {
      if(syncOptionList.includes(item)) {
        if(currentPrefs[item] !== changes[item].newValue) {
          currentPrefs[item] = changes[item].newValue;
          setValueToElem(item, currentPrefs[item]);
        }
      }
    }
  }
};

const storageChangeHandler = (changes, area) => {
  if(area === 'local') {
    let changedItems = Object.keys(changes);
    for (let item of changedItems) {
      switch (item) {
        case 'autoStartSpeech':
          currentPrefs[item] = changes[item].newValue;
          break;
        case 'cacheText':
          elem_speechText.value = changes[item].newValue;
          elem_speechText.setSelectionRange(0, 0);
          setSelectionRange(0, 0);
          checkSelection();
          if(!optionPage && currentPrefs.autoStartSpeech) {
            speech();
          }
          break;
      }
    }
  }
};

const syncDivAndTextarea = (options) => {
  if(options.text && !options.selectionRang) {
    elem_currentText.textContent = elem_speechText.value;
  }
  if(options.selectionRang) {
    let start = elem_speechText.selectionStart;
    let end = elem_speechText.selectionEnd;
    setSelectionRange(start, end);
  }
  if(options.scrollPosition) {
    elem_currentText.scrollTop = elem_speechText.scrollTop;
  }
};

const setSelectionRange = (rangeStart, rangeEnd, forceScroll) => {
  //console.log('rangeStart = ' + rangeStart + ', rangeEnd = ' + rangeEnd);

  let start = rangeStart;
  let end = rangeEnd;
  let text = elem_speechText.value;
  elem_currentText.textContent = '';
  elem_currentText.appendChild(document.createTextNode(text.substring(0, start)));
  let s = document.createElement('SPAN');
  s.textContent = text.substring(start, end);
  elem_currentText.appendChild(s)
  elem_currentText.appendChild(document.createTextNode(text.substring(end)));
  //s.scrollIntoView({behavior: 'instant', block: 'nearest', inline: 'nearest'}); // Firefox 58+
  if(rangeStart !== rangeEnd || forceScroll) {
    s.scrollIntoView(false);
  }
};

const speech = () => {
  chrome.runtime.sendMessage({action: 'stop'});
  let startFromCursorPos = elem_startFromCursorPos.checked && !elem_startFromCursorPos.getAttribute('disabled');
  let readSelectedFragment = elem_readSelectedFragment.checked && !elem_readSelectedFragment.getAttribute('disabled');
  if(ttsfox.voices && ttsfox.voices.length) {
    let setting =  {
      voice: elem_voice.selectedIndex,
      pitch: ttsfox.prefsMapping.pitch[elem_pitch.value],
      rate: ttsfox.prefsMapping.rate[elem_rate.value],
      volume: ttsfox.prefsMapping.volume[elem_volume.value],
    };
    if(highlightRule[ttsfox.voices[setting.voice].lang]) {
      setting.highlight = true;
      setting.highlightRule = highlightRule[ttsfox.voices[setting.voice].lang];
    }
    else {
      setting.highlight = true;
      setting.highlightRule = highlightRule.default;
    }
    if(startFromCursorPos) {
      let start = elem_speechText.selectionStart;
      let fullText = elem_speechText.value
      let text = fullText.substring(start, fullText.length);
      setting.startPosition = start;
      ttsfox.speech(text, setting);
    }
    else if(readSelectedFragment) {
      let start = elem_speechText.selectionStart;
      let fullText = elem_speechText.value
      let text = fullText.substring(start, elem_speechText.selectionEnd);
      setting.startPosition = start;
      ttsfox.speech(text, setting);
    }
    else {
      setting.startPosition = 0;
      ttsfox.speech(elem_speechText.value, setting);
    }
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
    for(let i = 0; i < voices.length ; i++) {
      let option = document.createElement('option');
      option.textContent = voices[i].name + ' (' + voices[i].lang + ')';

      //if(voices[i].default) {
      //  option.textContent += ' -- DEFAULT';
      //}
      option.setAttribute('data-lang', voices[i].lang);
      option.setAttribute('data-name', voices[i].name);
      elem_voice.appendChild(option);
      if(option.textContent === currentPrefs.voice) {
        option.selected = true;
      }
    }
    if(elem_voice.selectedIndex === -1) {
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

const checkSelection = () => {
  if(elem_speechText.selectionStart == elem_speechText.selectionEnd) {
    elem_label_readSelectedFragment.setAttribute('disabled' , true);
    elem_readSelectedFragment.setAttribute('disabled' , true);
    elem_label_startFromCursorPos.removeAttribute('disabled');
    elem_startFromCursorPos.removeAttribute('disabled');
  }
  else {
    elem_label_readSelectedFragment.removeAttribute('disabled');
    elem_readSelectedFragment.removeAttribute('disabled');
    elem_label_startFromCursorPos.setAttribute('disabled' , true);
    elem_startFromCursorPos.setAttribute('disabled' , true);
  }
};

const startup = () => {
  elem_voice = document.getElementById('voice');
  elem_pitch = document.getElementById('pitch');
  elem_rate = document.getElementById('rate');
  elem_volume = document.getElementById('volume');

  if(!optionPage) {
    elem_btnResume = document.getElementById('btnResume');
    elem_btnPause = document.getElementById('btnPause');
    elem_btnSpeech = document.getElementById('btnSpeech');
    elem_btnCancel = document.getElementById('btnCancel');
    elem_speechText = document.getElementById('speechText');
    elem_currentText = document.getElementById('currentText');
    elem_textareaCover = document.getElementById('textareaCover');
    elem_readSelectedFragment = document.getElementById('readSelectedFragment');
    elem_label_readSelectedFragment = document.getElementById('label_readSelectedFragment');
    elem_startFromCursorPos = document.getElementById('startFromCursorPos');
    elem_label_startFromCursorPos = document.getElementById('label_startFromCursorPos');

    browser.storage.onChanged.addListener(storageChangeHandler);
    elem_btnSpeech.addEventListener('click', speech, false);
    elem_btnCancel.addEventListener('click', cancel, false);
    elem_btnPause.addEventListener('click', pause, false);
    elem_btnResume.addEventListener('click', resume, false);

    elem_speechText.value = currentPrefs.cacheText;
    elem_speechText.onblur = function () {
      let start = elem_speechText.selectionStart;
      let end = elem_speechText.selectionEnd;
      let text = elem_speechText.value;
      elem_currentText.textContent = '';
      elem_currentText.appendChild(document.createTextNode(text.substring(0, start)));
      let s = document.createElement('SPAN');
      s.textContent = text.substring(start, end);
      elem_currentText.appendChild(s)
      elem_currentText.appendChild(document.createTextNode(text.substring(end, text.lengrh)));
      elem_speechText.style.opacity = 0;
      //elem_currentText.style.opacity = 1;
      elem_currentText.scrollTop = elem_speechText.scrollTop;
    }
    elem_speechText.onfocus = function () {
      //elem_currentText.style.opacity = 0;
      elem_speechText.style.opacity = 1;
    }
    elem_speechText.addEventListener('mouseup', event => {
      setTimeout(checkSelection, 0);
    }, true);

    elem_speechText.addEventListener('keypress', event => {
      setTimeout(checkSelection, 0);
    });

    browser.runtime.onMessage.addListener( message => {
      if (message.action === 'stop') {
        try{
          cancel();
        }
        catch(ex){}
        return Promise.resolve({});
      }
    });
  }
  else {
    browser.storage.onChanged.addListener(syncOption);
    browser.runtime.getPlatformInfo().then(platformInfo => {
      if(platformInfo.os === 'win') {
        elem_voice.addEventListener('mouseenter', event => {
          setTimeout( () => {
            elem_voice.parentNode.parentNode.style.height = 'calc(100% + 1px)';
            setTimeout( () => {
              elem_voice.parentNode.parentNode.style.height = '100%';
            },500);
          },0);
        });
      }
    });
  }

  if(window.speechSynthesis){
    setTimeout(tryInit, 100);
  }
}

const saveToPreference = (id, value) => {
  let update = {};
  update[id] = value;
  if(optionPage) {
    currentPrefs[id] = value;
  }
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
            saveToPreference(id, parseInt(radio.getAttribute('value')));
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
        setLabelText(id, parseInt(elem.value));
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
      setLabelText(id, parseInt(elem.value));
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
  document.title = 'TTSFox';//browser.i18n.getMessage('speech');
  let l10nTags = Array.from(document.querySelectorAll('[data-l10n-id]'));
  l10nTags.forEach(tag => {
    tag.textContent = browser.i18n.getMessage(tag.getAttribute('data-l10n-id'));
  });
}

window.addEventListener('load', event => {
  if(document.getElementById('ttsfox-option')) {
    optionPage = true;
  }
  if(!optionPage) {
    document.body.style.minWidth = document.body.offsetWidth - 40 + 'px';
    document.body.style.minHeight = document.body.offsetHeight + 'px';
  }
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

document.addEventListener('DOMContentLoaded', (event) => {
  // Fix for Fx57 bug where bundled page loaded using
  // browser.windows.create won't show contents unless resized.
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=1402110
  if(!document.getElementById('ttsfox-option')) {
    browser.windows.getCurrent((win) => {
      browser.windows.update(win.id, {width:win.width+1})
    });
  }
});
