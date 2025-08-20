// Centralized export of all controllers

module.exports = {
  auth: require('./authController'),
  prompt: require('./promptController'),
  challenge: require('./challengeController'),
  artwork: require('./artworkController'),
  like: require('./likeController'),
  user: require('./userController'),
};
