let self = require("sdk/self");
let data = self.data;
let {components, Cu, Cc, Ci} = require("chrome");
let contextMenu = require("sdk/context-menu");
let tabs = require("sdk/tabs");
let _ = require("sdk/l10n").get;

let name = "extensions.@ttsfox.";
let pref = require("sdk/preferences/service");
let prefsList = ["pitch", "rate", "volume"];

let tts = {
  ttsPrefs: {},
  setTitle: function(){
    if(this.win) {
      let winArray = require("sdk/window/utils").windows(null, {includePrivate:true});
      let flag = false;
      for(let i=0;i<winArray.length;++i) {
        if(winArray[i] == this.win)
          flag = true;
      }
      if(flag) {
        this.win.document.title = require("sdk/l10n").get("speech_id");
      }
      else {
        this.win = null;
        this.worker = null;
      }
    }
  },

  openDlg: function(selectionText){
    //we need content script in dialog.
    //let { open } = require('sdk/window/utils');
    //let win = open(data.url('ttsPanel.html'), {
    //  features: {
    //    chrome: true,
    //    titlebar: true,
    //    alwaysRaised: true,
    //    resizable: false
    //  },
    //  name: 'speech'
    //});
    //http://stackoverflow.com/questions/22002010/addon-sdk-way-to-make-a-dialog
    //https://github.com/mozilla/addon-sdk/blob/master/lib/sdk/window/utils.js
    this.setTitle();
    if(this.win) {
      this.worker.port.emit("setText", selectionText);
    }
    if(!this.win) {
      this.win = require("sdk/window/utils").openDialog({
        features: Object.keys({
          minimizable: true,
          chrome: false,
          //toolbar: true,
          titlebar: true,
          alwaysRaised: true,
          centerscreen: true,
          private: true
        }).join() + ",width=740,height=230",
        name: "speech"
      });

      this.win.addEventListener("load", function () {
        tabs.activeTab.on("load", function (tab) {
          this.worker = tab.attach({
            contentScriptFile: data.url("js/content-script.js")
          });
          this.win.document.title = require("sdk/l10n").get("speech_id");
          this.worker.port.emit("setData", {
            prefs: this.ttsPrefs,
            text: selectionText,
            l10n: {rate:{
              "0":_("rate_options.s1_10"),
              "1":_("rate_options.s1_8"),
              "2":_("rate_options.s1_4"),
              "3":_("rate_options.s1_2"),
              "4":_("rate_options.s1"),
              "5":_("rate_options.s2"),
              "6":_("rate_options.s4"),
              "7":_("rate_options.s8"),
              "8":_("rate_options.s10")
            }}
          });
        }.bind(this));

        //Can't listen DOMContentLoaded and unload event when enable e10s.
        //this.win.addEventListener('DOMContentLoaded', function(event){
        //  this.win.document.title = require('sdk/l10n').get('speech_id');
        //}.bind(this), true);
        tabs.activeTab.url = data.url("ttsPanel.html");
      }.bind(this), false);
    }
  }
};

for(let i=0; i < prefsList.length; ++i){
  tts.ttsPrefs[prefsList[i]] = pref.get(name + prefsList[i]);
}

require("sdk/ui/button/action").ActionButton({
  id: "show-ttsPanel",
  label: "Speech",
  icon: {
    "16": data.url("images/icon.svg"),
    "32": data.url("images/icon.svg"),
    "64": data.url("images/icon.svg")
  },
  onClick:function handleClick(state) {
    tts.openDlg();
  }
});

let menuItem = contextMenu.Item({
  label: _("speech_id"),
  image: data.url("images/icon.svg"),
  context: contextMenu.PredicateContext(function(context){
    tts.selectionText = context.selectionText;
    return !!context.selectionText;
  }),
  contentScriptFile: data.url("js/context-menu.js"),
  accesskey: "v",
  onMessage: function () {
    tts.openDlg(tts.selectionText);
  }.bind(this)
});

exports.main = function (options, callbacks) {
  //see: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
  // use SpeechSynthesis, we need set about:config > media.webspeech.synth.enabled > true
  // change this setting need restart Firefox.
  let synthKey = "media.webspeech.synth.enabled";
  let synthEnabled = pref.get(synthKey);
  let utils = require("sdk/window/utils");
  let active = utils.getMostRecentBrowserWindow();
  let { viewFor } = require("sdk/view/core");

  if(!synthEnabled) {
    //if we detect this not enable yet, show notifyBox.
    pref.set(synthKey, true);
    let chromeWin = viewFor(active);

    let notifyBox = chromeWin.gBrowser.getNotificationBox();
    let buttons = [{
        isDefault: false,
        label: _("moreInfo"),
        callback: function(theNotification, buttonInfo, eventTarget){
          let tabs = require("sdk/tabs");
          tabs.open({
            url: "https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis"
          });
          return true;
        },
        type: "", // If a popup, then must be: "menu-button" or "menu".
        popup: null
    },
    {
        isDefault: false,
        label: _("restartLater"),
        callback: function(theNotification, buttonInfo, eventTarget){
        },
        type: "", // If a popup, then must be: "menu-button" or "menu".
        popup: null
    },
    {
        isDefault: true,
        label: _("restartNow"),
        callback: function(theNotification, buttonInfo, eventTarget){
          Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup)
              .quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
        },
        type: "", // If a popup, then must be: "menu-button" or "menu".
        popup: null
    }];
    //appendNotification( label , value , image (URL) , priority , buttons, eventCallback )
    notifyBox.appendNotification(_("needRestart"), "Enable TTS API support",
                                 data.url("images/icon.svg"),
                                 notifyBox.PRIORITY_INFO_HIGH, buttons,
                                 function(reason){
                                   //console.log("Reason is: " + reason);
                                 });
  }
};
