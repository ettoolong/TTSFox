let defaultPreference = {
  contextMenuEnabled: true,
  contextMenuAction: 0, //0:dialog, 1:speech
  hotkeyAction: 0,
  voice: 'default',
  pitch: 2,
  rate: 4,
  volume: 10,
  autoStartSpeech: false,
  cacheText: '',
  version: 1
};
let menuId = null;
let preferences = {};
let dialog = null;
let tab = null;
let initCount = 0;
let allVoices = {};
let prefsMapping = {
  pitch: [0, 0.5, 1.0, 1.5, 2.0],
  rate: [0.1, 0.125, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 10.0],
  volume: [0.01, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
};

const storageChangeHandler = (changes, area) => {
  if(area === 'local') {
    let changedItems = Object.keys(changes);
    for (let item of changedItems) {
      preferences[item] = changes[item].newValue;
      switch (item) {
        case 'contextMenuEnabled':
          resetContextMenu();
          break;
      }
    }
  }
};

const loadPreference = () => {
  browser.storage.local.get().then(results => {
    if ((typeof results.length === 'number') && (results.length > 0)) {
    results = results[0];
    }
    if (!results.version) {
      preferences = defaultPreference;
      browser.storage.local.set(defaultPreference).then(res => {
        browser.storage.onChanged.addListener(storageChangeHandler);
      }, err => {
      });
    } else {
      preferences = results;
      browser.storage.onChanged.addListener(storageChangeHandler);
    }
    browser.storage.local.set({cacheText: ''});
    resetContextMenu();
  });
};

window.addEventListener('DOMContentLoaded', event => {
  loadPreference();
});

browser.browserAction.onClicked.addListener(tab => {
  getActiveTab( tab => {
    if(tab) {
      getSelectionText(tab, selectionText => {
        openDialog(selectionText);
      });
    }
  });
});

const getActiveTab = callback => {
  browser.tabs.query({active: true, currentWindow: true}, tabs => {
    if ((typeof tabs !== 'undefined') && (tabs.length > 0)) {
      callback(tabs[0]);
    }
    else {
      //console.log(tabs);
    }
  });
};

const getSelectionText = (tab, callback) => {
  browser.tabs.sendMessage(
    tab.id,
    {act: 'getSelectionText'},
  ).then(response => {
    if(response.text) {
      callback(response.text);
    }
    else {
      callback('');
    }
  }).catch( error => {
  });
};

const speech = (selectionText) => {
  let u = new window.SpeechSynthesisUtterance(selectionText);
  u.pitch  = prefsMapping.pitch[preferences.pitch];
  u.rate   = prefsMapping.rate[preferences.rate];
  u.volume = prefsMapping.volume[preferences.volume];
  u.voice  = allVoices[preferences.voice];
  window.speechSynthesis.speak(u);
};

const openDialog = (selectionText) => {
  if(dialog) {
    browser.storage.local.set({cacheText: selectionText});
    browser.windows.update(dialog, {focused: true});
  }
  else {
    browser.storage.local.set({cacheText: selectionText}).then(()=>{
      browser.windows.create({
        url: 'ttsPanel.html',
        type: 'panel',
        incognito: true,
        width: 750,
        height: 250,
      }).then(windowInfo => {
        dialog = windowInfo.id;
        tab = windowInfo.tabs[0].id;
      }, error => {
        console.log(error);
      });
    }, err => {

    });
  }
}

browser.windows.onRemoved.addListener(windowID => {
  if(dialog === windowID) {
    dialog = null;
    tab = null;
  }
});

const createContextMenu = () => {
  if (menuId !== null) {
    return;
  }

  menuId = browser.contextMenus.create({
    type: 'normal',
    title: browser.i18n.getMessage('contextMenuItemTitle'),
    contexts: ['selection'],
    onclick: (data) => {
      //don't use data.selectionText, because it's max length is 150 character.
      getActiveTab( tab => {
        if(tab) {
          getSelectionText(tab, selectionText => {
            if(selectionText) {
              if(preferences.contextMenuAction === 0) {
                openDialog(selectionText);
              }
              else if(preferences.contextMenuAction === 1) {
                speech(selectionText);
              }
            }
          });
        }
      });
    }
  });
}

const resetContextMenu = () => {
  let createNew = false;
  if (preferences.contextMenuEnabled) {
    createContextMenu();
  } else {
    browser.contextMenus.removeAll(() => {
      menuId = null;
    });
  }
};

browser.commands.onCommand.addListener(command => {
  if (command === 'speech') {
    getActiveTab( tab => {
      if(tab) {
        getSelectionText(tab, selectionText => {
        if(selectionText) {
          if(preferences.hotkeyAction === 0) {
            openDialog(selectionText);
          }
          else if(preferences.hotkeyAction === 1) {
            speech(selectionText);
          }
        }
        });
      }
    });
  }
});

const tryInit = () => {
  let voices = window.speechSynthesis.getVoices() || [];
  if(voices.length) {
    for(let i = 0; i < voices.length ; i++) {
      let name = voices[i].name + ' (' + voices[i].lang + ')';
      allVoices[name] = voices[i];
    }
  }
  else {
    initCount++;
    if(initCount<100)
      setTimeout(tryInit, 1000);
  }
};

if(window.speechSynthesis){
  setTimeout(tryInit, 1000);
}
