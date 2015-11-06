module.exports = function(Request) {

  Request.observe('before save', function beforeSave(ctx, next) {

    var request = ctx.instance || ctx.currentInstance;

    if(ctx.isNewInstance)
    	request.created = new Date();
    else
    	request.updated = new Date();

  	return next();

  });
  
};
