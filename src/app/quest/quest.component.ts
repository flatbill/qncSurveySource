import { HostListener, Component, OnInit } from '@angular/core'
import api from 'src/utils/api'
@Component({
  selector: 'app-quest',
  templateUrl: './quest.component.html'
})
export class QuestComponent implements OnInit {
  constructor() {}
  @HostListener('document:keydown', ['$event']) 
  onKeydownHandler(event: KeyboardEvent) {
    if ( event.ctrlKey  &&  event.shiftKey && event.altKey)  { 
      this.ctrlShiftAltWasHit() 
    } // end if
  } // end onKeydownHandler

  cust = '?'
  qid = '?'
  icode = '?'
  qUserId = '?'
  hisAns = '0'
  hisAnsPoints = 0
  aqx = 0 // active question index
  curQuestTxt = ''
  curPreQuest = ''
  curAca = []   //aca is Answer Choice Array.  One aca per question.
  curAcaFrame = [] //text above answer choices, like never,sometimes,always
  qtDbDataObj: object = {}
  userObj: object = {}
  allQuestions = []
  activeQuestions = []
  showQuestHtml = true
  showAnswerGroupHtml = true 
  showWrapUpHtml = false
  showDiagHtml = false
  showSignHtml = true
  todaysDate = new Date().toJSON().split("T")[0] + "T00:00:00"
  dateTimeNow = new Date().toJSON().split(".")[0] + "Z"
  answerObj: object = {}
  accumObj: object = {}
  scoreObj: object = {}
  ruleObj: object = {}
  subsetObj: object = {}
  subsetArray = []  
  subsetsFromDb = []   
  subset = '???'
  accumArray = []
  timeGap = 0
  answerStartTime = performance.now()
  answerEndTime = performance.now()
  answerCnt = 0
  answerArray = []
  scoresArray = []
  scoreRound = 1
  scoreRecsWritten = 0
  rulesArray = []
  subsetToFilterIn = ''
  subsetRound = 0
  subsetTempArray = []
  msg1 = 'Welcome. Please sign in to start the survey.'
  msg2 = '?'
  firstNameInput = ''
  lastNameInput = ''
  phoneInput = ''
  userFoundInDb = false
  pastAnswers = []
  showDiagButHtml = false  // turn on with ctrl shift alt
  wrapUpWaitForPriorDbUpdate = false
  questHasLinBrk = false // questions with line breaks hit different html
  groupArray = []
  participantObj = new Object
  pastScores = []
  
  // https://forums.fauna.com/t/multi-document-upsert/488
  // maybe we want a consistent rec layout for the fauna db & here.
  // we have xxxObj in this pgm for the various arrays & db.
  // so should we have a 'type' (choke) for each kind of custom obj?
  // questObj answerObj scoreObj  accumObj ruleObj subsetObj
  // anybody writing to faunadb should use the custom obj layout.
  // in this pgm, when reading from fauna db,
  // maybe read into xxxObj first, cuz xxxObj has the rec layout.
  // in case of mismatch between fauna and this pgm,
  // we will have errors, but maybe they will be less weird.
  // Nov 2021 we seem to be getting by just fine without a rec type.
  //
  // may 2021. figure out date time for all db files.
  // as of may 2021, we set answers and scores with 00:00 time.
  // but user db has the real latest time, so ya can see reality.
  // so, the user db duznt match answer/scores. but that seems ok.

  // when done building allQuestions array,
  // and done building pastAnswers array,
  // and before asking any questions,
  // we mark those recs in allQuestions array 
  // that have been answered already.
  // later, when choosing a smaller set of questions,
  // further filter by only those questions no-yet-answered.

  ngOnInit() {
    this.setQueryStringParms()
  } // end ngOnInit
  
  setQueryStringParms(){
    console.log('running setQueryStringParms')
    let locSearchResult = new URLSearchParams(location.search)
    let locSearchResultCust  = locSearchResult.get('cust')
    let locSearchResultQid   = locSearchResult.get('qid')
    let locSearchResultIcode = locSearchResult.get('icode')
    if (locSearchResultCust != null) {
      this.cust = locSearchResultCust
    }
    if (locSearchResultQid != null) {
      this.qid = locSearchResultQid
    }
    if (locSearchResultIcode != null) {
      this.icode = locSearchResultIcode
    }
    // when no querystring, set defaults to 666
    if(this.cust == '?'){this.cust = '1'}
    if(this.qid == '?'){this.qid = '666'}
    if(this.icode == '?'){this.icode = '90210'}
    // console.log ( 'done setQueryStringParms.' 
    // + ' cust: ' + this.cust
    // + ' qid: '  + this.qid
    // + ' icode: '+ this.icode )
  } // end setQueryStringParms

  ctrlShiftAltWasHit(){
    console.log('running ctrlShiftAltWasHit')
    // toggle diagnostic button on off
    if (this.showDiagButHtml){
      this.showDiagButHtml = false  // ctrl shift alt
    } else {
      this.showDiagButHtml = true  // ctrl shift alt
    }
  } // end ctrlShiftAltWasHit

