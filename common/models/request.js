module.exports = function(Request) {

  Request.observe('before save', function beforeSave(ctx, next) {

    var request = ctx.instance || ctx.currentInstance;

    if(ctx.isNewInstance)
    	request.created = new Date();
    else
    	request.updated = new Date();

  	return next();

  });

  Request.observe('after save', function afterSave(ctx, next) {
    //alchemy
    process.env.VCAP_SERVICES['alchemy_api'][0]
    //twilio
    process.env.VCAP_SERVICES['user-provided'][0]
  });

};
