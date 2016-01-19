// packages
// =============================================================================
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var morgan = require("morgan");
var mongoose = require("mongoose");

var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
var config = require("./config"); // get our config file
var User = require("./models/user"); // get mongoose model

// configuration
// =============================================================================
var port = process.env.PORT || 8080;
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use Body Parser so we can get info from POST and/or URL Parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// routes
// =============================================================================

app.get('/', function(req, res) {
  res.send("Hello! The api is at http://localhost:" + port);
});

// setup an initial user
app.get('/setup', function(req, res) {

  // create a sample user
  var cooper = new User({
    name: "Cooper Dog",
    password: "kitty",
    admin: true
  });

  // save the sample user
  cooper.save(function(err) {
    if (err) {
      throw err;
    }

    console.log("User saved successfully!");
    res.json({success: true});
  });
});

// API routes
// =============================================================================

// get an instance of router for API routes
var apiRoutes = express.Router();

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({success: false, message: "Authentication failed. User not found."});
    }

    else if (user) {
      // check if password passes
      if (user.password != req.body.password) {
        res.json({success: false, message: "Authentication failed. Wrong password."});
      }

      else {
        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 1440 // 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: "Enjoy your token",
          token: token
        });
      }
    }
  })
});

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks up
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({success: false, message: 'failed to authenticate token.'});
      }
      else {
        // if everytghing is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  }
  else {
    // if there was no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided'
    })
  }
})

// route to show a random message(GET http://localhost:8080/api)
apiRoutes.get('/', function(req, res) {
  res.json({message: "Welcome to the coolest API in the world!"});
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

app.use('/api', apiRoutes);

// start server
// =============================================================================
app.listen(port);
console.log("We're all connected on port " + port);

/* token
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyIkX18iOnsic3RyaWN0TW9kZSI6dHJ1ZSwiZ2V0dGVycyI6e30sIndhc1BvcHVsYXRlZCI6ZmFsc2UsImFjdGl2ZVBhdGhzIjp7InBhdGhzIjp7Il9fdiI6ImluaXQiLCJhZG1pbiI6ImluaXQiLCJwYXNzd29yZCI6ImluaXQiLCJuYW1lIjoiaW5pdCIsIl9pZCI6ImluaXQifSwic3RhdGVzIjp7Imlnbm9yZSI6e30sImRlZmF1bHQiOnt9LCJpbml0Ijp7Il9fdiI6dHJ1ZSwiYWRtaW4iOnRydWUsInBhc3N3b3JkIjp0cnVlLCJuYW1lIjp0cnVlLCJfaWQiOnRydWV9LCJtb2RpZnkiOnt9LCJyZXF1aXJlIjp7fX0sInN0YXRlTmFtZXMiOlsicmVxdWlyZSIsIm1vZGlmeSIsImluaXQiLCJkZWZhdWx0IiwiaWdub3JlIl19LCJlbWl0dGVyIjp7ImRvbWFpbiI6bnVsbCwiX2V2ZW50cyI6e30sIl9tYXhMaXN0ZW5lcnMiOjB9fSwiaXNOZXciOmZhbHNlLCJfZG9jIjp7Il9fdiI6MCwiYWRtaW4iOnRydWUsInBhc3N3b3JkIjoia2l0dHkiLCJuYW1lIjoiQ29vcGVyIERvZyIsIl9pZCI6IjU2OWQ3YTU0YTU2ZGI2YmMxMDg3OWY0MyJ9LCJfcHJlcyI6eyIkX19vcmlnaW5hbF9zYXZlIjpbbnVsbCxudWxsXX0sIl9wb3N0cyI6eyIkX19vcmlnaW5hbF9zYXZlIjpbXX0sImlhdCI6MTQ1MzE2NDQzNSwiZXhwIjoxNDUzMTY1ODc1fQ.5BnvJJHG0MjazdIGKHJvewE1t0FhIOtec1PzYBrZ7as
*/
