var self = require('sdk/self');
var data = self.data;
var contextMenu = require("sdk/context-menu");
var pageMod = require("sdk/page-mod");

var name = "extensions.@ttsfox.";
var pref = require("sdk/preferences/service");
var lang = ['en-US', 'zh-TW'];
var ttsPrefs = {};
ttsPrefs.speechLanguage = lang[pref.get(name + 'SpeechLanguage')];

var menuItem = contextMenu.Item({
    label: "Speech",
    context: contextMenu.SelectionContext(),
    contentScriptFile: data.url("tts.js"),
    onMessage: function (selectionText) {
  }
});

pageMod.PageMod({
  include: ["*"],
  contentScriptFile: data.url("content-script.js"),
  contentScriptWhen: 'ready',
  onAttach: function(worker) {
    worker.port.emit("prefsChange", ttsPrefs);
    require("sdk/simple-prefs").on("", function(prefName){
      ttsPrefs.speechLanguage = lang[pref.get(name + prefName)];
      worker.port.emit("prefsChange", ttsPrefs);
    });
    //worker.port.on("first-para", function(firstPara) {
    //  console.log(firstPara);
    //});
  }
});