  doSign(){ // user clicked go button onscreen
    console.log('running doSign')
    this.validateSignOn()
    if (this.msg1 == 'ok') {
      // db function chaining, see .then
      // readuser > readsubsets > readquestions
      this.msg1 =  "let's look you up, " + this.firstNameInput + ' ...'
      this.qtReadParticipant() 
      // pgm will continue in .then of qtReadParticipants
    }
  } // end doSign

  validateSignOn(){
    this.msg1 = ''
    if (this.phoneInput.length < 4){this.msg1='Please enter a phone number.'}
    if (this.lastNameInput.length < 1){this.msg1='Please enter your last name.'}
    if (this.firstNameInput.length < 1){this.msg1='Please enter your first name.'}
    if (this.msg1.length == 0){
      this.msg1 = 'ok'
      this.qUserId = this.firstNameInput.trim()
      + this.lastNameInput.trim() 
      + this.phoneInput.trim() 
      this.showSignHtml = false
    }
  } // end validateSignOn

  firstNameChg(firstNameParmIn){
   // this.firstNameInput = 
   //   ev.target.value[0].toUpperCase() + ev.target.value.substring(1)
   this.firstNameInput = 
     firstNameParmIn[0].toUpperCase() + firstNameParmIn.substring(1)
  } // end firstNameChg

  lastNameChg(lastNameParmIn){
    // this.lastNameInput = 
    //   ev.target.value[0].toUpperCase() + ev.target.value.substring(1)
    this.lastNameInput = 
      lastNameParmIn[0].toUpperCase() + lastNameParmIn.substring(1)
  } // end lastNameChg

  phoneChg(phoneParmIn){
    // this.phoneInput = ev.target.value 
    this.phoneInput = phoneParmIn 
  } // end phoneChg

  buildUserObj(dbUserObj){
    console.log('running buildUserObj dbUserObj:')
    console.table(dbUserObj)
    if (dbUserObj.length > 0){
      // console.log('user is found in db')
      this.msg1 = 'welcome back, ' + this.firstNameInput + '.'
      this.userFoundInDb = true
      this.userObj =
      {
        "cust": this.cust,
        "qid": this.qid,
        "userId": this.qUserId,
        "firstName": this.firstNameInput,
        "lastName": this.lastNameInput,
        "phone": this.phoneInput,
        "userDateTime":  dbUserObj[0].data.userDateTime,
        "status": dbUserObj[0].data.status,
        "priorQ": dbUserObj[0].data.priorQ
      }
    }

    if (dbUserObj.length == 0){
      // console.log('user not found in db')
      this.userFoundInDb = false
      this.userObj =
      {
        "cust": this.cust,
        "qid": this.qid,
        "userId": this.qUserId,
        "firstName": this.firstNameInput,
        "lastName": this.lastNameInput,
        "phone": this.phoneInput,
        "userDateTime": this.dateTimeNow,
        "status": "active",
        "priorQ": "0"
      }
      // console.table(this.userObj)
    }

    // console.log('219 is he a returning user?')
    // console.table(this.userObj)
  } // end buildUserObj

  setPastAnswers(answersFromDb){
    console.log('running setPastAnswers')
    // get here after reading answers for this user, for a prior session.
    // set db records into pastAnswers array.
    // console.table(answersFromDb)
    // console.table(answersFromDb[0].data)
    for (let i = 0; i < answersFromDb.length; i++) {
      this.pastAnswers.push(answersFromDb[i].data)
    } // end for loop
  } // end setPastAnswers

  upsertUser(){
    if (  this.userFoundInDb) {
      //  existing user, update the db rec.
      // billy, do you really need to update db rec right now?
      // for returning users, is there any value in resetting dateTime
      // to be the user is returning at hhmmss?
      // maybe wait until he answers a question,
      // then update the user info after we store an answer.
    }
    if (  ! this.userFoundInDb) {
      // new user, add a db rec.
      this.launchQtAddParticipant()
    }
  }  // end upsertUser

  answerClicked(hisAnsAcaIxFromHtml) {
    console.log('running answerClicked')
    // called from html, he clicked an answer
    this.calcAnswerTimeGap()
    this.storeAnswer(hisAnsAcaIxFromHtml)  
    if (this.aqx < this.activeQuestions.length - 1) { 
      // console.log('ready to ask another question:')
      // console.log(this.activeQuestions[this.aqx].questTxt)
      this.aqx = this.aqx + 1
      this.curQuestTxt = this.activeQuestions[this.aqx].questTxt
      this.curPreQuest = this.activeQuestions[this.aqx].preQuest 
      this.curAca = this.activeQuestions[this.aqx].aca 
      this.curAcaFrame = this.activeQuestions[this.aqx].acaFrame
      if (this.curQuestTxt.includes('\n')) {
        this.questHasLinBrk = true
      } else {
        this.questHasLinBrk = false
      } // end if includes \n
    } else { //we are at the end of active questions
        // set next groups and set next round of active questions:
        this.closeOutActiveAndPrepNextQuestions()  
        this.aqx = 0
        if (this.activeQuestions.length == 0) {
          this.wrapUp() //we are done with qNa. 
        }
    } // end if this.aqx
  } // end answerClicked

