var renderQnA  = function(qDict, rankList) {
    
    var qDiv = document.getElementById('questionDiv');

    while (qDiv.hasChildNodes()) {
      qDiv.removeChild(qDiv.lastChild);
    }

    for (var i = 0; i < rankList.length; i++) {
      if(qDict[rankList[i]].state !== QnAModule.QSTATE.DELETED)
     renderQuestion(qDict[rankList[i]], i+1);

    };

  }
  
  var renderQuestion = function(question, numQ) {
    var divID = "q-" + question.questionID;
    var divClass = 'questionAsked';
    var qDiv = document.getElementById('questionDiv');
    //var qBtnDiv = document.createElement("div");
    var votesHtml = '';

     if(question.userID === wisdom.global.userid){
      votesHtml = '<div class="questionVoted"><div class="questionVotes">' + (question.numupvotes-question.numdownvotes) + '</div></div>';
     // qBtnDiv.innerHTML = '<input id=\"rmvBtn-' + divID +'\" type=\"button\" value=\"Remove Question\" onClick=\"javascript:QnAModule.delQ(\'' + question.questionID + '\');\">';  
    }
    else if((question.listOfUp.indexOf(wisdom.global.userid)>-1) ||
      (question.listOfDown.indexOf(wisdom.global.userid)>-1)){
     
      //qBtnDiv.innerHTML = '<input class=\"disableVote\" id=\"upVote-' + divID + '\" type=\"button\" value=\"Upvote\" onClick=\"javascript:QnAModule.upVote(\'' + question.questionID + '\');\" disabled=\"disabled\"> ' + '<input class=\"disableVote\" id=\"downVote-' + divID + '\" type=\"button\" value=\"Downvote\" onClick=\"javascript:QnAModule.downVote(\'' + question.questionID + '\');  \" disabled=\"disabled\"">';
      votesHtml = '<div class="questionVoted"><div class="questionVotes">' + (question.numupvotes-question.numdownvotes) + '</div></div>';
    }
    else{
      votesHtml = '<div class="questionVoting">' +
/*      '<div id="upVote-' + divID +  '" class="questionUpvotes" '+ 
      "onClick=\"javascript:QnAModule.upVote('" + question.questionID + "');\">" +
      '<i class="icon-thumbs-up"></i></div>'+*/
      '<div class="questionVotes">' + (question.numupvotes-question.numdownvotes) + '</div></div>';
      '<div id=\"downVote-' + divID +  '" class="questionDownvotes" '+ 
      " onClick=\"javascript:QnAModule.upVote('" + question.questionID + "');\">" +
      '<i class="icon-thumbs-up" style="font-size: 20px;padding-top: 2px;"></i></div></div>';
    }

   var qnaHTML =  votesHtml +
   "<div class=\"questionTextBox\"><div class=\"questionText\" id=\"q-" + divID + "\" >" + question.question + "</div> <div class=\"questionUser\">" + question.userName + "</div></div>";


    //var qnaHTML = '<div class=\"QnAquestion\" id=\"' + divID + '\" + "class=\'divClass\'">' + numQ + '. ' + question.userID + ": " +question.question + 
    //'</div> <div id=\"btn-' + divID + '\">' + qBtnDiv.innerHTML + '</div> <div> Number of Votes: ' + (question.numupvotes-question.numdownvotes) + ' </div> <br>';
    
    var newDiv = document.createElement("div");

    newDiv.id =  divID;
    newDiv.classList.add("questionBox");

    newDiv.innerHTML = qnaHTML;
    qDiv.appendChild(newDiv);

   

  };

  var proposeQuestion = function(){
  		var newQuestion = document.getElementById('newquestionbox');
        QnAModule.proposeNewQ(newQuestion.value);
        newQuestion.value = '';
  };