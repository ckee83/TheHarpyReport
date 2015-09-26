/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var geolib=require('geolib');

module.exports = {

	// Show all users - Admin Only
	'index': function(req, res, next) {
		res.redirect('user/search');
		// User.find(function listUsers(err, users) {
		// 	if(err) return next(err);

		// 	// Pass users array to the view and render the page
		// 	res.view({users: users});
		// });
	},

	// Return view for /user/signup
	'signup': function(req, res) {
		// Display view /user/signup
		res.view();
	},

	// User Profile Renderer
	'profile': function(req, res, next) {

		User.findOne(req.param('id'), function foundUser(err, user) {
			if(err) return next(err);
			if(!user) return next();
			Job.find({ $or: [{ userid: user.id }, { courierid: user.id }, { courierid: undefined }] }, function (err, jobs) {
        Review.find({revieweeid: user.id}, function (err, reviews) {
          res.view({
            jobs: jobs,
            user: user,
            reviews: reviews
          });
        });
      });
		});
	},

	// User Edit Renderer
	'edit': function(req, res, next) {
		User.findOne(req.param('id'), function foundUser(err, user) {
			if(err) return next(err);
			if(!user) return next('User doesn\'t exist.');
			res.view({
				user: user
			});
		});
	},

	// Process Edit User
	'update': function(req, res, next) {
		User.update(req.param('id'), req.params.all(), function userUpdated(err) {
			// If theres an error, go back to the edit page
			if(err) return res.redirect('/user/edit/'+req.param('id'));

			// Otherwise show the new profile
			res.redirect('user/profile/'+req.param('id'));
		});
	},

  'uploadImage': function(req, res) {
    var file = req.file('abc');

    if(file == null || file == undefined) {
      return;
    }

    req.file('abc').upload({
      adapter: require("skipper-gridfs"),
      uri: 'mongodb://ec2-54-67-112-199.us-west-1.compute.amazonaws.com:27017/capstone.images'
    }, function (err, uploadedFiles){
      User.update({name: req.session.User.name}, {file: uploadedFiles[0].fd}, function () {
      	return res.send(200);
      });
    })
  },

  'getImage': function(req, res) {
    var adapter = require('skipper-gridfs')({
      uri:'mongodb://ec2-54-67-112-199.us-west-1.compute.amazonaws.com:27017/capstone.images'
    });
    var fd = req.params.id;
    adapter.read(fd, function (err, file) {
      res.contentType('image');
      res.send(file);
    })
  },

  'disable': function(req, res, next){
	  User.findOne(req.param('id'), function foundUser(err, user) {
			if (err) return next(err);
			if (!user) return next('User doesn\'t exist.');

			// Disable the user
			if (user.disable) {
		    User.update(req.param('id'), { disable: false }, function () { });
			}
			else {
		    User.update(req.param('id'), { disable: true }, function () { });
			}
			console.log("Redirecting! From Disable");
			// Go back to the list of users
			res.redirect('/user/');
	  });
  },

  // Set Watch Events
  'subscribe': function (req, res, next) {
    // Get the instance of the User we want to watch
    User.findOne(req.param('id'), function(err, user) {
      if(err) return next(err);

      // Subscribe to publishUpdate events on that user instance
      User.subscribe(req.socket, user, ['update']);

      // Let the client know it worked
      res.send(200);
    });
  },

  // Set Kourier Mode to Active
  'setActive': function (req, res, next) {
  	User.findOne(req.session.User.id, function(err, user) {
  		if(err) return next(err);

  		if(!user.isCourier) return next('User is not a kourier');

  		user.isActive=true;
			User.update(user.id, user, function userUpdated(err) {
				if(err) return next(err);

				// Emit publishUpdate event to let socket listeners know data has changed
      	User.publishUpdate(user.id, {isActive: true}); 
      	res.send({isActive: true});
			}); 		
  	});
  },

  // Set Kourier Mode to Inactive
  'setInactive': function (req, res, next) {
  	User.findOne(req.session.User.id, function(err, user) {
  		if(err) return next(err);

  		if(!user.isCourier) return next('User is not a kourier');

  		user.isActive=false;
			User.update(user.id, user, function userUpdated(err) {
				if(err) return next(err);

				// Emit publishUpdate event to let socket listeners know data has changed
      	User.publishUpdate(user.id, {isActive: false}); 
      	res.send({isActive: false});
			}); 		
  	});
  },

	// Delete User
	'delete': function(req, res, next) {
		User.findOne(req.param('id'), function foundUser(err, user) {
			if(err) return next(err);
			if(!user) return next('User doesn\'t exist.');

			// Delete the user
			User.destroy(req.param('id'), function userDestroyed(err) {
				if(err) return next(err);
				console.log("Delete Error!");
			});
			console.log("Redirecting!");
			// Go back to the list of users
			res.redirect('/user/');
		});
	}
};
