/**
 * Copyright (c) 2013 Wisdomly Inc.
 * This code is the property of Wisdomly Inc. and can not be copied
 * or redistributed without permission.
 *
 * Author: Mukund Jha (mj@wisdom.ly)
 * Description:
 * ------------
 * This module handles twitter feeds for a Wisdom Session.
 * 
 * We maintain a persistant connection with the streaming API and listen on
 * terms (hastags,userids) that are relevant to the session.
 * Once we get response from twitter for relevant terms, we publish it to all
 * all the clients via open socket.
 * 
 * Module also provisions for re-tweeting and replying to the tweet. The
 * re-tweets and replies are recieved through socket and then passed to twitter
 * asynchronously.
 *
 * The client side code is at ../client-wisdom-twitter.js
 *
 * NOTE: We could have implemented this streaming at client side but that would
 * mean having multiple open connections to twitter, instead we just want one
 * open connection to best utilize the streaming API limits.
 *
 * USAGE:
 * var wtwitter = require('/path/to/node-wisdom-twitter');
 * // socket intitialization.
 * var io = require('socket.io').listen(80);
 *
 * var twitterCredentials = {
 *  consumer_key: 'Whatever is your key',
 *  consumer_secret: 'BIG_ASS_SECRET',
 *  access_token_key: 'keys',
 *  access_token_secret: 'EVEN_BIGGER_TOKEN_SECRET':
 *  };
 *
 * // Initialize the wtwitter object.
 * 
 * var status = wtwitter.init(io, twitterCredentials, sessionId,
 * ["optional", "#tags", "on" , "which", "you", "want", "to","#listen"],
 * ["users", "you", "want", "to", "listen"]);
 *
 * if (status === "true") {
 *   console.log("Connection working...you are good to go.");
 *   // To start listening do.
 *   wtwitter.startStream();
 * }
 */
 
// Import modules that are needed.

var io = require('socket.io'),
    ntwitter = require('ntwitter');

// Main class for twitter streams.
wtwitter = {
  // Terms and users which we are listening for.
  validTerms : [],
  validUsers : [],
  
  // Twitter credentials used for accessing twitter API.
  credentials : undefined,
  
  // Stored incoming streams.
  publicTweets : [],
  userTweets: [],
  
  // Twitter API object
  twit : undefined,

  // Twitter public stream object returned by the API when listenting for
  // cetrain terms.
  dataStream : undefined,
  
  // Socket object used for communication.
  mySocketIO : undefined,

  isStreaming : false,

  sessionId : "",

  roomId : "",

  numClients : 0,

  // Stats about tweets.
  tweetStats : {
    numTweetsRecieved : 0,
    numReplies : 0,
    numRetweets: 0,
    numValidTerms : 0,
    numValidUsers : 0
  },

  // Events on which we are listening.
  INCOMING_TWEET : 'incoming-tweet',
  INCOMING_REPLY : 'send-tweet-reply',
  INCOMING_RETWEET : 'send-retweet',
  SUBSCRIBE : 'subscribe-to-twitter',
  UNSUBSCRIBE : 'unsubscribe-to-twitter',
  SOCKET_ROOM_PREFIX : 'wisdom-twitter',

  // Num secs after which connection will automatically disconnect.
  // NOTE(mj) : Must increase it before we launch!!!!!
  DEFAULT_TIMEOUT : 3600,
  
  // Iinitialize the state for twitter listener. 
  init : function(socketIO, twitterCreds, sessionId,
      termsToListen, usersToListen) {
    var self = this;
    // Note that this is the socketIo Object not an individual socket.
    this.mySocketIO = socketIO;
    this.sessionId = sessionId;
    this.roomId = this.SOCKET_ROOM_PREFIX + '-' + sessionId;
    this.credentials = twitterCreds;
    this.validTerms = termsToListen;
    this.validUsers = usersToListen;
    this.numClients = 0;
    // Make a new twitter api client. 
    this.twit = new ntwitter(this.credentials);
    // Verify the connection.
    this.twit.verifyCredentials(function (err, data) {
      if (err) {
        console.log(err.data);
        return false;
      }
      else {
        // If connection is valid, add the event listeners.
        console.log("Twitter connection okay!..");
        return true;
      }
    });
  },

  // Method for clients to subscribe to the twitter stream.
  // Once users subscribe we put them all in same room and we always emit to
  // this room.
  subscribe : function(socket) {
    // Make them join the room. 
    // NOTE(mj): Assuming that join always takes care if people are rejoining
    // even if they are already joined.
    socket.join(this.roomId);

    // Increment the number of clients.
    this.numClients += 1;
    console.log('client has subscribed.');
    if (this.isStreaming === false) {
      this.startStream();
      this.isStreaming = true;
    }

    // Add event listeners.
    socket.on(this.INCOMING_REPLY, function (data) {
      console.log("Got Reply from " + data);
    });

    socket.on(this.INCOMING_RETWEET, function(data) {
      console.log("Got retweet from " + data);
    });
  },

  // TODO(mj): Do we want to unbind REPLY, RE-TWEET events?
  // TODO(mj): What about stoping the stream when there are no active clients.
  unsubscribe : function(socket) {
    // TODO(mj): What happens if the clients just keeps unsubscribing (?)
    this.numClients -= 1;
    console.log('client has unsubscribed.');
    socket.leave(this.roomId);
  },

  // Private method.
  // What to do with new tweet.
  _on_new_tweet : function(tweet) {
     console.log("processing tweet");
     this.tweetStats.numTweetsRecieved += 1;
     // We only emit to the particular room.
     this.mySocketIO.sockets.in(this.roomId).emit(this.INCOMING_TWEET, tweet);
  },

  // StartListening on the twitter streams.
  // TODO(mj) : Add support for listening to various users.
  startStream : function() {
    var self = this;

    if (this.validTerms.length <= 0 && this.twit !== undefined) {
      console.log("No valid terms to listen on");
      return false;
    }
    console.log("Listening on following terms: " + this.validTerms);
    // Listen on the twitter stream for certain keywords.
    this.twit.stream( 'statuses/filter', {track: this.validTerms},
      function(stream) {
        // Store this stream for further use.
        self.dataStream = stream;

        // What to do when a tweet comes in.
        stream.on('data', function(tweet) {
         // console.log(tweet.text);
          // Process the new tweet.
          self._on_new_tweet(tweet);
        });
        
        // Set a default timeout.
        setTimeout(stream.destroy, self.DEFAULT_TIMEOUT * 1000);
      });
  },

  // Call this function to close the stream.
  stopStream : function() {
    if (this.dataStream !== undefined) {
      this.dataStream.destroy();
    }
    console.log("Stopped listening to twitter stream");
  },

  retweet : function(data) {
    console.log("wtiwtter.retweet : Nice try..have paitence we are" +
        " still building this up!");
  },

  reply : function(data) {
    console.log("Nice try..have paitence we are still building this up!");
  },

  // TODO(mj) : Implement this so we can update the terms at any point.
  updateTerms : function(updatedList) {
  
  },

  // TODO(mj) : Implement this so we can update users at any point.
  updateUsers : function(updatedList) {

  },
}

// Export the twitter listener object.
module.exports = exports =  wtwitter;
