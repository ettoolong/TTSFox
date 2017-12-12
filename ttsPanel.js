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
  status: 'stop',
  textInfo: {start: 0, end: 0},
  prefsMapping: {
    pitch: [0, 0.5, 1.0, 1.5, 2.0],
    rate: [0.1, 0.125, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 10.0],
    volume: [0.01, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    //voice: [] base on system
  },
  voices: [],
  cancel: function() {
    ttsfox.status = 'stop';
    if(window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    elem_btnCancel.setAttribute('disabled', true);
    elem_btnSpeech.style.display = 'inline-block';
    elem_btnPause.style.display = 'none';
    elem_btnResume.style.display = 'none';
    elem_currentText.classList.remove('pause');
    setControllerStatus(true);
    setSelectionRange(0, 0);
    checkSelection();
    //speechText.setSelectionRange(0, 0);
    elem_speechText.readOnly = false;
    elem_speechText.style.display = 'block';
    elem_textareaCover.style.display = 'none';
    syncDivAndTextarea({text: true, scrollPosition: true, selectionRang:true});
    elem_speechText.focus();
  },
  pause: function() {
    ttsfox.status = 'pause';
    if(window.speechSynthesis) {
      //window.speechSynthesis.pause();
      window.speechSynthesis.cancel();
    }
    elem_btnResume.style.display = 'inline-block';
    elem_btnPause.style.display = 'none';
    elem_currentText.classList.add('pause');
    elem_textareaCover.style.display = 'none';
    setParagraphRange();
  },
  resume: function() {
    ttsfox.status = 'play';
    elem_btnPause.style.display = 'inline-block';
    elem_btnResume.style.display = 'none';
    elem_currentText.classList.remove('pause');
    elem_textareaCover.style.display = 'block';
    let start = ttsfox.lastPosition;
    let fullText = elem_speechText.value;
    let text = fullText.substring(start, ttsfox.textInfo.end);
    let setting = getCurrentSetting();
    setting.startPosition = start;
    ttsfox.speech(text, setting);
    // if(window.speechSynthesis) {
    //   window.speechSynthesis.resume();
    // }
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

      // u.onpause = function(event) {
      //   elem_btnResume.style.display = 'inline-block';
      //   elem_btnPause.style.display = 'none';
      //   elem_currentText.classList.add('pause');
      // }

      // u.onresume = function(event) {
      //   elem_btnPause.style.display = 'inline-block';
      //   elem_btnResume.style.display = 'none';
      //   // elem_speechText.focus();
      // }

      u.onstart = function(event) {
        elem_btnSpeech.style.display = 'none';
        elem_btnCancel.removeAttribute('disabled');
        elem_btnPause.style.display = 'inline-block';
        elem_btnResume.style.display = 'none';
        elem_speechText.readOnly = true;
        elem_speechText.style.display = 'none';
        elem_textareaCover.style.display = 'block';
        checkSelection();
        setControllerStatus(false);
        // elem_speechText.focus();
      }

      u.onend = function(event) {
        if(ttsfox.status === 'play') {
          ttsfox.cancel();
        }
        else if(ttsfox.status === 'readout') {
          ttsfox.pause();
        }
      }

      u.onboundary = function(event) {
        if(ttsfox.status !== 'play' && ttsfox.status !== 'readout')
          return;
        if(ttsfox.status === 'play')
          ttsfox.lastPosition = event.charIndex + setting.startPosition;
        if(setting.highlight) {
          if(setting.highlightRule.highlight) {
            let start = event.charIndex + setting.startPosition;
            // console.log('start = ' + start);
            let text = elem_speechText.value;
            let tmpText = text.substring(start);
            let nextSpace = tmpText.search('[ ,.;\u2014\u2026\n]');
            //console.log(nextSpace);
            if(nextSpace == 1 && setting.highlightRule.singleChar === false ) {
              let tmpText2 = text.substring(start+2);
              let nextSpace2 = tmpText2.search('[ ,.;\u2014\u2026\n]');
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
            if(nextSpace > ttsfox.textInfo.end) nextSpace = ttsfox.textInfo.end;
            setSelectionRange(start, nextSpace, false, {start:ttsfox.textInfo.start, end:ttsfox.textInfo.end});
            //speechText.setSelectionRange(event.charIndex, nextSpace);
          }
          else {
            let start = event.charIndex + setting.startPosition + 4;
            if(start > text.length) start = text.length;
            setSelectionRange(start, start, true, {start:ttsfox.textInfo.start, end:ttsfox.textInfo.end});
          }
        }
      }
      window.speechSynthesis.speak(u);
    }
  }
};

const setControllerStatus = (enabled) => {
  if(enabled) {
    elem_voice.removeAttribute('disabled');
    elem_pitch.removeAttribute('disabled');
    elem_rate.removeAttribute('disabled');
    elem_volume.removeAttribute('disabled');
    elem_readSelectedFragment.removeAttribute('disabled');
    elem_startFromCursorPos.removeAttribute('disabled');
  }
  else {
    elem_voice.setAttribute('disabled', 'true');
    elem_pitch.setAttribute('disabled', 'true');
    elem_rate.setAttribute('disabled', 'true');
    elem_volume.setAttribute('disabled', 'true');
    elem_readSelectedFragment.setAttribute('disabled', 'true');
    elem_startFromCursorPos.setAttribute('disabled', 'true');
  }
}

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
          ttsfox.status = 'stop';
          try{
            cancel();
          }
          catch(ex){}
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

const createSpan = (parent, classList, text) => {
  let s = document.createElement('SPAN');
  for(let c of classList)
    s.classList.add(c);
  if(text !== undefined)
    s.textContent = text;
  parent.appendChild(s);
  return s;
}

const setSelectionRange = (rangeStart, rangeEnd, forceScroll, textRange) => {
  //console.log('rangeStart = ' + rangeStart + ', rangeEnd = ' + rangeEnd);
  elem_currentText.textContent = '';

  let start = rangeStart;
  let end = rangeEnd;
  let text = elem_speechText.value;
  let ts = 0;
  let te = text.length;
  if(textRange) {
    ts = textRange.start;
    te = textRange.end;
    createSpan(elem_currentText, ['blur'], text.substring(0, ts));
  }
  elem_currentText.appendChild(document.createTextNode(text.substring(ts, start)));
  let s = createSpan(elem_currentText, ['highlight'], text.substring(start, end));
  elem_currentText.appendChild(document.createTextNode(text.substring(end, te)));
  if(textRange) {
    createSpan(elem_currentText, ['blur'], text.substring(te));
  }

  //s.scrollIntoView({behavior: 'instant', block: 'nearest', inline: 'nearest'}); // Firefox 58+
  if(rangeStart !== rangeEnd || forceScroll) {
    s.scrollIntoView(false);
  }
};

const setParagraphRange = () => {
  elem_currentText.textContent = '';
  let paragraphId = 0;
  let sentenceId = 0;
  let newParagraph = true;

  let fullText = elem_speechText.value;
  let text = fullText.substring(ttsfox.textInfo.start, ttsfox.textInfo.end);
  let offset = ttsfox.textInfo.start;
  let sentences = text.split(/[\n.\u3002]/);
  let start = 0;
  let previousStart = 0;
  let cursor = false;
  //let highlightChar = text.substring(ttsfox.lastPosition, ttsfox.lastPosition+1);

  if(ttsfox.textInfo.start>0) {
    createSpan(elem_currentText, ['blur'], fullText.substring(0, ttsfox.textInfo.start));
  }

  for(let s of sentences) {
    let nextSpliter = text.substring(start+s.length, start+s.length+1);
    if(s.length) {

      let t = /[^ ]/;
      let skip = s.search(t);
      let space = s.substring(0, skip);
      let stext = s.substring(skip);

      if(sentenceId > 0) {
        let tmpText = text.substring(previousStart, start+skip);
        if(tmpText.includes('\n')) {
          newParagraph = true;
          paragraphId++;
        }
      }

      previousStart = start+skip;
      if(ttsfox.lastPosition >= offset+start && ttsfox.lastPosition < offset+start+s.length) {
        cursor = true;
        let highlightPos = ttsfox.lastPosition - offset- start - skip;
        setSentenceRange(offset+start+skip, newParagraph, space, stext, nextSpliter, paragraphId, sentenceId, highlightPos);
      }
      else {
        if(!cursor && offset+start > ttsfox.lastPosition) {
          cursor = true;
          ttsfox.lastPosition = offset+ start + skip;
          //highlightChar = text.substring(ttsfox.lastPosition, ttsfox.lastPosition+3);
          //console.log('new highlightChar = ' + highlightChar);
          setSentenceRange(offset+start+skip, newParagraph, space, stext, nextSpliter, paragraphId, sentenceId, 0);
        }
        else {
          setSentenceRange(offset+start+skip, newParagraph, space, stext, nextSpliter, paragraphId, sentenceId);
        }
      }

      if(stext.length) {
        newParagraph = false;
        sentenceId++;
      }

    }
    else {
      setSentenceRange(offset+start, newParagraph, '', '', nextSpliter, paragraphId, sentenceId);
    }

    start += (s.length + 1);
  }

  if(ttsfox.textInfo.end<elem_speechText.value.length) {
    createSpan(elem_currentText, ['blur'], fullText.substring(ttsfox.textInfo.end));
  }

};

function onClickSentence(event) {
  if(event && event.shiftKey) {
    elem_currentText.classList.remove('pause');
    ttsfox.status = 'readout';
    let start = parseInt(this.getAttribute('pos'));
    let text = this.textContent;
    let setting = getCurrentSetting();
    setting.startPosition = start;
    ttsfox.speech(text, setting);
  }
  else {
    let oldCursor = elem_currentText.querySelector('.cursor');
    oldCursor.parentNode.removeChild(oldCursor);
    ttsfox.lastPosition = parseInt(this.getAttribute('pos'));
    let newParagraph = this.classList.contains('newParagraph');
    let text = this.textContent;
    let s = document.createElement('SPAN');
    s.classList.add('sentence');
    if(newParagraph)
      s.classList.add('newParagraph');
    s.setAttribute('paragraphId', this.getAttribute('paragraphId'));
    s.setAttribute('sentenceId', this.getAttribute('sentenceId'));
    s.setAttribute('pos', this.getAttribute('pos'));
    s.onclick = onClickSentence;
    createSpan(s, ['cursor']);
    s.appendChild(document.createTextNode(text));
    this.parentNode.replaceChild(s, this);
  }
}

const setSentenceRange = (pos, newParagraph, space, text, nextSpliter, paragraphId, sentenceId, highlightPos) => {
  if(space.length)
    elem_currentText.appendChild(document.createTextNode(space));
  if(text.length) {
    let s = document.createElement('SPAN');
    s.classList.add('sentence');
    if(newParagraph)
      s.classList.add('newParagraph');
    s.setAttribute('paragraphId', paragraphId);
    s.setAttribute('sentenceId', sentenceId);
    s.setAttribute('pos', pos);
    s.onclick = onClickSentence;

    if(highlightPos !== undefined) {
      let text1 = text.substring(0, highlightPos);
      let text2 = text.substring(highlightPos);
      if(text1.length) {
        s.appendChild(document.createTextNode(text1));
      }
      createSpan(s, ['cursor']);
      if(text2.length) {
        s.appendChild(document.createTextNode(text2));
      }
    }
    else {
      s.textContent = text;
    }
    elem_currentText.appendChild(s);
  }
  if(nextSpliter.length)
    elem_currentText.appendChild(document.createTextNode(nextSpliter));
};

const getCurrentSetting = () => {
  let setting = {
    voice: elem_voice.selectedIndex,
    pitch: ttsfox.prefsMapping.pitch[elem_pitch.value],
    rate: ttsfox.prefsMapping.rate[elem_rate.value],
    volume: ttsfox.prefsMapping.volume[elem_volume.value]
  };
  if(highlightRule[ttsfox.voices[setting.voice].lang]) {
    setting.highlight = true;
    setting.highlightRule = highlightRule[ttsfox.voices[setting.voice].lang];
  }
  else {
    setting.highlight = true;
    setting.highlightRule = highlightRule.default;
  }
  return setting;
};

const speech = () => {
  chrome.runtime.sendMessage({action: 'stop'});
  ttsfox.status = 'play';
  let startFromCursorPos = elem_startFromCursorPos.checked && !elem_startFromCursorPos.getAttribute('disabled');
  let readSelectedFragment = elem_readSelectedFragment.checked && !elem_readSelectedFragment.getAttribute('disabled');
  if(ttsfox.voices && ttsfox.voices.length) {
    let setting = getCurrentSetting();
    let text = '';
    if(startFromCursorPos) {
      let fullText = ttsfox.textInfo.fullText = elem_speechText.value;
      let start = ttsfox.textInfo.start = elem_speechText.selectionStart;
      ttsfox.textInfo.end = fullText.length;

      text = fullText.substring(start, fullText.length);
    }
    else if(readSelectedFragment) {
      let fullText = ttsfox.textInfo.fullText = elem_speechText.value;
      let start = ttsfox.textInfo.start = elem_speechText.selectionStart;
      ttsfox.textInfo.end = elem_speechText.selectionEnd;

      text = fullText.substring(start, elem_speechText.selectionEnd);
    }
    else {
      text = ttsfox.textInfo.fullText = elem_speechText.value;
      let start = ttsfox.textInfo.start = 0;
      ttsfox.textInfo.end = text.length;
    }
    setting.startPosition = ttsfox.lastPosition = ttsfox.textInfo.start;
    syncDivAndTextarea({text: true});
    ttsfox.speech(text, setting);
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
      createSpan(elem_currentText, [], text.substring(start, end));
      elem_currentText.appendChild(document.createTextNode(text.substring(end, text.length)));
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
        ttsfox.status = 'stop';
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
  let l10nHints = Array.from(document.querySelectorAll('[data-l10n-title]'));
  l10nHints.forEach(tag => {
    tag.setAttribute('title', browser.i18n.getMessage(tag.getAttribute('data-l10n-title')));
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
