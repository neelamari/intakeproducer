var express = require('express');
var app = express();

var Cfenv = require('cfenv');
var MessageHub = require('message-hub-rest');
var appEnv = Cfenv.getAppEnv();
var instance;
var cleanedUp = false;
var topic = 'projects';
var exampleEvent = {
   "requestId":"CSR00001",
   "assignedTo":"John Klein",
   "organization":"Digital Group",
   "team":"CD BIO",
   "serviceRequested":"Enhancement",
   "requestedBy":[
      {
         "id":"john123",
         "name":"John Klein",
         "email":"john.klein@yahoo.com",
         "phone":"510-366-8123"
      }
   ],
   "projectId":"project233",
   "requestEvents":[
      {
         "requestEvent":"CSR Project Created",
         "createdAt":"2013-01-29T08:43:00Z",
         "timeBucket":[
            "2013-01-29-day",
            "2013-04-week",
            "2013-01-month",
            "2013-01-quarter",
            "2013-year"
         ]
      },
      {
         "requestEvent":"Completed",
         "createdAt":"2013-01-29T08:43:00Z",
         "timeBucket":[
            "2013-01-29-day",
            "2013-04-week",
            "2013-01-month",
            "2013-01-quarter",
            "2013-year"
         ]
      }
   ]
};

app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("server starting on " + appEnv.url);
});

app.get('/', function (req, res) {
  pushMessage(JSON.stringify(exampleEvent));
  res.send(JSON.stringify(exampleEvent));
});

var start = function(restEndpoint, apiKey, callback) {
  if(!appEnv.services || (appEnv.services && Object.keys(appEnv.services).length === 0)) {
    if(restEndpoint && apiKey) {
      appEnv.services = {
        "messagehub": [
           {
              "label": "intakemessagehub",
              "credentials": {
                 "api_key": apiKey,
                 "kafka_rest_url": restEndpoint,
              }
           }
        ]
      };
    } else {
      console.error('A REST Endpoint and API Key must be provided.');
      process.exit(1);
    }
  } else {
    console.log('Endpoint and API Key provided have been ignored, as there is a valid VCAP_SERVICES.');
  }

  instance = new MessageHub(appEnv.services);

  instance.topics.create(topic)
      .then(function(response) {
        console.log('topic created');
      })
      .fail(function(error) {
        console.log(error);
        stop(1);
      });

};

var pushMessage = function(message) {
    var list = new MessageHub.MessageList();
    var message = {
      user: "neelamari",
      message: message,
    }

    list.push(JSON.stringify(message));

    instance.produce(topic, list.messages)
      .fail(function(error) {
        throw new Error(error);
      });

     console.log('Message sent:' + message);
};

var registerExitHandler = function(callback) {
  if(callback) {
    var events = ['exit', 'SIGINT', 'uncaughtException'];

    for(var index in events) {
      process.on(events[index], callback);
    }
  } else if(!callback) {
    throw new ReferenceException('Provided callback parameter is undefined.');
  }
};

// Register a callback function to run when
// the process exits.
registerExitHandler(function() {
  stop();
});

var stop = function(exitCode) {
  exitCode = exitCode || 0;

  if(!cleanedUp) {
    console.log('Running exit handler.');
    cleanedUp = true;
    process.exit(exitCode);
  }
};

// If this module has been loaded by another module, don't start
// the service automatically. If it's being started from the command license
// (i.e. node app.js), start the service automatically.
if(!module.parent) {
  if(process.argv.length >= 4) {
    start(process.argv[process.argv.length - 2], process.argv[process.argv.length - 1]);
  } else {
    start();
  }
}

module.exports = {
  start: start,
  stop: stop,
  appEnv: appEnv
}
