QnA = {
    

      QEVENTS : {
            NEWQSEND : "qa-newquestionsend",
            UPDATEQUESTION : "qa-updatequestion",
            UPVOTE: "qa-upvote",
            DOWNVOTE : "qa-downvote",
            DELQ : "qa-deletequestion",
            ANSWERINGQ : "qa-answeringquestion",
            ANSWEREDQ : "qa-answeredquestion",
            REMOVEQ : "qa-removequestion",
            SUBSCRIBE : "qa-subscribe"
        },

      roomID : undefined,
      io : undefined,
      db : undefined,
      sessionID : undefined,

      //object to hold all questionObjects
      questionDictionary : undefined, 
      
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
          console.log(this.sessionID);
          this.io = nio;
          this.db = ndb;
          this.roomID = 'qa-' + nsessionID;
          this.questionDictionary = {};
          this.rankList = [];

        },

        subscribe : function(socket, crypto ){

          var crypto = crypto;
          var self = this;

          socket.join(this.roomID);

          socket.on(this.QEVENTS.UPVOTE, function(data){
            self.upvoteQuestion(data.questionID, data.userID);
            self.io.sockets.in(self.roomID).emit(self.QEVENTS.UPDATEQUESTION, { qDict : self.questionDictionary, rankList : self.rankList});
          });

          socket.on(this.QEVENTS.DOWNVOTE, function (data) {
              self.downvoteQuestion(data.questionID, data.userID);
              self.io.sockets.in(self.roomID).emit(self.QEVENTS.UPDATEQUESTION, { qDict : self.questionDictionary, rankList : self.rankList});
          });

          socket.on(this.QEVENTS.NEWQSEND, function (data) {
              //need to reset the hash each time a new question is created
              shasum = crypto.createHash('sha1'); 
              if(self.addQuestion(data)){
                self.io.sockets.in(self.roomID).emit(self.QEVENTS.UPDATEQUESTION, { qDict : self.questionDictionary, rankList : self.rankList});
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
              self.io.sockets.in(self.roomID).emit(self.QEVENTS.UPDATEQUESTION, { qDict : self.questionDictionary, rankList : self.rankList})
          });             

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

          //check to make sure that question was not already asked
          for (var i = 0; i < this.rankList.length; i++) {
            if(this.questionDictionary[this.rankList[i]].question.toLowerCase() === newQuestionObj.question.toLowerCase()){
              console.log("Error on QnA.addQuestion. Question already proposed.")
              return false
            }
          }
          //increase question counter
          this.questionsCount++;
          //calculate question ID by hasing question
          shasum.update(newQuestionObj.question);
          var qIDHash = shasum.digest('hex');
          //assign the questionID to a value of the calculated hash
          newQuestionObj.questionID = qIDHash ;
          //index the new question based on the new questionID it was assigned
          this.questionDictionary[qIDHash] = newQuestionObj;

          this.rankList.push(qIDHash);
          this.updateRank(qIDHash);

          return true;
        },

        //called when removeQuestion is received from client
        removeQuestion : function(questionID){
          if(!this.questionDictionary[questionID]){
            console.log("Error in QnA.removeQuestion. Data: " + questionID);
            return false;
          }
          this.questionsCount--;
          this.questionDictionary[questionID].state = this.QSTATE.DELETED;
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
          this.updateRank(questionID);
          return true;
        },

        downvoteQuestion : function(questionID, downUserID){
          if(!this.questionDictionary[questionID]){
            console.log("Error in QnA.downvoteQuestion. Data: " + questionID);
            return false;
          }
          this.questionDictionary[questionID].numdownvotes++;
          this.questionDictionary[questionID].listOfDown.push(downUserID);
          this.updateRank(questionID);
          return true;
        },

        updateRank : function(questionID){

          this.rankList.sort(function(a,b){
            votesA = QnA.questionDictionary[a].numupvotes - QnA.questionDictionary[a].numdownvotes;
            votesB = QnA.questionDictionary[b].numupvotes - QnA.questionDictionary[b].numdownvotes;

            if(votesA==votesB)
              return 0
            else if(votesA>votesB)
              return -1
            else
              return 1
          });
        }
      
  };

 module.exports = exports = QnA;