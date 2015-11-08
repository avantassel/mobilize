var vow 		  = require('vow')
	, _         = require('lodash')
  , request   = require('request')
	, dotenv		= require('../../env.json');

var env = process.env.VCAP_SERVICES ? process.env : (dotenv && dotenv.VCAP_SERVICES ? dotenv : null);

require('../../server/lib/Utils.js');

module.exports = function(Contact) {

	var lookupGeo = require('function-rate-limit')(5, 1000, function() {
    var geoService = Contact.app.dataSources.geocode;
    geoService.address.apply(geoService, arguments);
  });

	function getGeo(location){
    var deferred = vow.defer();
		if(!location || !location.lat)
			return deferred.reject( 'No Location' );

     lookupGeo(location.lat,location.lng, function(err, result) {
			     if (result && result.length) {
           deferred.resolve( [null, result[0]] );
         } else {
           deferred.resolve( ['No Geo Found', null] );
         }
       });
    return deferred.promise();
  }

  Contact.observe('before save', function beforeSave(ctx, next) {

    var contact = ctx.instance || ctx.currentInstance;

    if(ctx.isNewInstance)
    	contact.created = new Date();
    else
    	contact.updated = new Date();

    contact.mobile = Utils.formatPhone(contact.mobile,false);

		getGeo(contact.location).then(function(responseAddress){
			if(!responseAddress[0]){
				contact.address = responseAddress[1];
			}
			return Contact.getSentiment(contact.comments);
		}).then(function(responseSentiment){
			if(!responseSentiment[0]){
				contact.sentiment = responseSentiment[1].docSentiment;
			}
			return Contact.getKeywords(contact.comments);
		}).then(function(responseKeywords){
			if(!responseKeywords[0]){
				contact.keywords = responseKeywords[1].keywords;
			}
			//update instance
			if(ctx.isNewInstance)
				ctx.instance = contact;
			else
				ctx.data = contact;
      return next();
		},function error(err){
			return next();
		});

  });

  Contact.observe('after save', function afterSave(ctx, next) {

    var contact = ctx.instance || ctx.currentInstance;

		//TODO log sendgrid and twilio response
    if(ctx.isNewInstance){
			//Send Email
      Contact.sendEmailMessage(contact).then(function(emailResponse){
					// console.log('emailResponse',emailResponse);
					//Send Txt
					return Contact.sendTxtMessage(contact);
      })
			.then(function(txtResponse){
				// console.log('txtResponse',txtResponse);
				return next();
			},function error(err){
        console.log('Sendgrid Error',err);
        return next();
      });
    } else {
      return next();
    }
  });

	Contact.sendEmailMessage = function(contact){
		var deferred = vow.defer();

    if(env
			&& env.VCAP_SERVICES
      && env.VCAP_SERVICES['sendgrid']){

				//sendgrid config
				var sendgridConfig= env.VCAP_SERVICES['sendgrid'][0];
				var Sendgrid  = require('sendgrid')(sendgridConfig.credentials.username,sendgridConfig.credentials.password);

				var message = 'Thanks for contacting us, follow your status at ';
						message += Contact.app.get('url')+'#/conf/'+contact.id;

					Sendgrid.send({
					  to:       contact.email,
					  from:     process.env.SENDGRID_FROM_EMAIL || 'support@mobilize.mybluemix.net',
						fromname: 'Mobilize',
					  subject:  'Your request receipt',
					  text:     message
					}, function(err, result) {
					  if (err) {
							deferred.reject(err);
						} else {
						  deferred.resolve(result);
						}
					});

		} else {
      deferred.reject('Missing Twilio config');
    }

    return deferred.promise();
	};

  Contact.sendTxtMessage = function(contact){
    var deferred = vow.defer();

    if(env
			&& env.VCAP_SERVICES
      && env.VCAP_SERVICES['user-provided']
      && env.TWILIO_NUMBER){
      //twilio config
      var twilioConfig= env.VCAP_SERVICES['user-provided'][0];
      var Twilio 			= require('twilio')(twilioConfig.credentials.accountSID, twilioConfig.credentials.authToken);

			var message = 'Thanks for contacting us, follow your status at ';
					message += Contact.app.get('url')+'#/conf/'+contact.id;

      Twilio.sendMessage({
	          from: '+'+env.TWILIO_NUMBER,
	          to: Utils.formatPhone(contact.mobile,false),
	          body: message
	      }, function(err,result){

	        if(err){
	          deferred.reject(err);
	        } else {
	          deferred.resolve(result);
	        }
	      });
    } else {
      deferred.reject('Missing Twilio config');
    }

    return deferred.promise();
  };

  Contact.getSentiment = function(comments){
    	var deferred = vow.defer();

      if(env.VCAP_SERVICES
        && env.VCAP_SERVICES['alchemy_api']
        && env.VCAP_SERVICES['alchemy_api'].length){

        var alchemy_api = env.VCAP_SERVICES['alchemy_api'][0];
  			var args = { 'apikey': alchemy_api.credentials.apikey
          ,'outputMode': 'json'
          ,'text': comments
        };
				request({url: alchemy_api.credentials.url+'/text/TextGetTextSentiment', method: 'GET', qs: args}, function(err, response, body) {
					if (err) {
  			      deferred.resolve([err,null]);
  			    } else if (!err && response.statusCode !== 200) {
  			      deferred.resolve([response.statusCode,null]);
  			    } else {
  			      deferred.resolve([null,JSON.parse(body)]);
  			    }
  			  });
      } else {
        deferred.resolve(['Missing Alchemy config',null]);
      }
			return deferred.promise();
  };

  Contact.getKeywords = function(comments){
    	var deferred = vow.defer();

      if(env.VCAP_SERVICES
        && env.VCAP_SERVICES['alchemy_api']
        && env.VCAP_SERVICES['alchemy_api'].length){

        var alchemy_api = env.VCAP_SERVICES['alchemy_api'][0];
  			var args = { 'apikey': alchemy_api.credentials.apikey
          ,'outputMode': 'json'
          ,'text': comments
        };
  			request({url: alchemy_api.credentials.url+'/text/TextGetRankedKeywords', method: 'GET', qs: args}, function(err, response, body) {
					if (err) {
							deferred.resolve([err,null]);
						} else if (!err && response.statusCode !== 200) {
							deferred.resolve([response.statusCode,null]);
						} else {
							deferred.resolve([null,JSON.parse(body)]);
						}
  			  });
      } else {
        deferred.resolve(['Missing Alchemy config',null]);
      }
			return deferred.promise();
  }

};
