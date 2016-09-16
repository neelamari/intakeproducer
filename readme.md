#RUN THE Producer locally

  npm install

  node app.js <message_hub_rest_endpoint> <message_hub_api_key>

  curl http://localhost:6003

#RUN THE PRODUCER in BLUEMIX

  cf login

  cf push <intakeproducer>

  curl http://intakeproducer.mybluemix.net



