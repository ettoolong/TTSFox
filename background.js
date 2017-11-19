let defaultPreference = {
  contextMenuEnabled: true,
  contextMenuAction: 0, //0:open dialog, 1:read out
  iconColor: 0, //0:black, 1:white
  hotkeyAction: 0,
  voice: 'default',
  pitch: 2,
  rate: 4,
  volume: 10,
  autoStartSpeech: false,
  cacheText: '',
  version: 2
};
let os = '';
let menuId = null;
let preferences = {};
let dialog = null;
let dialogTab = null; //tab in speech dialog
let ttsTab = null;
let initCount = 0;
let allVoices = {};
let prefsMapping = {
  pitch: [0, 0.5, 1.0, 1.5, 2.0],
  rate: [0.1, 0.125, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0, 10.0],
  volume: [0.01, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
};

browser.runtime.getPlatformInfo().then(info => {
  os = info.os;
});

const storageChangeHandler = (changes, area) => {
  if(area === 'local') {
    let changedItems = Object.keys(changes);
    for (let item of changedItems) {
      preferences[item] = changes[item].newValue;
      switch (item) {
        case 'iconColor':
          setBrowserActionIcon();
          break;
        case 'contextMenuAction':
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
    if (preferences.version !== defaultPreference.version) {
      let update = {};
      let needUpdate = false;
      for(let p in defaultPreference) {
        if(preferences[p] === undefined) {
          update[p] = defaultPreference[p];
          needUpdate = true;
        }
      }
      if(needUpdate) {
        browser.storage.local.set(update).then(null, err => {});
      }
    }
    resetContextMenu();
    setBrowserActionIcon();
  });
};

window.addEventListener('DOMContentLoaded', event => {
  loadPreference();
});

browser.browserAction.onClicked.addListener(tab => {
  getActiveTab( tab => {
    if(tab) {
      if(tab.url.startsWith('about:')) {
        openDialog('');
      } else {
        getSelectionText(tab, selectionText => {
          openDialog(selectionText);
        });
      }
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

const stopSpeech = (cancel) => {
  if(cancel)
    window.speechSynthesis.cancel();
  ttsTab = null;
  resetContextMenu();
}

const startSpeech = (selectionText) => {
  let selectionTextTmp = selectionText ? selectionText.replace(/^\s+|\s+$/g,'') : '';
  if(ttsTab) {
    stopSpeech(true);
  }
  if(selectionTextTmp !== '') {
    getActiveTab( tab => {
      if(tab) {
        ttsTab = tab;
        let u = new window.SpeechSynthesisUtterance(selectionText);
        u.pitch  = prefsMapping.pitch[preferences.pitch];
        u.rate   = prefsMapping.rate[preferences.rate];
        u.volume = prefsMapping.volume[preferences.volume];
        u.voice  = allVoices[preferences.voice];
        u.onend = function(event) {
          stopSpeech(false);
        }
        window.speechSynthesis.speak(u);
        resetContextMenu();
      }
    });
  }
};

const openDialog = (selectionText) => {
  if(dialog) {
    browser.storage.local.set({cacheText: selectionText});
    browser.windows.update(dialog, {focused: true});
  }
  else {
    let winWidth = os === 'mac' ? 750: 770;
    let winHeight = os === 'mac' ? 250: 270;
    browser.storage.local.set({cacheText: selectionText}).then(() => {
      browser.windows.create({
        url: 'ttsPanel.html',
        type: 'panel',
        incognito: true,
        width: winWidth,
        height: winHeight,
      }).then(windowInfo => {
        dialog = windowInfo.id;
        dialogTab = windowInfo.tabs[0].id;
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
    dialogTab = null;
  }
});

const createContextMenu = () => {
  let title = preferences.contextMenuAction === 0 ?
    browser.i18n.getMessage('contextMenuItemTitle_action1') :
    browser.i18n.getMessage('contextMenuItemTitle_action2');
  let contexts = ( ttsTab && preferences.contextMenuAction === 1 ) ? ['all'] : ['selection'];
  if (menuId !== null) {
    browser.contextMenus.update(menuId,{title: title, contexts: contexts});
    return;
  }
  menuId = browser.contextMenus.create({
    type: 'normal',
    title: title,
    contexts: contexts,
    onclick: (data) => {
      //
      if(preferences.contextMenuAction === 0) {
        openDialog(data.selectionText);
      }
      else if(preferences.contextMenuAction === 1) {
        startSpeech('selectionText' in data ? data.selectionText : '');
      }
      //don't use data.selectionText, because it's max length is 150 character.
      // getActiveTab( tab => {
      //   if(tab) {
      //     getSelectionText(tab, selectionText => {
      //       if(selectionText) {
      //         if(preferences.contextMenuAction === 0) {
      //           openDialog(selectionText);
      //         }
      //         else if(preferences.contextMenuAction === 1) {
      //           startSpeech(selectionText);
      //         }
      //       }
      //     });
      //   }
      // });
    }
  });
}

const resetContextMenu = () => {
  if (preferences.contextMenuEnabled) {
    createContextMenu();
  } else {
    browser.contextMenus.removeAll(() => {
      menuId = null;
    });
  }
};

const setBrowserActionIcon = () => {
  if(preferences.iconColor === 1) {
    browser.browserAction.setIcon({path: 'icon/icon_w.svg'});
  } else {
    browser.browserAction.setIcon({path: 'icon/icon.svg'});
  }
};

browser.commands.onCommand.addListener(command => {
  if (command === 'speech') {
    getActiveTab( tab => {
      if(tab) {
        getSelectionText(tab, selectionText => {
          if(selectionText && preferences.hotkeyAction === 0) {
            openDialog(selectionText);
          }
          else if(preferences.hotkeyAction === 1) {
            startSpeech(selectionText);
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

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if(ttsTab && ttsTab.id == tabId) {
    stopSpeech(true);
  }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
  if (changeInfo.url) {
    if(ttsTab && ttsTab.id == tabId) {
      stopSpeech(true);
    }
  }
});
