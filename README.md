# Mobilize

Organizes disaster relief and recovery aid.  

Mobilize does a few things:
1. Helps shelters staff for volunteers.
2. Captures needs and issues of victims in affected disaster areas.
3. Keeps disaster victims notified of relief efforts.

Mobilize was developed for the IBM [Bluemixathon](http://bluemixathon.devpost.com/)

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy)

## Also developed for this project

[https://github.com/avantassel/redcross-node](https://github.com/avantassel/redcross-node)

Try it out here
[redcross.mybluemix.net](http://redcross.mybluemix.net/redcross/shelters)

## Config environment variables

Running locally add values to .env file
```
  cp env-sample.json env.json
```

Running on IBM Bluemix add environment variables

User Defined:
  * TWILIO_NUMBER
  * MONGO_URI
  * SENDGRID_FROM_EMAIL

VCAP Services to add:
  * alchemy_api
  * twilio
  * sendgrid


## Strongloop Notes

```
  # if you add models you will need to run this
  lb-ng server/server.js client/js/services/lb-services.js
```

## Bluemix Notes

```
  cf logs mobilize --recent
```
