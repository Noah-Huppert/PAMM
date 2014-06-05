var pamm = {};

/* Requires */
pamm.client = {};
pamm.client.ipc = require('ipc');


/* Intial Setup */
window.$ = window.jQuery = require('./js/jquery-1.11.0.min.js');


/* Additional Namespaces */
pamm.dom = {};
pamm.app = {};
pamm.ipc = {};
pamm.constants = {};
pamm.settings = {};


/* Constants */
pamm.constants.news_url = 'http://pamods.github.io/news.html';


/* App Helpers */
pamm.app.onReady = function(){
  pamm.dom.setHandlers();
  pamm.dom.setSize();
  ko.applyBindings(pamm);
};


/* DOM Helpers */
pamm.dom.setHandlers = function(){
  $('#navbar li').click(pamm.dom.onMenuItemClick);
};

pamm.dom.setSize = function(){
  $('#navbar').height($(window).height());
  $('#newsView').load(pamm.constants.news_url);
};

pamm.dom.onMenuItemClick = function(){
  var itemName = $(this).text();

  pamm.dom.view.activeView(itemName);
};


/* DOM -> View Helpers */
pamm.dom.view = {};
pamm.dom.view.activeView = ko.observable('News');

pamm.dom.view.isActive = function(viewName){
  var isActive = pamm.dom.view.activeView() === viewName;
  return isActive;
};


/* Settings Helper */
pamm.settings.set = function(){
  var settings = {};

  $('#settingsView input').each(function(key, value){
    var settingsName = $(this).attr('name');
    var settingsValue = $(this).val();

    settings[settingsName] = settingsValue;
  });


  var ipcCommand = {
    'settings': settings
  };

  console.log(settings);

  pamm.ipc.sendCommand('settings.set', ipcCommand);
};


/* IPC Helpers */
pamm.ipc.registerListeners = function(){
    pamm.client.ipc.on('pamm', pamm.ipc.onPAMM);

    require('ipc').on('ping', function(message) {
      console.log(message);  // Prints "whoooooooh!"
    });
};

pamm.ipc.onPAMM = function(event, payload){
  var command = '';
  var commandPayload = {};

  if(!!payload.command){
    command = payload.command;
  } else{
    throw new Error('PAMM - Client - IPC - onPAMM: Command not specified in payload');
  }

  if(!!payload.payload){
    commandPayload = payload.payload;
  } else{
    throw new Error('PAMM - Client - IPC - onPAMM: Payload not specified in payload');
  }

  switch(command){
  case 'settings.promptToSet':
    pamm.dom.view.activeView('Settings');
    break;

  default:

    break;
  }
};

pamm.ipc.send = function(eventName, payload){
  pamm.client.ipc.send(eventName, payload);
};

pamm.ipc.sendCommand = function(commandName, payload){
  var command = {
    'command': commandName,
    'payload': !!payload ? payload : {}
  };

  pamm.ipc.send('pamm', command);
};


/* App Lifescycle */
$(document).ready(pamm.app.onReady);
