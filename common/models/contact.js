var vow 		  = require('vow')
	, _         = require('lodash')
  , request   = require('request')
	, dotenv		= require('../../env.json');

var env = process.env.VCAP_SERVICES ? process.env : (dotenv && dotenv.VCAP_SERVICES ? dotenv : null);

require('../../server/lib/Utils.js');

module.exports = function(Contact) {

  Contact.observe('before save', function beforeSave(ctx, next) {

    var contact = ctx.instance || ctx.currentInstance;

    if(ctx.isNewInstance)
    	contact.created = new Date();
    else
    	contact.updated = new Date();

    contact.mobile = Utils.formatPhone(contact.mobile,false);

    //Alchemy API calls
    if(contact.comments){
      Contact.getSentiment(contact.comments).then(function(response){
					contact.sentiment = response.docSentiment;
          return Contact.getKeywords(contact.comments);
      }).then(function(response){
        contact.keywords = response.keywords;
        return next();
      },function error(err){
        console.log('Alchemy Error',err);
        return next();
      });

    } else {
    	return next();
    }

  });

  Contact.observe('after save', function afterSave(ctx, next) {

    var contact = ctx.instance || ctx.currentInstance;

    if(ctx.isNewInstance){
      Contact.sendMessage(contact).then(function(){
          return next();
      },function error(err){
        console.log('Twilio Error',err);
        return next();
      });
    } else {
      return next();
    }
  });

  Contact.sendMessage = function(contact){
    var deferred = vow.defer();

    if(env
			&& env.VCAP_SERVICES
      && env.VCAP_SERVICES['user-provided']
      && env.TWILIO_NUMBER){
      //twilio
      var twilio      = env.VCAP_SERVICES['user-provided'][0];
      var Twilio 			= require('twilio')(twilio.credentials.accountSID, twilio.credentials.authToken);
      var txt_message = 'Thanks for contacting us, follow your status at';
			txt_message += (process.env.NODE_ENV == 'production') ? 'http://mobilize.mybluemix.com/conf/'+contact.id : 'http://localhost:3000/conf/'+contact.id;

      Twilio.sendMessage({
	          from: '+'+env.TWILIO_NUMBER,
	          to: Utils.formatPhone(contact.mobile,false),
	          body: txt_message
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
  			      deferred.reject(err);
  			    } else if (!err && response.statusCode !== 200) {
  			      deferred.reject(response.statusCode);
  			    } else {
  			      deferred.resolve(body);
  			    }
  			  });
      } else {
        deferred.reject('Missing Alchemy config');
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
  			      deferred.reject(err);
  			    } else if (!err && response.statusCode !== 200) {
  			      deferred.reject(response.statusCode);
  			    } else {
  			      deferred.resolve(body);
  			    }
  			  });
      } else {
        deferred.reject('Missing Alchemy config');
      }
			return deferred.promise();
  }

};
