QnA = {
    
      roomid : undefined,
      io : undefined,
      db : undefined,
      sessionID : undefined,

      //object to hold all questionObjects
      questionDictionary : {},
      
      //Maintains the ranking of the questions defined in the
      //questionDictionary 
      rankList : undefined,

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
          QnA.sessionID = nsessionID;
          QnA.io = nio;
          QnA.db = ndb;
          QnA.roomid = 'qa-' + nsessionID;
        },

        subscribe : function(socket){

          socket.join(QnA.roomid);

          //fill this with the on calls
        },

        //returns the number of active questions in the array
        getQuestionsCount : function(){
          return QnA.questionsCount;
        },
        
        //returns the object containing all the proposed questions
        getQuestionsDictionary : function(){
          return QnA.questionDictionary;
        },
        
        //returns ID of last question added
        getCurrentQuestionIDTracker : function(){
          return QnAquestionIDTracker;
        },

        //called when addQuestion is received from Spectator
        addQuestion : function(newQuestionObj){
          if(!(newQuestionObj.userID && newQuestionObj.question)){
            console.log("Error on QnA.addQuestion. Data: " + newQuestionObj);
            return false;
          }
          for (var i = 0; i < QnA.questionDictionary.length; i++) {
            if(questionDictionary[i].question.toLowerCase() == newQuestionObj.question.toLowerCase()){
              console.log("Error on QnA.addQuestion. Question already proposed.")
              return false
            }
          };
          //increase question counter
          QnA.questionsCount++;

          shasum.update(newQuestionObj.question);
          var qIDHash = shasum.digest('hex');
          console.log(qIDHash);

          //assign the questionID to a value of questionIDTracker+1
          newQuestionObj.questionID = qIDHash ;
          //index the new question based on the new questionID it was assigned
          QnA.questionDictionary[qIDHash] = newQuestionObj;
          return true;
        },

        //called when removeQuestion is received from client
        removeQuestion : function(questionID){
          if(!QnA.questionDictionary[questionID]){
            console.log("Error in QnA.removeQuestion. Data: " + questionID);
            return false;
          }
          QnA.questionsCount--;
          QnA.questionDictionary[questionID].state = QnA.QSTATE.DELETED;
          return true;
        },

        //called when answeringQuestion is received from Moderator
        answeringQuestion : function(questionID){
          if(!QnA.questionDictionary[questionID]){
            console.log("Error in QnA.answeringQuestion. Data: " + questionID);
            return false;
          }
          QnA.questionDictionary[questionID].state = QnA.QSTATE.ANSWERING;
          return true;
        },

        upvoteQuestion : function(questionID){
          if(!QnA.questionDictionary[questionID]){
            console.log("Error in QnA.upvoteQuestion. Data: " + questionID);
            return false;
          }
          QnA.questionDictionary[questionID].numupvotes++;
          return true;
        },

        downvoteQuestion : function(questionID){
          if(!QnA.questionDictionary[questionID]){
            console.log("Error in QnA.downvoteQuestion. Data: " + questionID);
            return false;
          }
          QnA.questionDictionary[questionID].numupvotes--;
          return true;
        },

        emitQuestions : function(){
          //
        }
      
  };

 module.exports = exports = QnA;