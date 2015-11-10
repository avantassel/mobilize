var vow 		  = require('vow')
	, _         = require('lodash')
	, async     = require('async')
  , request   = require('request')
	, dotenv		= require('../../env.json');

var env = (dotenv) ? dotenv : process.env;
var vcap = (dotenv && dotenv.VCAP_SERVICES) ? dotenv.VCAP_SERVICES : null;

try{
	vcap = (process.env.VCAP_SERVICES) ? JSON.parse(process.env.VCAP_SERVICES) : null;
} catch(e){
	console.log('Error parsing VCAP_SERVICES',e);
}

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
      Contact.sendSignupEmailMessage(contact).then(function(emailResponse){
					// console.log('emailResponse',emailResponse);
					//Send Txt
					return Contact.sendSignupTxtMessage(contact);
      })
			.then(function(txtResponse){
				// console.log('txtResponse',txtResponse);
				return next();
			},function error(err){
        console.log('Signup Error',err);
        return next();
      });
    } else {
      return next();
    }
  });

	Contact.sendSignupEmailMessage = function(contact){
		var deferred = vow.defer();

    if(vcap && env
			&& vcap['sendgrid']){

				//sendgrid config
				var sendgridConfig= vcap['sendgrid'][0];
				var Sendgrid  = require('sendgrid')(sendgridConfig.credentials.username,sendgridConfig.credentials.password);

				var message = 'Thanks for contacting us, you will be notified on relief and recovery efforts. ';
						message += ' <br><br>Mobilize Status:<br> ';
						message += (env.APP_URL) ? env.APP_URL+'/#/conf/'+contact.id : Contact.app.get('url')+'#/conf/'+contact.id;

					Sendgrid.send({
					  to:       contact.email,
					  from:     env.SENDGRID_FROM_EMAIL || 'support@mobilize.mybluemix.net',
						fromname: 'Mobilize',
					  subject:  'Your Request',
					  html:     message
					}, function(err, result) {
					  if (err) {
							deferred.reject(err);
						} else {
						  deferred.resolve(result);
						}
					});

		} else {
      deferred.reject('Missing Sendgrid config');
    }

    return deferred.promise();
	};

  Contact.sendSignupTxtMessage = function(contact){
    var deferred = vow.defer();

    if(vcap && env
			&& vcap['user-provided']
      && env.TWILIO_NUMBER){
      //twilio config
      var twilioConfig= vcap['user-provided'][0];
      var Twilio 			= require('twilio')(twilioConfig.credentials.accountSID, twilioConfig.credentials.authToken);

			var message = 'Thanks for contacting us, you will be notified on relief and recovery efforts. ';
					message += (env.APP_URL) ? env.APP_URL+'/#/conf/'+contact.id : Contact.app.get('url')+'#/conf/'+contact.id;

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

	Contact.sendCustomEmailMessage = function(contact,message){
		var deferred = vow.defer();

    if(vcap && env
			&& vcap['sendgrid']){

				//sendgrid config
				var sendgridConfig= vcap['sendgrid'][0];
				var Sendgrid  = require('sendgrid')(sendgridConfig.credentials.username,sendgridConfig.credentials.password);

					message += ' <br><br>Mobilize Status:<br> ';
					message += (env.APP_URL) ? env.APP_URL+'/#/conf/'+contact.id : Contact.app.get('url')+'#/conf/'+contact.id;

					Sendgrid.send({
					  to:       contact.email,
					  from:     env.SENDGRID_FROM_EMAIL || 'support@mobilize.mybluemix.net',
						fromname: 'Mobilize',
					  subject:  'Disaster Relief Update',
					  html:     message
					}, function(err, result) {
					  if (err) {
							deferred.reject(err);
						} else {
						  deferred.resolve(result);
						}
					});

		} else {
      deferred.reject('Missing Sendgrid config');
    }

    return deferred.promise();
	};

  Contact.sendCustomTxtMessage = function(contact,message){
    var deferred = vow.defer();

    if(vcap && env
			&& vcap['user-provided']
      && env.TWILIO_NUMBER){
      //twilio config
      var twilioConfig= vcap['user-provided'][0];
      var Twilio 			= require('twilio')(twilioConfig.credentials.accountSID, twilioConfig.credentials.authToken);

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

	// TODO maybe update to use watson-developer-cloud
	//https://github.com/watson-developer-cloud/node-sdk?cm_mc_uid=04169636657214466565885&cm_mc_sid_50200000=1447127750#alchemy-language

  Contact.getSentiment = function(comments){
    	var deferred = vow.defer();

      if(vcap
        && vcap['alchemy_api']
        && vcap['alchemy_api'].length){

        var alchemy_api = vcap['alchemy_api'][0];
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

			if(vcap
				&& vcap['alchemy_api']
				&& vcap['alchemy_api'].length){

        var alchemy_api = vcap['alchemy_api'][0];
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
  };

	Contact.sendNotifyMessage = function(message,callback){

		Contact.find({},function(err,users){

			if(err || !users)
				return callback(err || 'No users found',null);

			async.eachSeries(users,function(user,cb){
				var emailResp = '';
				Contact.sendCustomEmailMessage(user,message).then(function(emailResponse){
						// console.log('emailResponse',emailResponse);
						emailResp = emailResponse;
						//Send Txt
						return Contact.sendCustomTxtMessage(user,message);
				}).then(function(txtResponse){
					Contact.app.models.Message.create({'created':new Date,'contactId': user.id,'message':message,'emailResponse':emailResp,'txtResponse':txtResponse},function(err,msgResponse){
						cb(null);
					});
				}, function error(err){
					cb(null);
				});
			},function done(){
        callback(null,true);
      });

		});

	};

	Contact.remoteMethod(
        'sendNotifyMessage',
        {
          accepts: [
            { arg: 'message', type: 'string' }
          ],
          returns: {arg: 'response', type: 'object'},
          http: {path: '/sendNotifyMessage', verb: 'post'},
          description: "Sends notification to all users"
        }
    );

};