  closeOutActiveAndPrepNextQuestions(){
    console.log('running closeOutActiveAndPrepNextQuestions')

    for (let i = 0; i < this.groupArray.length; i++) {
      if (this.groupArray[i].statusQnA == 'active') {
        this.groupArray[i]['statusQnA'] = 'done'
        // console.log('354 setting group status to done')
      } // end if
    } // end for

    this.calcScores()
    this.storeScores()
    this.compareRulesScoresGroups()
    this.findNextRoundOfActiveQuestions()
    this.sortRoundOfActiveQuestions()
    this.setFirstActiveQuest()
  } // end closeOutActiveAndPrepNextQuestions

  calcAnswerTimeGap(){
    this.answerEndTime = performance.now()
    let tdif = 
      ( this.answerEndTime - 
        this.answerStartTime ) / 1000
    this.timeGap = Math.round(tdif)
    this.answerStartTime = performance.now()
  }  // end calcAnswerTimeGap

  storeAnswer(hisAnsAcaIx){
    console.log('running storeAnswer')
    // for the recently answered question (the active question),
    // set a point value into hisAnsPoints.
    // he gave an answer, and we captured it into hisAnsAcaIx.
    // for a question, aca and acaPointVals are two data-synced arrays.
    // so we can use hisAnsAcaIx as an index to acaPointVals
    // to determine the point value.
    this.hisAnsPoints = 
      this.activeQuestions[this.aqx].acaPointVals[hisAnsAcaIx]
    this.hisAns =
      this.activeQuestions[this.aqx].aca[hisAnsAcaIx]
      // hisAnsPoints now contains the points to be added 
      // for his answer
    this.buildAnswerFields()
    this.answerArray.push(this.answerObj)
    this.writeAnswerToDb() //has its own chaining  .then
  } //end storeAnswer

  buildAnswerFields(){
    console.log('running buildAnswerFields')
    this.answerObj = 
    {
      "cust": this.cust,
      "qid": this.activeQuestions[this.aqx].qid,
      "questNbr": this.activeQuestions[this.aqx].questNbr,
      "answerDate": this.todaysDate,
      "qUserId": this.qUserId,
      "answer": this.hisAns,
      "answerPoints": this.hisAnsPoints,
      "timeGap": this.timeGap,
      "accum" : this.activeQuestions[this.aqx].accum,  
      "scoreRound" : 0
    } // end answerObj
        // when building an answer rec, we copy-in the accum array 
        // from the question to help later with scoring.
        // we are NOT adding to answers.accum here,
        // we use answers.scoreRound later, set to 1 2 3 etc,
        // to keep track of whether the answers have been scored yet.
        // we store answers to the database before they are scored,
        // therefore db scoreRound will be zero.
        // only the javascript answer array will have a scoreRound.
        // console.log('my answer object', this.answerObj)
  } // end buildAnswerFields

  writeAnswerToDb(){
    console.log('running writeAnswerToDb')
    // writing to the db is helpful for some other later time,
    // but for now, only the answerArray is useful.
    this.msg1 = 'writing answer to database...'
    this.wrapUpWaitForPriorDbUpdate = true
    api.qtWriteAnswer(this.answerObj)
        .then 
        (   (qtDbRtnObj) => 
          {
            console.log('running .then of api.qtWriteAnswer')
            this.qtDbDataObj = qtDbRtnObj.data
            this.answerCnt = this.answerCnt + 1
            // this.setUserFieldsAfterAnswer() // remember how far he got.
            // check for  wrapup, cuz of async.
            if (! this.showWrapUpHtml) { // show progress if we arent done.
              this.msg1 = this.firstNameInput + "'s " 
              + 'answer count: ' + this.answerCnt 
              Object.assign(this.userObj,{userDateTime: this.dateTimeNow })
              Object.assign(this.userObj,{status:  'active' })
              Object.assign(this.userObj,{priorQ:  this.answerObj[ "questNbr" ]})
              this.updateParticipantDb('from writeAnswer')  
            }
            // return from this on-the-fly function is implied  
          }
        ) // done with .then
      .catch(() => {
        console.log('qtWriteAnswer error. ')
      })
  } // end writeAnswerToDb

