/*
* LN83 - TODO Fix IPC Sending to client
*/

var pamm = {};

/* Requires */
pamm.node = {};

pamm.node.app = require('app');
pamm.node.fs = require('fs');
pamm.node.ipc = require('ipc');
pamm.node.browserWindow = require('browser-window');
pamm.node.crashReporter = require('crash-reporter');


/* Additional Namespaces */
pamm.app = {};
pamm.browser = {};
pamm.path = {};
pamm.ipc = {};
pamm.settings = {};
pamm.constants = {};





/* App Helpers */
pamm.app.onReady = function(){
  pamm.node.crashReporter.start();

  pamm.ipc.registerListeners();

  pamm.browser.openWindow(pamm.path.toClientPath('index.html'), 'mainWindow');
  pamm.browser.getWindow('mainWindow').openDevTools();

  pamm.settings.getSettings(function(settings){
    console.log(settings);
  });
};

pamm.app.onAllClose = function(){
  if (process.platform != 'darwin'){
      app.quit();
  }
};


/* IPC Helpers */
pamm.ipc.registerListeners = function(){
  pamm.node.ipc.on('pamm', pamm.ipc.onPAMM);
};

pamm.ipc.onPAMM = function(event, payload){
  var command = '';
  var commandPayload = {};

  if(!!payload.command){
    command = payload.command;
  } else{
    throw new Error('PAMM - Server - IPC - onPAMM: Command not specified in payload');
  }

  if(!!payload.payload){
    commandPayload = payload.payload;
  } else{
    throw new Error('PAMM - Server - IPC - onPAMM: Payload not specified in payload');
  }

  switch(command){
  case 'settings.set':
    if(!!!commandPayload.settings){
      throw new Error('PAMM - Server - IPC - onPAMM: command "settings.set" must send an array of new settings with the key "settings"');
    } else{
      pamm.settings.set(commandPayload.settings);
    }
    break;

  default:

    break;
  }
};

pamm.ipc.send = function(eventName, payload){
  //TODO Fix IPC Sending to client
  var window = pamm.browser.getWindow('mainWindow');

  window.webContents.send(eventName, payload);
};

pamm.ipc.sendCommand = function(commandName, payload){
  var command = {
    'command': commandName,
    'payload': !!payload ? payload : {}
  };

  pamm.ipc.send('pamm', command);
};


/* Settings Helpers */
pamm.settings.set = function(settings){
  var settingsFileContent = {
    'settings': settings
  };

  var settingsFileContentFormated =  JSON.stringify(settingsFileContent, null, 4);

  pamm.node.fs.writeFile(pamm.constants.settingsFile, settingsFileContentFormated, function(err){
    if(err) throw err;
  });
};

pamm.settings.getSettings = function(cb){
  pamm.node.fs.exists(pamm.constants.settingsFile, function(exists){
    if(exists){
      pamm.node.fs.readFile(pamm.constants.settingsFile, function(err, data){
        if(err) throw err;

        var settings = JSON.parse(data);

        if(!!cb){
          cb(settings);
        }
      });
    } else{
      pamm.ipc.sendCommand('settings.promptToSet');
      if(!!cb){
        cb({
          'error': 'Prompting user to set settings...'
        });
      }
    }
  });
};


/* Browser Window Helpers */
pamm.browser.windows = [];
pamm.browser.windows.mainWindow = null;
pamm.browser.openWindow = function(windowUrl, params, windowName){
  var windowParams = {};
  if(!!params && typeof params === 'object'){//params is params
    windowParams = params;
  } else if(!!params && typeof params === 'string'){//params is windowName
    windowName = params;
  }

  //Check params for at least width and height
  if(!!!windowParams.width){
    windowParams.width = 1280;
  }

  if(!!!windowParams.height){
    windowParams.height = 720;
  }

  var windowKey = !!windowName ? windowName : "browserWindow" + (pamm.browser.windows.length + 1);


  pamm.browser.windows[windowKey] = new pamm.node.browserWindow(windowParams);
  pamm.browser.windows[windowKey].loadUrl(windowUrl);

  pamm.browser.windows[windowKey].on('closed', function(){
    pamm.browser.windows[windowKey] = null;
  });

  var returnObject = {
    'key': windowKey,
    'browser': pamm.browser.windows[windowKey]
  };

  return returnObject;
};

pamm.browser.getWindow = function(windowKey){
  var returnObject;

  if(!!pamm.browser.windows[windowKey]){
    returnObject = pamm.browser.windows[windowKey];
  } else{
    throw new Error('PAMM - Server - Browser - getWindow: Window Key is invalid');
  }

  return returnObject;
};

/* File Path Helpers */
pamm.path.toAbsolutePath = function(localPath){
  return __dirname + localPath;
};

pamm.path.toClientPath = function(clientPath){
  return pamm.path.toAbsolutePath('../../client/' + clientPath);
};


/* Constants */
pamm.constants.settingsFile = pamm.path.toAbsolutePath('/settings.json');


/* App Lifetime */
pamm.node.app.on('ready', pamm.app.onReady);
pamm.node.app.on('window-all-close', pamm.app.onAllClose);
