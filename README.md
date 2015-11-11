# Mobilize

<img src="client/images/icon.png?raw=true" alt="Mobilize logo" title="Mobilize" align="right" />

Mobilize is a Disaster Relief and Recovery Notification System.

Mobilize does a few things:

1. Captures disaster assessment, needs and issues from those affected in disaster areas.
2. Notifies shelters of people arriving at their shelter to help staff for volunteers.
3. Can notify those affected by disasters of relief and recovery efforts.

Mobilize was developed for the IBM [Bluemixathon](http://bluemixathon.devpost.com/)

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy)

## Also developed for this project

* RedCross shelters service written in nodejs and hosted on IBM Bluemix
  * [https://github.com/avantassel/redcross-node](https://github.com/avantassel/redcross-node)

* A video walk through of the app
  * [https://youtu.be/J3robwcidlk](https://youtu.be/J3robwcidlk)

## Config environment variables

Running locally add values to .env file.
Look at [env-sample.yml](env-sample.yml)
```
  cp env-sample.json env.json
```

Running on IBM Bluemix add environment variables.  
Look at [manifest-sample.yml](manifest-sample.yml) for setting these.  Values here will override those on Bluemix.

User Defined:
  * TWILIO_NUMBER="10 digit twilio number"
  * MONGO_URI="mongodb://user:pass@host:port/database"
  * SENDGRID_FROM_EMAIL="support@yourdomain.com"
  * NODE_ENV="production"
  * APP_URL="http://domain.com"

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
  cf push
  cf logs mobilize --recent
```

## What's been built
  * RedCross current shelters service
  * User signup and disaster data capture
  * Signup txt and email notifications
  * Admin for shelter staff
    * Allow admin to send user notifications

## Services used
  * IBM Bluemix
    * Alchemy API
    * Twilio
    * Sendgrid
    * Strongloop
    * NewRelic

## What's left to build
  * Add login and ACLs to endpoints
  * Allow admin to manage/add shelters other than RedCross shelters  
  * Reveal messages sent in admin
