var vow 		  = require('vow')
	, _         = require('lodash')
  , request   = require('request');

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
      Contact.getSentiment(contact.comments).then(function(sentiment){
          contact.sentiment = sentiment;
          return Contact.getKeywords(contact.comments);
      }).then(function(keywords){
        contact.keywords = keywords;
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

    if(process.env.VCAP_SERVICES
      && process.env.VCAP_SERVICES['user-provided']
      && process.env.TWILIO_NUMBER){
      //twilio
      var twilio      = process.env.VCAP_SERVICES['user-provided'][0];
      var Twilio 			= require('twilio')(twilio.accountSID, twilio.authToken);
      var txt_message = 'Thanks for contacting us, follow your status at http://mobilize.mybluemix.com/conf/'+contact.id;

      Twilio.sendMessage({
	          from: '+'+process.env.TWILIO_NUMBER,
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

      if(process.env.VCAP_SERVICES
        && process.env.VCAP_SERVICES['alchemy_api']
        && process.env.VCAP_SERVICES['alchemy_api'].length){
          
        var alchemy_api = process.env.VCAP_SERVICES['alchemy_api'][0];
  			var args = { 'apikey': alchemy_api.apikey
          ,'outputMode': 'json'
          ,'text': comments
        };
  			request.get({url: alchemy_api.credentials.url+'/text/TextGetTextSentiment', params: args}, function(err, response, body) {
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

      if(process.env.VCAP_SERVICES
        && process.env.VCAP_SERVICES['alchemy_api']
        && process.env.VCAP_SERVICES['alchemy_api'].length){

        var alchemy_api = process.env.VCAP_SERVICES['alchemy_api'][0];
  			var args = { 'apikey': alchemy_api.apikey
          ,'outputMode': 'json'
          ,'text': comments
        };
  			request.get({url: alchemy_api.credentials.url+'/text/TextGetRankedKeywords', params: args}, function(err, response, body) {
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
