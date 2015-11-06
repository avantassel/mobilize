var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.set("port", process.env.VCAP_APP_PORT || process.env.PORT || 3000);

app.set("host", process.env.VCAP_APP_HOST || 'localhost');

app.start = function() {
  // start the web server
  return app.listen(app.get("port"), app.get("host"), function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
