var self = require('sdk/self');
var data = self.data;
var contextMenu = require('sdk/context-menu');
var workers = require('sdk/content/worker');
var tabs = require('sdk/tabs');
var _ = require('sdk/l10n').get;

//read all preferences - start
var name = 'extensions.@ttsfox.';
var pref = require('sdk/preferences/service');
var ttsPrefs = {};
var prefsList = ['pitch', 'rate', 'volume'];
for(var i=0;i<prefsList.length;++i){
  ttsPrefs[prefsList[i]] = pref.get(name + prefsList[i]);
}
//read all preferences - end

function TTS(ttsPrefs) {
  this.ttsPrefs = ttsPrefs;
}

TTS.prototype.setTitle = function(){
  if(this.win) {
    var winArray = require('sdk/window/utils').windows(null, {includePrivate:true});
    var flag = false;
    for(var i=0;i<winArray.length;++i) {
      if(winArray[i] == this.win)
        flag = true;
    }
    if(flag) {
      this.win.document.title = require('sdk/l10n').get('speech_id');
    } else {
      this.win = null;
      this.worker = null;
    }
  }
};

TTS.prototype.openDlg = function(selectionText){
  //var { open } = require('sdk/window/utils');
  //var win = open(data.url('ttsPanel.html'), {
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
    this.worker.port.emit('setText', selectionText);
  }
  if(!this.win) {
    this.win = require('sdk/window/utils').openDialog({
      features: Object.keys({
        minimizable: true,
        chrome: true,
        //toolbar: true,
        titlebar: true,
        alwaysRaised: true,
        centerscreen: true,
        private: true
      }).join() + ',width=740,height=230',
      name: 'speech'
    });

    this.win.addEventListener('load', function () {
      tabs.activeTab.on('ready', function (tab) {
        this.worker = tab.attach({
          contentScriptFile: data.url('js/content-script.js')
        });
        this.win.document.title = require('sdk/l10n').get('speech_id');
        this.worker.port.emit('setData', {
          prefs: this.ttsPrefs,
          text: selectionText,
          l10n: {rate:{
            '0':_('rate_options.s1_10'),
            '1':_('rate_options.s1_8'),
            '2':_('rate_options.s1_4'),
            '3':_('rate_options.s1_2'),
            '4':_('rate_options.s1'),
            '5':_('rate_options.s2'),
            '6':_('rate_options.s4'),
            '7':_('rate_options.s8'),
            '8':_('rate_options.s10')
          }}
        });

      }.bind(this));

      //Can't listen DOMContentLoaded and unload event when enable e10s.
      //this.win.addEventListener('DOMContentLoaded', function(event){
      //  this.win.document.title = require('sdk/l10n').get('speech_id');
      //}.bind(this), true);
      tabs.activeTab.url = data.url('ttsPanel.html');
    }.bind(this), false);
  }
};
var tts = new TTS(ttsPrefs);

require('sdk/ui/button/action').ActionButton({
  id: 'show-ttsPanel',
  label: "Speech",
  icon: {
    '16': data.url('images/icon.svg'),
    '32': data.url('images/icon.svg'),
    '64': data.url('images/icon.svg')
  },
  onClick:function handleClick(state) {
    tts.openDlg();
  }
});

var menuItem = contextMenu.Item({
  label: _('speech_id'),
  image: data.url('images/icon.svg'),
  context: contextMenu.SelectionContext(),
  contentScriptFile: data.url('js/context-menu.js'),
  onMessage: function (selectionText) {
    tts.openDlg(selectionText);
  }.bind(this)
});
