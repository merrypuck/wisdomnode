/**
 * Copyright (c) 2013 Wisdom.ly Inc.
 * This code is the property of Wisdomly Inc. and can not be copied
 * or redistributed without permission.
 * Author: Mukund Jha (mj@wisdom.ly)
 * 
 * USAGE:
 *   var twit = twitterClient();
 *
 *   // To overload on what should happen when a tweet is receieved.
 *   twit.updateTweet = function(tweet) {
 *      // Do something
 *      alert(tweet.text);
 *   }
 *
 *   // You would need to subscribe to the tweets to get it.
 *   twit.subscribe();
 *
 *   // To send reply.
 *   twit.sendReply(reply);
 *   twit.sendReTweet(retweet);
 *
 *   // Unsubscribe when done.
 *   twit.usubscribe();
 */

// we pass down socket, jquery object.
// Assumes that socket is valid and open.
var TwitterClient = (function() {
  // returns the social-feed object.
  return {
    mySocket : undefined, 
    // TODO(mj): Have a global files for all these constants.
    INCOMING_TWEET: "incoming-tweet",
    OUTGOING_RETWEET : "send-retweet",
    OUTGOING_REPLY : "send-tweet-reply",
    SUBSCRIBE : 'subscribe-to-twitter',
    UNSUBSCRIBE : 'unsubscribe-to-twitter',                                       
    // JQUERY HANDLER
    $ : undefined, 
    init : function (socket, $) {
      this.mySocket = socket;
      this.$ = $;
      self = this;
      // Do event bindings.
      this.mySocket.on(this.INCOMING_TWEET, function (data) {
        //console.log('Incoming mesage' + JSON.stringify(data));
        self.updateTweet(data);
      });
    },
   
    subscribe : function() {
      console.log('subscribing');
      this.mySocket.emit(this.SUBSCRIBE, "dummyData");
    },

    unsubscribe : function() {
      console.log('unsubscribing');
      this.mySocket.emit(this.UNSUBSCRIBE, "dummyData");
    },

    updateTweet : function(tweet) {
      console.log('Incoming message' + tweet.text);
      var tweetHTML = "<div class='tweet'>" + tweet.text + "</div>";
      $("#socialFrame").append(tweetHTML);
    },

    sendReTweet : function(retweet) {
      // Do we always want to emit the user and session too(?).
      this.mysocket.emit(INCOMING_RETWEET, retweet);
    },
    
    sendReply : function(reply_tweet) {
      this.mysocket.emit(INCOMING_REPLY, reply_tweet);
    }
  }
});