  launchQtReadPastAnswers() {
    console.log('running launchQtReadAnswers') 
    api.qtReadAnswers(this.cust, this.qid, this.qUserId)
      .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtReadAnswers') 
            //keep past answers in an array, for comparison later.
            this.setPastAnswers(qtDbRtnObj)
            this.launchQtReadPastScores() // leads to more chaining!
          }
        )
        .catch(() => {  // api.qtReadAnswers returned an error 
          console.log('api.qtReadAnswers error. cust & qid & user ' 
          , this.cust, ' ', this.qid,' ',this.qUserId,' '
          )
        })
  } //end launchQtReadAnswers
  
  launchQtReadPastScores() {
    console.log('running launchQtReadPastScores') 
    api.qtReadScores(this.cust, this.qid, this.qUserId)
      .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtReadScores') 
            //keep past scores in an array, for comparison later.
            this.setPastScores(qtDbRtnObj)
            this.setPastScoresIntoScores()
            this.launchQtReadGroups() // leads to more chaining!
          }
        )
        .catch(() => {  // api.qtReadAnswers returned an error 
          console.log('api.qtReadScores error. cust & qid & user ' 
          , this.cust, ' ', this.qid,' ',this.qUserId,' '
          )
        })
  } //end launchQtReadPastScores

  setPastScores(scoresFromDb){
    console.log('running setPastScores')
    // get here after reading scores for this user, for a prior session.
    // set db records into pastScores array.
    for (let i = 0; i < scoresFromDb.length; i++) {
      this.pastScores.push(scoresFromDb[i].data)
    } // end for loop
  } // end setPastScores

  setPastScoresIntoScores(){
    console.log('running setPastScoresIntoScores ')
    // he is a returning participant 
    // that may have been partially scored already.
    //if (this.pastScores.length() > 0){ 
      // stuff pastScores into scoresArray,
      // pretending he got scored in this session.
      this.scoresArray = this.pastScores
      // console.table(this.scoresArray)
    //}//
  }

  calcScores(){
    console.log('running calcScores')
    // exit this paragrf with nice values in accumArray.
      // for each answer he gave in this round,
      // add ansPoints to 1 or more accumulators,
      // depending on which accumulators were tied to the question.
      // filter by answerArray.scoreRound = 0 (not yet scored)
      // and loop thru the filtered answer array.
      // then after scoring in this paragrf,
      // keep track of scoring rounds each time you run this,
      // and set answerArray.scoreRound = to this round
      for (let i = 0; i < this.answerArray.length; i++) {
        for (let j = 0; j < this.answerArray[i].accum.length; j++) {
          if (this.answerArray[i].scoreRound == 0) { //not scored yet
            this.findAccumAndAddPoints(this.answerArray[i].accum[j],
                                      this.answerArray[i].answerPoints,
                                      this.answerArray[i].timeGap)
            // console.log('486 answerArray[i].accum[j]:')
            // console.table(this.answerArray[i].accum[j])
            // tests OK for multiple accums, 
            // cuz we add a scores rec for each accum.
          } // end if
        } //end inner for
        this.answerArray[i].scoreRound  = this.scoreRound
      } // end answerArray outer for
      this.scoreRound = this.scoreRound + 1 
  } // end calcScores

  findAccumAndAddPoints(accumParmIn,ansPointsParmIn,ansTimeGapParmIn){
    console.log('running findAccumAndAddPoints')
    let pos = this.accumArray
      .map(function(a) { return a.accum }).indexOf(accumParmIn)
    this.accumArray[pos].accumScore =
      this.accumArray[pos].accumScore + ansPointsParmIn
    this.accumArray[pos].accumQuestCnt =  
      this.accumArray[pos].accumQuestCnt + 1
    this.accumArray[pos].accumTimeGap =  
      this.accumArray[pos].accumTimeGap + ansTimeGapParmIn
  } // end findAccumAndAddPoints

  storeScores(){
    console.log('running storeScores')
    // for each row in accumArray,  buildScore & writeScore
    for (let i = 0; i < this.accumArray.length; i++) {
      if (this.accumArray[i].accumStoreDbYn == 'n'
      && this.accumArray[i].accumQuestCnt > 0) 
        {
        this.buildScoreFields(i)
        this.scoresArray.push(this.scoreObj) 
        this.writeScoresToDb()  
        this.accumArray[i].accumStoreDbYn = 'y'
        this.accumArray[i].accumQuestCnt = 0  //reset to zero
      }
    }
  } // end storeScores

  buildScoreFields(i){
    console.log('524 running buildScoreFields')
    this.scoreObj = 
    {
      'cust': this.cust,
      'qid' : this.qid,
      'quserId' : this.qUserId,
      'testDate': this.todaysDate,
      'accum' : this.accumArray[i].accum,
      'score' : this.accumArray[i].accumScore,
      'wscore' : this.accumArray[i].accumScore,
      'questCnt' : this.accumArray[i].accumQuestCnt,
      'timeGap' : this.accumArray[i].accumTimeGap,
    }
    //console.table(this.scoreObj)
  }  // end buildScoreFields

  writeScoresToDb(){
    console.log('running writeScoresToDb')
    this.msg1 = 'writing scores to database...'

    // write to db table qtScores
    api.qtWriteScore(this.scoreObj)
    .then 
    (   (qtDbRtnObj) => 
      {
        this.qtDbDataObj = qtDbRtnObj.data
        this.scoreRecsWritten = this.scoreRecsWritten + 1
        if (! this.showWrapUpHtml) { // show progress if we arent done. 
          this.msg1 = this.scoreRecsWritten + ' scores written so far.'
        }
        // return from this on-the-fly functon is implied  
      }
    )
  .catch(() => {
    console.log('qtWriteScore error. ' )
    console.table(this.scoreObj)
  })
    
  } // end writeScoresToDb

  updateParticipantDb(fromWhere){
    console.log('running updateParticipantDb from '+ fromWhere)
    // console.log(fromWhere)
    // update one rec on db table qtUser
    // console.log('quest 565 qtUpdateParticipant')
    api.qtUpdateParticipant(this.userObj)
    .then 
    (   (qtDbRtnObj) => 
      {
        console.log('running .then of api.qtUpdateParticipant')
        this.wrapUpWaitForPriorDbUpdate = false

        // console.table(this.userObj)
        this.qtDbDataObj = qtDbRtnObj.data
        // return from this on-the-fly function is implied  
      }
    )
  .catch(() => {
    console.log('557 updateParticipantDb error. userObj: ')
    console.table(this.userObj)
  })
  } // end updateParticipantDb

  matchAllQuestionsToAlreadyAnsweredQuestions(){
    console.log('running matchAllQuestionsToAlreadyAnsweredQuestions')
    // console.log('past answers:')
    // console.table(this.pastAnswers)
    // allQuestions questNbr
    // pastAnswers questNbr
    // if ya find a match: set allQuestions.answeredAlready to 'y'
    let j = 0
    for (let i = 0; i < this.pastAnswers.length; i++) {
      // find question that matches this pastAnswer, by questNbr
      j = this.allQuestions
          .findIndex(q  => q.questNbr == this.pastAnswers[i].questNbr);
      // console.log('pastanswers questNbr: ',this.pastAnswers[i].questNbr)
      if (j > -1){
        this.allQuestions[j].answeredAlready = 'y'
        // console.log('question was asked before: ')
        // console.log(this.allQuestions[j].questTxt)
      }
    } // end for
    // console.log('allQuestions: ')
    // console.table(this.allQuestions)
  } // end matchAllQuestionsToAlreadyAnsweredQuestions

  findNextRoundOfActiveQuestions(){
    console.log('running findNextRoundOfActiveQuestions')
    this.activeQuestions.length = 0  // start fresh for the upcoming round
    // console.log('723 groupArray:')
    // console.table(this.groupArray)
    // part a:
    // look thru groupArray for the first group seq not yet asked.
    // group seq is a grouper-of-groups.
    // use this group seq as a driver for the next set of groups.
    // i mean, flag all groups (with this seq) in groupArray
    //  with status 'active'.
    // part b:
    // then find questions that are in one of these newly active groups.
    // these are the questions we want stuffed into activeQuestions.

    let gax = -1
    gax = this.groupArray
    .findIndex(g  => g.statusQnA == 'pending' && g.threshHit == 'y')
    // console.log('626 gax: ', gax)
    let myGroupSeq = '9999'
    if (gax > -1) {
      myGroupSeq = this.groupArray[gax].seq.toLowerCase()
      // console.log('630 myGroupSeq: '+myGroupSeq)
    }
    for (let i = 0; i < this.groupArray.length; i++) {
      if (this.groupArray[i].seq.toLowerCase() == myGroupSeq 
      && this.groupArray[i].threshHit == 'y'
      && this.groupArray[i].statusQnA == 'pending') {
        this.groupArray[i]['statusQnA'] = 'active'
        // console.log('637 activating groupArray: ')
        // console.table(this.groupArray)
      } // end for 
    }
    let activeGroups = []
    for (let i = 0; i < this.groupArray.length; i++) {
      if (this.groupArray[i].statusQnA == 'active') {
        // console.log('644 pushing into activeGroups: ', this.groupArray[i].groupName)
        activeGroups.push(this.groupArray[i].groupName.toLowerCase())
      } //end if
    }  //end for
    // part b:  stuff into activeQuestions
    // console.log('649 part b, check all questions')
    // console.table(this.allQuestions)
    for (let i = 0; i < this.allQuestions.length; i++) {
      // console.log('652 checking a question against activeGroups')
      // console.log(this.allQuestions[i].subset)
      if (activeGroups.includes(this.allQuestions[i].subset.toLowerCase())) {
        if ( this.allQuestions[i].answeredAlready == 'n') {
          // console.log('656 pushing into allQuestions')
          this.activeQuestions.push(this.allQuestions[i])
        } // end if
      } // end if
    }  //end for
    // console.log('655 next round of active questions:')
    // console.table(this.activeQuestions)
  } // end findNextRoundOfActiveQuestions

  sortRoundOfActiveQuestions(){
    console.log('running sortRoundOfActiveQuestions')
    function compareSeq(a, b) {
      let comparison = 0;
      if (a.questSeq.toString().padStart(4,'0') 
         > b.questSeq.toString().padStart(4,'0')) {
        comparison = 1;
      } else if (a.questSeq.toString().padStart(4,'0') 
                < b.questSeq.toString().padStart(4,'0')) {
        comparison = -1;
      } // end else if
      return comparison;
    } // end function compareSeq
    this.activeQuestions.sort(compareSeq)
    //console.table(this.activeQuestions)
  }  // end sortRoundOfActiveQuestions

  setFirstActiveQuest(){
    console.log('running setFirstActiveQuest')
    this.curQuestTxt = ''
    this.curPreQuest = ''
    this.curAca = []
    this.curAcaFrame = []
    if (this.activeQuestions.length > 0) {
      this.curQuestTxt = this.activeQuestions[0].questTxt
      this.curPreQuest = this.activeQuestions[0].preQuest
      this.curAca = this.activeQuestions[0].aca
      this.curAcaFrame = this.activeQuestions[0].acaFrame
      if(this.curQuestTxt.includes('\n')) {
        this.questHasLinBrk = true
      } else {
        this.questHasLinBrk = false
      } // end if includes \n    
    }
    if (this.activeQuestions.length == 0) // no questions
      this.wrapUp()
  }

  wrapUp(){
    console.log('running wrapUp')
    this.showQuestHtml = false
    this.showWrapUpHtml = true
    this.showAnswerGroupHtml = false
    console.log('final answers in answerArray:')
    console.table(this.answerArray)
    console.log('final accums in accumArray:')
    console.table(this.accumArray)
    console.log('final subsets in subsetArray:')
    console.table(this.subsetArray)
    this.msg1 = 'Thank you, ' + this.firstNameInput
    + ', for taking this survey. '
    this.msg2 = 'This survey tool was created by flyTechFree company.  '
    + ' Your feedback is appreciated.  '
    + 'Please email us at feedback@flyTechFree.com.'
    // someday maybe:
    // < a href="mailto:john@example.com">John< /a>
    if (this.userObj['status'] != 'done') {
      this.userObj['status']       = 'done'
      this.userObj['userDateTime'] = this.dateTimeNow 
      this.userObj['priorQ']       = this.answerObj[ "questNbr" ]
      this.updateParticipantDb('from wrapUp')
    }
  } // end wrapUp
  
