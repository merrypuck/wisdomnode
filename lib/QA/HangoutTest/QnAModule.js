/**
 * Copyright (c) 2013 Wisdomly Inc.
 * This code is the property of Wisdomly Inc. and can not be copied
 * or redistributed without permission.
 *
 * Author: Kevin Miller (kevin@wisdom.ly)
 * Description:
 * ------------
 * This module handles the QnA proposed questions by spectators.
 * 
 * We create a QnAModule object for each session that has a QnA component
 * enabled. The QnAModule keeps track of all questions proposed by spectators,
 * as well as the votes of each question. The moderator of the talk is shown
 * the list of proposed questions in descending order ranked by upvotes. 
 * 
 * When a spectator proposes his or her question they are allowed to remove the
 * question if they submitted the question in error. A spectator not allowed to 
 * vote on his or her question and is only allowed to vote on a question once.  
 *
 * The moderator of the talk has the ability to discard a question if he or she
 * feels that the question is not worthy to be asked. 
 *
 * The client side code is at ../QnAClient.js
 *
 * USAGE:
 * var QnAModule = require("./QnAModule");
 * var crypto = require('crypto');
 * shasum = undefined;
 * // socket intitialization.
 * var io = require('socket.io').listen(80);
 *
 * QnAModule.initialize(sessionID, io, database);
 * io1.sockets.on('connection', function (socket) {
 *   QnAModule.subscribe(socket, crypto);
 * }
 */

 var crypto = require('crypto');
 shasum = undefined;

 QnAModule = {
  

  QEVENTS : {
    NEWQSEND : "qa-newquestionsend",
    UPDATEQUESTION : "qa-updatequestion",
    UPVOTE: "qa-upvote",
    DOWNVOTE : "qa-downvote",
    DELQ : "qa-deletequestion",
    ANSWERINGQ : "qa-answeringquestion",
    ANSWEREDQ : "qa-answeredquestion",
    REMOVEQ : "qa-removequestion",
    SUBSCRIBE : "qa-subscribe",
    QALREADYASKED : "qa-qalreadyasked"
  },

  roomID : undefined,
  io : undefined,
  db : undefined,
  sessionID : undefined,
  socket : undefined,

      //object to hold all questionObjects
      questionDictionary : undefined,
      deletedQDictionary : undefined, 
      
      //Maintains the ranking of the questions defined in the
      //questionDictionary 
      rankList : undefined,
      rankClosestToZero: undefined,

      questionsCount : 0, //tracks the number of active questions
      questionIDTracker : 0,
      
      //Defines the different states a questionObject can be in
      QSTATE : {
        DEFAULT : 0,
        DELETED : 1,
        ANSWERED : 2, 
        ANSWERING : 3,
      },

      initialize : function(nsessionID, nio, ndb){
        this.sessionID = nsessionID;
        this.io = nio;
        this.db = ndb;
        this.roomID = 'qa-' + nsessionID;
        this.questionDictionary = {};
        this.deletedQDictionary = {};
        this.rankList = [];

      },

      subscribe : function(socket){

        var crypto = crypto;
        var self = this;

        socket.join(this.roomID);

        this.socket = socket;

        socket.on(this.QEVENTS.UPVOTE, function(data){
          self.upvoteQuestion(data.questionID, data.userID);
          self.sendUpdatedQList(self);
        });

        socket.on(this.QEVENTS.DOWNVOTE, function (data) {
          self.downvoteQuestion(data.questionID, data.userID);
          self.sendUpdatedQList(self);
        });

        socket.on(this.QEVENTS.NEWQSEND, function (data) {
              //need to reset the hash each time a new question is created
              if(self.addQuestion(data)){
                self.sendUpdatedQList(self);
              }
              else{
                console.log("Did not complete question add");
              }
            });

        socket.on(this.QEVENTS.SUBSCRIBE, function (data) {
              //do something here with userID?
              socket.emit(self.QEVENTS.UPDATEQUESTION, { qDict : self.questionDictionary, rankList : self.rankList})
            });

        socket.on(this.QEVENTS.DELQ, function (data) {
          console.log("REMOVING QUESTION: " + self.questionDictionary[data.questionID])
          self.removeQuestion(data.questionID);
          self.sendUpdatedQList(self);   
        });             

      },

      sendUpdatedQList : function(self){
        self.io.sockets.in(self.roomID).emit(self.QEVENTS.UPDATEQUESTION, 
          { qDict : self.questionDictionary, rankList : self.rankList});
      },

        //returns the number of active questions in the array
        getQuestionsCount : function(){
          return this.questionsCount;
        },
        
        //returns the object containing all the proposed questions
        getQuestionsDictionary : function(){
          return this.questionDictionary;
        },
        
        //called when addQuestion is received from Spectator
        addQuestion : function(newQuestionObj){
          if(!(newQuestionObj.userID && newQuestionObj.question)){
            console.log("Error on QnA.addQuestion. Data: " + newQuestionObj);
            return false;
          }
          shasum = crypto.createHash('sha1'); 
          shasum.update(newQuestionObj.question);
          var qIDHash = shasum.digest('hex');

          //check to make sure that question was not already asked
          for (var i = 0; i < this.rankList.length; i++) {
            console.log("The questions in the qDict: " + this.questionDictionary[this.rankList[i]]);
            console.log("The questions in the qDict: " + this.rankList[i]);
            if(this.questionDictionary[this.rankList[i]].questionID === qIDHash){
              console.log("Error on QnA.addQuestion. Question already proposed.");
              this.socket.emit(this.QEVENTS.QALREADYASKED, newQuestionObj);
              return false
            }
          }
          //increase question counter
          this.questionsCount++;
          //calculate question ID by hasing question
          
          //assign the questionID to a value of the calculated hash
          newQuestionObj.questionID = qIDHash ;
          //index the new question based on the new questionID it was assigned
          this.questionDictionary[qIDHash] = newQuestionObj;
          //remove the question from the rank list
          this.rankList.push(qIDHash);
          //update the rank list based on the removed question
          this.updateRank();

          return true;
        },

        //called when removeQuestion is received from client
        removeQuestion : function(questionID){
          if(!this.questionDictionary[questionID]){
            console.log("Error in QnA.removeQuestion. Data: " + questionID);
            return false;
          }
          this.questionsCount--;
          this.deletedQDictionary[questionID] = this.questionDictionary[questionID];
          
          this.rankList.splice(this.rankList.indexOf(questionID),1);
          
          console.log("The rank list for this removed question is now: " + this.rankList);
          delete this.questionDictionary[questionID];
          return true;
        },

        //called when answeringQuestion is received from Moderator
        answeringQuestion : function(questionID){
          if(!this.questionDictionary[questionID]){
            console.log("Error in QnA.answeringQuestion. Data: " + questionID);
            return false;
          }
          this.questionDictionary[questionID].state = this.QSTATE.ANSWERING;
          return true;
        },

        upvoteQuestion : function(questionID, upUserID){
          if(!this.questionDictionary[questionID]){
            console.log("Error in QnA.upvoteQuestion. Data: " + questionID);
            return false;
          }
          this.questionDictionary[questionID].numupvotes++;
          this.questionDictionary[questionID].listOfUp.push(upUserID);
          this.updateRank();
          return true;
        },

        downvoteQuestion : function(questionID, downUserID){
          if(!this.questionDictionary[questionID]){
            console.log("Error in QnA.downvoteQuestion. Data: " + questionID);
            return false;
          }
          this.questionDictionary[questionID].numdownvotes++;
          this.questionDictionary[questionID].listOfDown.push(downUserID);
          this.updateRank();
          return true;
        },

        updateRank : function(){
          var self = this;
          this.rankList.sort(function(a,b){
            votesA = self.questionDictionary[a].numupvotes - self.questionDictionary[a].numdownvotes;
            votesB = self.questionDictionary[b].numupvotes - self.questionDictionary[b].numdownvotes;

            if(votesA==votesB)
              return 0
            else if(votesA>votesB)
              return -1
            else
              return 1
          });
        }
        
      };

      module.exports = exports = QnAModule;