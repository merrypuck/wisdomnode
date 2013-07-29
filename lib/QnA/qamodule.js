var QnA = function(){

    return {
        // Question Event Constants
        QEVENTS : {
            NEWQSEND : "qa-newquestionsend",
            UPDATEQUESTION : "qa-updatequestion",
            UPVOTE: "qa-upvote",
            DOWNVOTE : "qa-downvote",
            DELQ : "qa-deletequestion",
            ANSWERINGQ : "qa-answeringquestion",
            ANSWEREDQ : "qa-answeredquestion",
            REMOVEQ : "qa-removequestion"
        },

        // Question State Constants
        QSTATE : {
            DEFAULT : 0,
            DELETED : 1,
            ANSWERED : 2,
            ANSWERING : 3
        },

        //QnA attributes
        qaThis : undefined,
        qaSocket : undefined,
        userID : undefined,
        userName : undefined,
        sessionID : undefined,
        renderingCallback : undefined,
    
        //TODO: Should we include an emit in the initialize function that makes the server aware that a new QA object has been instantiated and pass it the whole proposedQList?

        initialize : function (socket, sessionID, userID, userName, renderQA) {
            console.log("Initializing QA Module Clientside...");
            
            qaThis =  this;     
            //set qaSocket to match clients
            qaThis.qaSocket = socket; 
            //callback function for rendering the QA view when updates needed
            qaThis.renderingCallback = renderQA; 
            //sets QnA.sessionID as sessionID of client 
            qaThis.sessionID = sessionID;
            //sets QnA.userID as userID of client
            qaThis.userID = userID;
            //sets QnA.userName as username of client
            qaThis.userName = userName;

            //initialize listeners for events emitted to client
            qaThis.initListeners();

        },

        proposeNewQ : function (question) {

            if(!question){
                console.log("Error in QA.proposeNewQ: Variables not passed correctly");
                return false
            }
            else{
                //Instantiate new question object with the new question
                var questionObj = {
                        questionID : undefined, //assign index at server level
                        rank : undefined, //assign rank at server
                        sessionID : qaThis.sessionID, 
                        userID : qaThis.userID,
                        userName : qaThis.userName,
                        question : question,
                        numupvotes :0,
                        numdownvotes :0,
                        state : 0
                    };
                //send emit to qaEmit function to notify server of new question
                qaThis.qaEmit(qaThis.QEVENTS.NEWQSEND, questionObj);
                return true            
            }
        },

        //General function for emitting any client side events
        qaEmit : function(signal, data){
            qaThis.qaSocket.emit(signal, data);

        },

        /**initialize event listener for the only event that will come from server: update question. The client will receive the updated qDict or the Dictionary of questions and re-render the entire QA view.

        TODO: Selectively render only those questions that need to be changed?  
        **/
        initListeners : function() {
            qaThis.qaSocket.on(qaThis.QEVENTS.UPDATEQUESTION, function(qDict){
                qaThis.renderingCallback(qDict);
            });
        },

        //called when user upvotes question
        upVote : function(qID){
            qaThis.qaEmit(qaThis.QEVENTS.UPVOTE, {
                questionID: qID,
                userID : qaThis.userID,
                sessionID : qaThis.sessionID 
            });
        },

        //called when user downvotes question
        downVote : function (qID) {
            qaThis.qaEmit(qaThis.QEVENTS.DOWNVOTE, {
                questionID: qID,
                userID : qaThis.userID,
                sessionID : qaThis.sessionID 
            });
        },

        //called when user removes their question they proposed
        delQ : function (qID) {
            qaThis.qaEmit(qaThis.QEVENTS.DELQ, {
                questionID: qID,
                userID : qaThis.userID,
                sessionID : qaThis.sessionID 
            });

        },

/**
--------------- MODERATOR QA FUNCTIONS -----------------------
**/
        answeringQ : function () {
            //Change state of question in spectator view

        },

        answeredQ : function () {
            //Remove question from voting queue in spectator view
            //Gray out question in moderator list

        },

        removedQ : function () {
            //Remove question from voting queue in spectator view
            //Gray out question in moderator list

        }

       
    };

}