// how duz promise based stuff work? by chaining confusion.
// The first argument of .then 
// is a function that runs when the promise is resolved, 
// and receives the result.
// api is promise based,
// so after an api call, pgm logic continues at .then
// dont try to run paragrafs sequentially when you call an api paragrf.
// gets confusing when we have multiple api calls in various paragrfs.
// there are multiple .then parts running at the same time. ouch.
// like, we dont wait for the past answer fetch to complete,
// before we read the list of questions.
// maybe restructure to follow the chain of .then every time.
// and we like how the test continues asking questions even though
// we store an answer async, but when we run out of questions
// we cant do the wrap up until the last answer is stored.
// ( cuz it makes the screen messages out-of-order)
// ( cuz it wrecks the final write to user db table)
////////////////////////////////////////////////////////////////

  launchQtReadQuestions () {
    api.qtReadQuestions(this.cust,this.qid)
        .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtReadQuestions') 
            this.loadQuestionsFromDbToAllQuestions(qtDbRtnObj)
            // console.log('750 all questions:')
            // console.table(this.allQuestions)
            this.buildListOfAccumsFromAllQuestions()
            this.matchAllQuestionsToAlreadyAnsweredQuestions()
            this.launchQtReadRules() // has its own chaining
            // if (this.activeQuestions.length > 0) {
            //   this.curQuestTxt = this.activeQuestions[0].questTxt
            //   this.curPreQuest = this.activeQuestions[0].preQuest
            //   this.curAca = this.activeQuestions[0].aca
            //   this.curAcaFrame = this.activeQuestions[0].acaFrame
            //   if(this.curQuestTxt.includes('\n')) {
            //     this.questHasLinBrk = true
            //   } else {
            //     this.questHasLinBrk = false
            //   } // end if includes \n    
            // }
          }
        )
        .catch(() => {  // api.qtReadQuestions returned an error 
          console.log('api.qtReadQuestions error.' )
          console.log(this.cust,this.qid)
        })
  }

  loadQuestionsFromDbToAllQuestions(qtDbObj){
    console.log('running loadQuestionsFromDbToAllQuestions')
    // input is qtDbObj from database and output allQuestions array.
    // get here after .then of reading db,
    // so qtDbObj is ready to use.
    this.allQuestions.length = 0 //blank out array, then load it
    for (let i = 0; i < qtDbObj.length; i++) {
      this.allQuestions.push(qtDbObj[i].data)
      this.allQuestions[i].answeredAlready = 'n'
      // this.allQuestions[i].subset = this.allQuestions[i].subset.toLowerCase()
      for(let j=0; j<this.allQuestions[i].accum.length; j++){
        // this.allQuestions[i].accum[j] = this.allQuestions[i].accum[j].toLowerCase()
      } // end inner for
      console.table(this.allQuestions[i])
    } // end outer for
  }  // end loadQuestionsFromDbToAllQuestions

  buildListOfAccumsFromAllQuestions(){
    console.log('running buildListOfAccumsFromAllQuestions')
    // read all questions array, find the unique accumulators.
    // push a newly discovered accum into accumArray.
    for (let i = 0; i < this.allQuestions.length; i++) {
      // this question has an array of accumulators.
      for (let j = 0; j < this.allQuestions[i].accum.length; j++) {
        // find the accum in accumArray. if not found, add it.
        let position = 
          this.accumArray.map(function(a) { return a.accum })
          .indexOf(this.allQuestions[i].accum[j])
        if (position < 0){
            this.accumObj = { 
              'accum': this.allQuestions[i].accum[j],
              'accumScore' : 0,
              'accumQuestCnt' : 0,
              'accumTimeGap' : 0,
              'accumStoreDbYn': 'n',
              'accumThreshHit' : 'n'
            }
          this.accumArray.push(this.accumObj)
        }
      } // end inner for
    } // end outer for
  } //end buildListOfAccumsFromAllQuestions

  launchQtReadGroups() {
    console.log('running launchQtReadGroups')
    api.qtReadGroups(this.cust,this.qid)
        .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtReadGroups') 
            this.buildListOfGroups(qtDbRtnObj)
            this.sortListOfGroups()
            this.launchQtReadQuestions() // read questions
          }
        )
        .catch(() => {  // api.qtReadSubsets returned an error 
          console.log('api.qtReadSubsets error.')
          console.log('cust & qid: ',this.cust,this.qid)
        })
  } //end launchQtReadGroups

  buildListOfGroups(qtDbObj){
    console.log('running buildListOfGroups')
    this.groupArray.length = 0  //start out with an empty array.
    if (qtDbObj.length == 0){
      // console.log('buildListOfGroups. no groups for this cust & qid')
      // console.log(this.cust , this.qid)
      return
    }
    for (let i = 0; i < qtDbObj.length; i++) {
      this.groupArray.push(qtDbObj[i].data)
    }
    for (let j = 0; j < this.groupArray.length; j++) {
      this.groupArray[j][ "statusQnA" ] = 'pending'
      this.groupArray[j][ "threshHit" ] = 'n'
      // this.groupArray[j][ "groupName" ] = this.groupArray[j].groupName.toLowerCase()
    } //end for loop j
  }  // end buildListOfGroups

  sortListOfGroups(){
    console.log('running sortListOfGroups')
    function compareSeq(a, b) {
      let comparison = 0;
      if (a.seq.toString().padStart(4,'0') 
         > b.seq.toString().padStart(4,'0')) {
        comparison = 1;
      } else if (a.seq.toString().padStart(4,'0') 
                < b.seq.toString().padStart(4,'0')) {
        comparison = -1;
      }
      return comparison;
    } // end function compareSeq
    
    this.groupArray.sort(compareSeq);
  } // end sortListOfGroups

  launchQtReadRules(){
    console.log('running launchQtReadRules')
    api.qtReadRules(this.cust,this.qid)
      .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtReadRules') 
            this.buildListOfRules(qtDbRtnObj)
            this.findGroupsWithNoRules()
            this.findNextRoundOfActiveQuestions()
            this.sortRoundOfActiveQuestions()
            this.setFirstActiveQuest()
          }
        )
        .catch(() => {  // api.qtReadRules returned an error 
          console.log('api.qtReadRules error.')
          console.log(this.cust,this.qid)
        })

  } //end launchQtReadRules

  buildListOfRules(qtDbObj){
    console.log('running buildListOfRules')
    for (let i = 0; i < qtDbObj.length; i++) {
      this.rulesArray.push(qtDbObj[i].data)
    }
    for (let i=0;i<this.rulesArray.length; i++){
      // this.rulesArray[i].accum = this.rulesArray[i].accum.toLowerCase()
      // this.rulesArray[i].subset = this.rulesArray[i].subset.toLowerCase()
    }
    // console.log('893 I built these rules:')
    // console.table(this.rulesArray)
  } // end buildListOfRules

  findGroupsWithNoRules(){
    console.log('running findGroupsWithNoRules')
    // this is run at the start of a qna session.
    // look for groups that have no rule.
    // for groups with no rule,  set group.threshHit to 'y' 
    // becuz groups without rules are the same as hitting a thresh.
    let rax = 0
    for (let gax = 0; gax < this.groupArray.length; gax++) {
       //console.log('912 looping thru groupArray')
       //console.log(this.groupArray[gax].groupName)
       rax = this.rulesArray
       .findIndex(r => r.subset.toLowerCase() == this.groupArray[gax].groupName.toLowerCase())
      //  console.log('1079 rax:' + rax.toString() )
      if (rax == -1){
        // we found no rule for this group.
        //console.log('919 no rule for this group. setting threshHit to y.')
        this.groupArray[gax].threshHit = 'y' 
      } // end if
    }  // end for
    //console.log('923 end of findGroupsWithNoRules. groupArray: ')
    //console.table(this.groupArray)
  } // end findGroupsWithNoRules

  compareRulesScoresGroups(){
    console.log('running compareRulesScoresGroups')
    //   loop thru rules rax++
    //   find a score for rule(rax)
    //   if ya got a score the rule,
    //    check thresh of the rule compare to score
    //   if thresh hit
    //    find group for this rules 'will trigger group'   (rulesArray.subset) 
    //    and set groupArray(gax).threshHit = 'y'
    // done loop thru all rules.
  
    let sax = -1
    for (let rax = 0; rax < this.rulesArray.length; rax++) {
      sax = this.accumArray
      .findIndex(s => s.accum.toLowerCase() == this.rulesArray[rax].accum.toLowerCase())
      if (sax > -1){
        // found a score for this rule   
        let gax = -1
        gax = this.groupArray
        .findIndex(g => g.groupName.toLowerCase() == this.rulesArray[rax].subset.toLowerCase())
        if (gax > -1) {
          this.checkThresh(rax,gax,sax)
        } // end if
      } // end if
    }  //end for
  } // end compareRulesScoresGroups

  checkThresh(rax,gax,sax){
    console.log('running checkThresh')
    //console.log('rax,gax,sax: ' +rax.toString()+gax.toString()+sax.toString() )
    // we are current on a rule,   group,  & scoreboard.
    // check if a rule threshold is hit for this group.
    // rax: rules array index (was set before we got here)
    // gax: group array index (was set before we got here)
    // sax: accum array index (was set before we got here)

    if (this.rulesArray[rax].oper == '>='
    &&  this.accumArray[sax].accumScore >= this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
      //console.log ('1213 thresh hit')
    } //end if oper >=

    if (this.rulesArray[rax].oper == '<='
    &&  this.accumArray[sax].accumScore <= this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
      //console.log ('970 thresh hit')
    } //end if oper <=

    if (this.rulesArray[rax].oper == '!='
    &&  this.accumArray[gax].accumScore != this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
      //console.log ('976 thresh hit')
    } //end if oper !=

    if (this.rulesArray[rax].oper == '=='
    &&  this.accumArray[sax].accumScore == this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
      //console.log ('982 thresh hit')
    } //end if oper ==
    
    if (this.rulesArray[rax].oper == '='
    &&  this.accumArray[sax].accumScore == this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
      //console.log ('988 thresh hit')
      // console.log(this.groupArray[gax].groupName)
    } //end if oper =

    if (this.rulesArray[rax].oper == '<'
    &&  this.accumArray[sax].accumScore < this.rulesArray[rax].thresh) {
      this.groupArray[gax].threshHit = 'y'
      // console.log ('995 thresh hit')
    } //end if oper <

    if (this.rulesArray[rax].oper == '>'
    &&  this.accumArray[sax].accumScore > this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
      // console.log ('1001 thresh hit')
    } //end if oper >

  }

  qtReadParticipant() {
   // qtReadParticipant = async (e) => {  // dreaded async await?
   console.log('running qtReadParticipant')
   api.qtReadUser(this.cust,this.qid,this.qUserId)
   .then  
      (   (qtDbRtnObj) => 
        {
          console.log(' running .then of api.qtReadUser') 
          this.buildUserObj(qtDbRtnObj)
          // this.chkUserStatus()
          if (this.userObj['status'] == 'done') {
            this.wrapUp()
          } else {
            this.upsertUser()
            this.launchQtReadPastAnswers() // find past answers. has chaining.
          } // end if
        }
      )
      .catch(() => {  // api.qtReadUser returned an error 
        console.log('api.qtReadUser error. key: ' 
        + this.cust + this.qid + this.qUserId)
      })
  } //end qtReadParticipant

  launchQtAddParticipant() {
  console.log('running launchQtAddParticipant')
  api.qtAddParticipant(this.userObj)
    .then 
      (   (qtDbRtnObj) => 
        {
          console.log(' running .then of api.qtAddParticipant') 
          //this.buildUserObj(qtDbRtnObj)
          this.msg1 = 'Starting the survey for ' 
          + this.firstNameInput + ' ' + this.lastNameInput 
          + '.'
          this.showSignHtml = false
        }
      )
      .catch(() => {  // api returned an error 
        console.log('api.qtAddParticipant error. userObj:')
        console.log(this.userObj)
      })

  } //end launchQtAddParticipant

  setDiagnosticsOnOff(){
    console.log('running setDiagnosticsOnOff')
    // as of Spring 2021, control diagnostics with ctrl+alt+shift
    if (this.showDiagHtml == true) {
      this.showDiagHtml = false
    }else{
      this.showDiagHtml = true
    }
  } // end setDiagnosticsOnOff

  massDeleteAnswers() {    
      console.log('running massDeleteAnswers')
      console.log('cust and qid:',this.cust,' ',this.qid)
      api.qtMassDeleteAnswers(this.cust,this.qid)
        .then 
          (   (qtDbRtnObj) => 
            {
              console.log(' running .then of api.qtMassDeleteAnswers') 
            }
          )
          .catch(() => {  // api.qtMassDeleteAnswers returned an error 
            console.log('api.qtMassDeleteAnswers error.' )
          })
  } // end massDeleteAnswers

  massDeleteScores() {
    console.log('running massDeleteScores')
    api.qtMassDeleteScores(this.cust,this.qid)
      .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtMassDeleteScores') 
          }
        )
        .catch(() => {  // api.qtMassDeleteScores returned an error 
          console.log('api.qtMassDeleteScores error.')
          console.log('cust & qid: ' , this.cust,this.qid)
        })
  } // end massDeleteScores

} //end class QuestComponent

// TypeScript is not a first-class citizen 
// - I'm learning Angular 2 and, as a byproduct, 
// I'm learning enough TypeScript to get the job done. 
// Unfortunately, this means that I sometimes spend 
// lotsa time just trying to satisfy the type-checker. 