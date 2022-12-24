import { HostListener, Component, OnInit } from '@angular/core'
import apiFauna from 'src/utils/apiFauna'
import apiFirestore from 'src/utils/apiFirestore'
@Component({
  selector: 'app-quest',
  templateUrl: './quest.component.html'
})
// part0 pp signOn                       ========================
// part1a pp prep: read survey db tables ========================
// part1b pp prep: fancy array match     ========================
// part2 qna session                     ========================
// part3 ww wrap up                      ========================
export class QuestComponent implements OnInit {
  constructor() {}
  @HostListener('document:keydown', ['$event']) 
  onKeydownHandler(event: KeyboardEvent) {
    if ( event.ctrlKey  &&  event.shiftKey && event.altKey)  { 
      this.ctrlShiftAltWasHit() 
    } // end if
  } // end onKeydownHandler
  debugLvl = '?' // read queryString, set to 1 or 2 to debug.
  cust = '?'
  qid = '?'
  promo = '?'
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
  showQuestHtml = false
  showAnswerGroupHtml = false 
  showDoneHtml = false
  showDiagHtml = false
  showSignHtml = true
  todaysDate = new Date().toJSON().split("T")[0] + "T00:00:00"
  dateTimeNow = new Date().toJSON().split(".")[0] + "Z"
  answerObj: object = {}
  accumObj: object = {}
  scoreObj: object = {}
  ruleObj: object = {}
  participantObj = {} // new Object
  accumArray = []
  timeGap = 0
  answerStartTime = performance.now()
  answerEndTime = performance.now()
  answerClickedCnt = 0
  answerArray = []
  qnaRound = 0
  rulesArray = []
  msg1 = 'Welcome. Please sign in to start the Qna.'
  firstNameInput = ''
  lastNameInput = ''
  phoneInput = ''
  userFoundInDb = false
  pastAnswers = []
  showDiagButHtml = false  // turn on with ctrl shift alt
  questHasLinBrk = false // questions with line breaks hit different html
  groupArray = []
  scoreDiagArray = []
  readScoreProm   = new Promise<string>((res, rej) => {})
  writeScoreProm  = new Promise<string>((res, rej) => {})
  updateScoreProm = new Promise<string>((res, rej) => {})
  // writeAnswerProm = new Promise<string>((res4, rej4) => {})
  // unresolvedProm = new Promise<string>((resu, reju) => {})
  surveyName = ''
  surveyIcode = ''
  querystringIcode = ''
  answerArrayStoredToDb = []
  accumIx = 0
  diagMainAnsweredCnt = 0
  diagMainNotAnsweredCnt = 0
  pastAnswerCount = 0
  diagMsgArray = []
  diagMsgObj = {}
  // may 2021. need to figure out date time for all db files.
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

  // score recs are useful to the admin, after the participant finishes.
  // score recs are not used in this qna session.
  // how to write a score rec:
  // at the start of the test, 
  // when building a list of accumulators for all questions,
  // write a question count total for each accumulator.
  // this is how many question/answers will eventually add to the accumulator.
  // later, during the qna, when adding points to an accumulator, 
  // keep track of how many questions were answered for this accumulator.
  // when the questions answered = the question count total,
  //  ** aha moment **  time to write a score rec.

  ngOnInit() {
    this.setQueryStringParms()
    if(this.cust>'' && this.qid> '') {
      this.launchReadSurveyName() //sticks the survey name on the page.
    }
  } // end ngOnInit
  
  setQueryStringParms(){
    this.logFun('pp1 running setQueryStringParms ')
    // Dec2021 need promo programming.
    let locSearchResult = new URLSearchParams(location.search)
    let locSearchResultCust  = locSearchResult.get('cust')
    let locSearchResultQid   = locSearchResult.get('qid')
    let locSearchResultIcode = locSearchResult.get('icode')
    let locSearchResultPromo = locSearchResult.get('promo')
    let locSearchResultDebugLvl = locSearchResult.get('debugLvl')
    if (locSearchResultCust != null) {
      this.cust = locSearchResultCust
    }
    if (locSearchResultQid != null) {
      this.qid = locSearchResultQid
    }
    if (locSearchResultPromo != null) {
      this.logFun('131 setting promo:')
      this.promo = locSearchResultPromo
      this.logFun(this.promo)
    }
    if (locSearchResultIcode != null) {
      this.logFun('136 setting icode:')
      this.querystringIcode = locSearchResultIcode
      this.logFun(this.querystringIcode)
    }

    if (locSearchResultDebugLvl != null) {
      this.logFun('143 setting debugLvl:')
      this.debugLvl = locSearchResultDebugLvl
      this.logFun(this.debugLvl)
    }

    // when no querystring, set defaults:
    if(this.cust == '?'){this.cust = '2'} // demo survey is 2,1
    if(this.qid == '?'){this.qid = '1'}
    if(this.promo == '?'){this.promo = '90210'}
    if(this.debugLvl == '?'){this.debugLvl = '0'}
  } // end setQueryStringParms

  // part0 sign on ===========================================

  doSign(){ // user clicked go button onscreen
    this.logFun('116 running doSign ')
    this.validateSignOnFields()
    if (this.msg1 == 'ok') {
      // signon fields are ok.
      this.msg1 =  "let's look you up, " + this.firstNameInput + ' ...'
      this.readParticipantUpdateOrAddParticipant() // has .then chaining
    }
  } // end doSign

  validateSignOnFields(){
    this.msg1 = ''
    if (this.phoneInput.length < 4){this.msg1='Please enter a phone number.'}
    if (this.lastNameInput.length < 1){this.msg1='Please enter your last name.'}
    if (this.firstNameInput.length < 1){this.msg1='Please enter your first name.'}
    if ( this.surveyIcode > '' 
    && this.querystringIcode != this.surveyIcode
    && this.cust !='2' && this.qid !='1'){ // qnc demo is 2,1. 
      this.msg1 = 'Your email invitation link is invalid or expired.'
      + ' To start this Qna, please follow the link from your email.'
    }
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
    this.logFun('202 running buildUserObj' )
    if (dbUserObj.length > 0){
      this.msg1 = 'welcome back, ' + this.firstNameInput + '.'
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
    }
  } // end buildUserObj

  // end part0 participant sign on     ========================

  // part1a prep: read survey db tables ========================
  //   read questions, rules, groups, pastAnswers into arrays


  // part1b prep: fancy array match     ========================
  // part2 qNa session                  ========================

  setPastAnswers(answersFromDb){
    this.logFun('pp220 running setPastAnswers ' )
    // get here after reading answers for this user, for a prior session.
    // set db records into pastAnswers array.
    for (let i = 0; i < answersFromDb.length; i++) {
      this.pastAnswers.push(answersFromDb[i].data)
      // this.answerCnt = this.answerCnt + 1
    } // end for loop
    this.pastAnswerCount = this.pastAnswers.length
    // this.logFun('pp220 bottom of set pastAnswers')
  } // end setPastAnswers

  answerClicked(hisAnsAcaIxFromHtml) {
    this.logFun('aa248 running answerClicked ')
    this.answerClickedCnt = this.answerClickedCnt + 1
    // called from html, he clicked an answer
    this.curAca = [] // block him from answering same question too quickly
    this.curAcaFrame = [] //text above answer choices, like never,sometimes,always
    this.curQuestTxt = '... loading ...'
    this.curPreQuest = ''
    this.calcAnswerTimeGap()
    this.storeAnswer(hisAnsAcaIxFromHtml) 
    // Selzer Dec 2022 =====================
    // find index of allquestions where cust=x qid=x questionnbr = x
    // replace allQuestions[x].answeredThisRound = 'y' (for end compare)
   let pos = this.allQuestions
   .findIndex(a => a.cust==this.cust && a.qid==this.qid && a.questNbr==this.activeQuestions[this.aqx].questNbr)
   if (pos>-1){ 
     this.allQuestions[pos].answeredThisSession = 'y' //diagnostics
   } // end if pos > -1
    // end Dec 2022 =====================

    if (this.aqx < this.activeQuestions.length - 1) { 
      this.aqx = this.aqx + 1  //increments question we are about to ask.
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
    } // end if this.aqx
  } // end answerClicked

  closeOutActiveAndPrepNextQuestions(){
    this.logFun('qna278 running closeOutActiveAndPrepNextQuestions')
    for (let i = 0; i < this.groupArray.length; i++) {
      if (this.groupArray[i].statusQnA == 'active') {
        this.groupArray[i]['statusQnA'] = 'done'
      } // end if
    } // end for  close out groups
    this.calcPointsSetAccum()
    //this.compareRulesScoresGroups(this.accumIx)
    this.findNextRoundOfActiveQuestions()
    this.sortRoundOfActiveQuestions()
    this.setRoundFirstActiveQuest()
    if (this.activeQuestions.length == 0) { // no more questions
      this.logFun('qna278 no more questions ')
      this.wrapUp()
    } // end if
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
    this.logFun('aa322 running storeAnswer ')
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
      // hisAnsPoints now contains points to be added for his answer
    this.buildAnswerObj()
    this.answerArray.push(this.answerObj)
    this.writeAnswerToDb(this.answerObj) 
    this.calcPointsSetAccum() // this happens in mulitple spots
    this.msg1 = this.firstNameInput + "'s " 
    + 'answer count: ' + this.answerClickedCnt 
    // update participant db every 5 answers
    if (this.answerClickedCnt / 5 ==  Math.round(this.answerClickedCnt/5)){
      Object.assign(this.userObj,{userDateTime: this.dateTimeNow })
      Object.assign(this.userObj,{status:  'active' })
      Object.assign(this.userObj,{priorQ: this.answerClickedCnt})
      this.updateParticipantDb(this.userObj,'from writeAnswer')  
    } // end if
  } //end storeAnswer

  buildAnswerObj(){
    this.logFun('aa350 running buildAnswerObj' )
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
      'addPointsStatus' : 'pending', 
      'questTxt' : this.activeQuestions[this.aqx].questTxt.substring(0,40)
    } // end answerObj
        // when building an answer rec, we copy-in the accum array 
        // from the question to help later with scoring.
        // we are NOT adding to answers.accum here,
        // we use answers.addPointsStatus later, to add to accumArray
        // to keep track of whether the answer points have been added yet.
        // we store answers to the database as we go.
  } // end buildAnswerObj

  writeAnswerToDb(answerObjParm){
    this.logFun('aa354 running writeAnswerToDb' )
    // writing to the db is helpful for later admin retrieval,
    // but for now, only the answerArray is useful.
    this.msg1 = 'saving answer...'
    apiFauna.qtWriteAnswer(answerObjParm)
        .then 
        (   (qtDbRtnObj) => 
          {
            this.logFun('aa354 running .then of apiFauna.qtWriteAnswer' )
            this.qtDbDataObj = qtDbRtnObj.data
            //Apr2022 keep track of answers written. help debug why we missing answers.
            this.answerArrayStoredToDb.push(answerObjParm)
            //
            // if (! this.showDoneHtml) { // show progress if we arent done.
            // }
            // return from this on-the-fly function is implied  
          }
        ) // done with .then
      .catch(() => {
        this.msg1='error writing answer.'
        this.logFun('aa354 qtWriteAnswer error. answerObj:')
        this.logFun(answerObjParm)
        this.debugAnswerError(answerObjParm)
      })
  } // end writeAnswerToDb

  launchQtReadPastAnswers() {
    this.logFun('pp387 running launchQtReadPastAnswers ' ) 
    this.msg1 = 'reading past answers...'
    apiFauna.qtReadAnswers(this.cust, this.qid, this.qUserId)
      .then 
        (   (qtDbRtnObj) => 
          {
            this.logFun('pp387 running .then of apiFauna.qtReadAnswers' ) 
            this.setPastAnswers(qtDbRtnObj)
            this.copyPastAnswersIntoAnswerArray()
            this.launchQtReadGroups() // leads to more chaining!
           // this.launchQtReadPastScores() // leads to more chaining!
          }
        )
        .catch(() => {  // apiFauna.qtReadAnswers returned an error 
          this.msg1 = 'error reading answers.'
          this.logFun('apiFauna.qtReadAnswers error. cust & qid & user ')
          this.logFun(this.cust+ ' '+ this.qid+' '+this.qUserId)
        })
  } //end launchQtReadPastAnswers

  copyPastAnswersIntoAnswerArray(){  
    this.logFun('pp409 running copyPastAnswersIntoAnswerArray ' )
    // load prior answers into current answer array, as if he answered
    // those prior session questions just now.
    this.answerArray = this.pastAnswers
  } // end copyPastAnswersIntoAnswerArray

  calcPointsSetAccum(){
    this.logFun('aa435 running calcPointsSetAccum ' )
    // read answersArray, set accumArray.
    // look at answers not-yet-added to accumArray
    // normally, this is answers recently given,
    // but might be answers from a prior session (participant returner)
    // exit this paragrf with nice values in accumArray.
      // for each answer he gave:
      // add ansPoints to one or more accumulators,
      // depending on which accumulators were tied to the question.
      // look at answerArray.addPointsStatus = 'pending'
      //                     (points not yet added))
      // this.logFun('answerArray:')
      // this.logFun(this.answerArray)
      for (let i = 0; i < this.answerArray.length; i++) {
        if (this.answerArray[i].addPointsStatus == 'pending') { 
          // answer points not added to accumArray yet
          for (let j = 0; j < this.answerArray[i].accum.length; j++) {
              this.findAccumAndAddPoints(this.answerArray[i].accum[j],
                                        this.answerArray[i].answerPoints,
                                        this.answerArray[i].timeGap)
          } //end inner for
          //this.answerArray[i].scoreRound  = this.qnaRound
          this.answerArray[i].addPointsStatus  = 'done'
        } // end if answerArray[i].addPointsStatus == pending
      } // end answerArray outer for
  } // end calcPointsSetAccum

  findAccumAndAddPoints(accumParmIn,ansPointsParmIn,ansTimeGapParmIn){
    // if(ansPointsParmIn==0){'adding zero to accum!'}
    this.logFun('aa440 running findAccumAndAddPoints. accum: ' + accumParmIn )
    // this.logFun(ansPointsParmIn)
    // called for one accum (from answerArray). update accumArray.
    // find matching accumArray row:
    let pos = this.accumArray
    .findIndex(a => a.accum.toLowerCase() == accumParmIn.toLowerCase())
    if(pos>=0){
      this.accumArray[pos].accumScore += ansPointsParmIn
      this.accumArray[pos].accumQuestCnt += 1  
      this.accumArray[pos].accumTimeGap += ansTimeGapParmIn
      // this.logFun(this.accumArray[pos])
      if (this.accumArray[pos].accumQuestCnt ==
          this.accumArray[pos].accumQuestCntTot) {
            // he answered the last question that adds to this accum.
            // hmmm, what about returner where scores not yet upserted?
            // this  is this a good place to compare rules to thresh.
            this.logFun('aa455 he answered last question for this accum:'
             + this.accumArray[pos].accum)
            //this.logFun(this.accumArray[pos].accum)
            this.compareRulesScoresGroups(pos)
            this.accumArray[pos].accumNeedsDbScoreUpsert = 'y'
            this.readOneScoreUpdateOrWriteOneScore(pos)
            this.logFun('aa466 returned from readOneScoreUpdateOrWriteOneScore' )
            // read/write score is now running on its own thread.
      } // end if
    } // end if
    // this.logFun('aa466 bottom of findAccumAndAddPoints' )
    // this.logFun('aa462 accumArray:')
    // this.logFun(this.accumArray)
  } // end findAccumAndAddPoints

  async readOneScoreUpdateOrWriteOneScore(i){
    this.logFun('bb529 running readOneScoreUpdateOrWriteOneScore')
    let myScoreObj = this.buildScoreObj(i)
    // this.logFun('bb529 myScoreObj:')
    // this.logFun(this.buildScoreObj(i))
    this.logFun('bb529 490 ready to await readScore:' )
    this.readScoreProm =  await this.launchQtReadScore(myScoreObj) 
    this.logFun('bb529 done await readScore.' )
    if (Object.keys(this.readScoreProm).length > 0 ){ //scoreRec found
      // this.logFun('bb529 readScoreProm data:')
      // this.logFun(this.readScoreProm[0]['data'])
      if( this.readScoreProm[0]['data']['score']  
      != this.accumArray[i].accumScore )  { //scoreRec needs update
        this.updateScoreProm = await this.updateScoreToDb(myScoreObj)
        this.logFun('bb529 done await updateScoreToDb ' )
        this.accumArray[i].accumNeedsDbScoreUpsert = 'n'  
        let sdx = this.scoreDiagArray
        .findIndex(sda => sda.accum == this.accumArray[i].accum)
        this.scoreDiagArray.splice(sdx,1,myScoreObj)
      }
    } else {
      this.logFun('bb529 ready to run writeScore' )
      this.writeScoreProm = await this.writeScoreToDb(myScoreObj) 
      this.logFun('bb529 done await writeScoreToDb ' )
      this.accumArray[i].accumNeedsDbScoreUpsert = 'n' 
      this.logFun('524 finished writing score')
      this.scoreDiagArray.push(myScoreObj)
    }  // end if
  } // end readOneScoreUpdateOrWriteOneScore

  async launchQtReadScore(scoreObjParmIn){
    this.logFun('bb636 running launchQtReadScore' )
    // this.logFun('bb636 scoreObjParmIn accum:') 
    // this.logFun(scoreObjParmIn['accum'] )
    this.logFun( '532 reading score')
    let readScoreRes =   
      await apiFauna.qtReadScore(this.cust,this.qid,this.qUserId,scoreObjParmIn['accum'])
      .catch(() => {  // apiFauna.qtReadScore returned an error 
        this.logFun('apiFauna.qtReadScore error.')
        this.logFun('cust & qid: & user & scoreboardName:')
        this.logFun(this.cust+this.qid+this.qUserId+scoreObjParmIn['accum'])
        }) // end catch
    // this.logFun('bb636 bottom of launchQtReadScore' )
    return readScoreRes // a promise ... always resolved?
  } //  end launchQtReadScore

  buildScoreObj(i){
    this.logFun('bb576 running buildScoreObj for accum: '
                + this.accumArray[i].accum)
    let scoreObj =
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
    return scoreObj
  }  // end buildScoreObj

  async writeScoreToDb(scoreObjParmIn){
    this.logFun('bb573 running writeScoreToDb ')
    // this.logFun(scoreObjParmIn.accum)
    // this.logFun(scoreObjParmIn.score)
    //this.msg1 = 'writing score...'
    // write to db table qtScores
    let  writeScoreResult = await apiFauna.qtWriteScore(scoreObjParmIn)
          .then(() => {
            this.logFun('bb573 running .then of qtWriteScore')
          })
          .catch(() => {
            this.msg1 = 'error writing score.'
            this.logFun('bb573 qtWriteScore error. scoreObjParmIn:' )
            this.logFun(scoreObjParmIn)
          })
  
    // await this.f()
    return writeScoreResult
  } // end writeScoreToDb

  async updateScoreToDb(scoreObjParmIn){
    this.logFun('bb588 running updateScoreToDb ' )
    // we wont ever hit this para, if we have done it right.
    // we should only writeScoreToDb, never updateScoreToDb
    this.msg1 = 'updating score...'
    // this.logFun('bb588 scoreObjParmIn: =====')
    // this.logFun(scoreObjParmIn)
    let updateScoreResult = 
    await apiFauna.qtUpdateScore(scoreObjParmIn)
    .catch(() => {
      this.msg1 = 'error updating score.'
      this.logFun('qtUpdateScore error. ' )
      this.logFun(scoreObjParmIn)
    }) // end catch
    return updateScoreResult
  }  // end updateScoreToDb
  
  updateParticipantDb(userObjParmIn,fromWhere){
    this.logFun('594 running updateParticipantDb')
    //this.msg1 = 'updating participant...'
    apiFauna.qtUpdateParticipant(userObjParmIn)
    .then 
      ((qtDbRtnObj) => {
        this.logFun('aa607 running .then of apiFauna.qtUpdateParticipant ' )
        // this.logFun(userObjParmIn)
        if (fromWhere == 'from wrapUp') {
          //this.msg1 = 'you have finished the Qna.'
        } else {
         // this.msg1 = 'finished updating participant...'
        } // end  if
        this.qtDbDataObj = qtDbRtnObj.data
      } ) // end .then
  .catch(() => {
    this.msg1 = 'error updating participant.'
    this.logFun('601 updateParticipantDb error. userObjParmIn:')
    this.logFun(userObjParmIn)
  })
  return ''
  } // end updateParticipantDb

  buildDiagMsgObj(diagMsgDateTime, diagMsgParmIn){
    //this.logFun('617 running buildDiagMsgObj' )
    this.diagMsgObj = 
    {
      "cust": this.cust,
      "qid": this.qid,
      "quserId": this.qUserId,
      "diagMsgDateTime": diagMsgDateTime,
      "diagMsg": diagMsgParmIn
    } // end diagMsgObj
  } // end fun buildDiagMsgObj

  matchAllQuestionsToAlreadyAnsweredQuestions(){
    this.logFun('pp626 running matchAllQuestionsToAlreadyAnsweredQuestions ' )
    this.logFun('count of past answers: ' + this.pastAnswers.length)
    this.logFun('pp626 past answers array:')
    this.pastAnswers    
    // pastAnswers questNbr
    // if ya find a match: set allQuestions.answeredAlready to 'y'
    let j = 0
    for (let i = 0; i < this.pastAnswers.length; i++) {
      // find question that matches this pastAnswer, by questNbr
      j = this.allQuestions
          .findIndex(q  => q.questNbr == this.pastAnswers[i].questNbr);
      if (j > -1){  //mark this question as answered already
        this.allQuestions[j].answeredAlready = 'y'
      }
    } // end for



  } // end matchAllQuestionsToAlreadyAnsweredQuestions

  setAlreadyCompletedGroups(){
    this.logFun('pp650 running setAlreadyCompletedGroups ' )
    // if participant is returning,
    // he has already answered some questions.
    // we flagged those questions already. (alreadyAnswered)
    // now compare questions to groups.
    // does a group have any unansweredQuestions? groupHasMoreQuestions
    // if all questions for a group have been answered,
    // then flag the group as done.
    // this helps later, when we look for unanswered groups.
    // this paragrf is driven by groupArray, reads allQuestions.
    let groupHasMoreQuestions = false
    for (let i = 0; i < this.groupArray.length; i++) {
      // are there any unanswered questions for this group?
      groupHasMoreQuestions = false
      for (let j = 0; j < this.allQuestions.length; j++) {
        if (this.allQuestions[j].subset == this.groupArray[i].groupName){
          if (this.allQuestions[j].answeredAlready == 'n' ){ 
            groupHasMoreQuestions = true
            break 
          }
        } // end if
      } // end inner for
      if (!groupHasMoreQuestions){
        this.groupArray[i].statusQnA = 'done'
      }
    } // end for
    // this.logFun('pp650 bottom of setAlreadyCompletedGroups. ')
  } // end setAlreadyCompletedGroups

  findNextRoundOfActiveQuestions(){
    this.logFun('qna686 running findNextRoundOfActiveQuestions ' )
    // this.logFun('643 groupArray:')
    // this.logFun(this.groupArray)
    // driven by groupArray. status=pending, threshHit==y
    this.msg1 = 'building next round of questions...'
    this.activeQuestions.length = 0  // start fresh for the upcoming round
    // part a:
    // look thru groupArray for the first group seq not yet asked.
    // group seq is a grouper-of-groups.
    // use this group seq as a driver for the next set of groups.
    // i mean, flag all groups (with this seq) in groupArray
    //  with status 'active'.
    // part b:
    // then find questions that are in one of these newly active groups.
    // these are the questions we want stuffed into activeQuestions.
    // rats, we might have asked all the questions in this newly active group.
    // then we accidentally quit the session early.
    let gax = -1
    gax = this.groupArray
    .findIndex(g  => g.statusQnA == 'pending' && g.threshHit == 'y')
    this.logFun('qna686 gax: '+ gax)
    // this.logFun(gax)
    let myGroupSeq = '9999'
    if (gax > -1) {
      myGroupSeq = this.groupArray[gax].seq.toLowerCase()
      this.logFun('qna686 myGroupSeq: ' + myGroupSeq)
      // this.logFun(myGroupSeq)
    }
    for (let i = 0; i < this.groupArray.length; i++) {
      if (this.groupArray[i].seq.toLowerCase() == myGroupSeq 
      && this.groupArray[i].threshHit == 'y'
      && this.groupArray[i].statusQnA == 'pending') {
        this.groupArray[i]['statusQnA'] = 'active'
        this.logFun('715 chg stat pend to active. GroupName: ' 
         + this.groupArray[i].groupName)
      } // end if 
    } // end for
    let activeGroups = []
    for (let i = 0; i < this.groupArray.length; i++) {
      if (this.groupArray[i].statusQnA == 'active') {
        this.logFun('qna686 pushing into activeGroups. GroupName: '
         + this.groupArray[i].groupName)
        activeGroups.push(this.groupArray[i].groupName.toLowerCase())
      } //end if
    }  //end for
    // part b:  stuff into activeQuestions
    for (let i = 0; i < this.allQuestions.length; i++) {
      if (activeGroups.includes(this.allQuestions[i].subset.toLowerCase())) {
        if ( this.allQuestions[i].answeredAlready == 'n') {
          this.activeQuestions.push(this.allQuestions[i])
        } // end if
      } // end if
    }  //end for
    this.qnaRound = this.qnaRound + 1 
    // this.logFun('qna686 bottom of findNextRoundOfActiveQuestions')
    // this.logFun('qna686 myGroupSeq:')
    // this.logFun(myGroupSeq)
  } // end findNextRoundOfActiveQuestions

  sortRoundOfActiveQuestions(){
    this.logFun('qna753 running sortRoundOfActiveQuestions ' )
    function compareSeq(a, b) {
      let comparison = 0;
       if (Number(a.questSeq) && Number(b.questSeq)){  
         // a and b are both numbers
         if (Number(a.questSeq) > Number(b.questSeq)) {comparison=1}
         if (Number(a.questSeq) < Number(b.questSeq)) {comparison=-1}
       } else {
          // a or b is alpha
          if (a.questSeq > b.questSeq) {comparison=1}
          if (a.questSeq < b.questSeq) {comparison=-1}
       } //end if/else
      return comparison
    } // end function compareSeq
    this.activeQuestions.sort(compareSeq)
    // this.logFun(this.activeQuestions)
  }  // end sortRoundOfActiveQuestions

  setRoundFirstActiveQuest(){
    this.logFun('qna773 running setRoundFirstActiveQuest ' )
    this.msg1='starting a round of questions. ' //+ (this.qnaRound) + '.'
    this.curQuestTxt = ''
    this.curPreQuest = ''
    this.curAca = []
    this.curAcaFrame = []
    if (this.activeQuestions.length > 0) {
      this.showQuestHtml = true
      this.showAnswerGroupHtml = true
      this.curQuestTxt = this.activeQuestions[0].questTxt
      this.curPreQuest = this.activeQuestions[0].preQuest
      this.curAca = this.activeQuestions[0].aca
      this.curAcaFrame = this.activeQuestions[0].acaFrame
      if(this.curQuestTxt.includes('\n')) {
        this.questHasLinBrk = true
      } else {
        this.questHasLinBrk = false
      } // end if includes \n    
    } // end if
    if (this.activeQuestions.length == 0) { 
       // the participant is active, but there are no questions.
       // do something wonderful, but running wrapUp might not be right.
       //this.wrapUp() // running wrapUp twice??
    }
    // this.logFun('qna766 bottom of setRoundFirstActiveQuest')
      } // end of setRoundFirstActiveQuest

  async wrapUp(){
    this.logFun('ww789 running wrapUp ' )
    //this.msg1 = 'wrapping up answers and scores...'
    this.showQuestHtml = false
    this.showAnswerGroupHtml = false
    this.logFun('ww794 final answers in answerArray:')
    this.logFun(this.answerArray)
    this.logFun('ww794 final accums in accumArray:')
    this.logFun(this.accumArray)
    this.checkForAnyMissingScores()
    // this.logFun('812 wrap up')

    // somehow, wait for db updates to answers,scores,participants
    // before telling him thank you.
    // tried promises to wait for db, but promises are confusing.
    // Promise.all([
    //   this.readScoreProm,
    //   this.writeScoreProm,
    //   this.updateScoreProm,
    //   this.writeAnswerProm])
    //   .then((allPromVals) => {
    //})

    ///=== hack to wait for db updates. wait for 3500 milliseconds.
    this.logFun('ww start timeout wait ') 
    this.msg1 =  ' Wrapping up answers and scores... '
      + this.answerArray.length.toString() + ' answers. '
      + this.accumArray.filter(a=> a.accumScore>0).length.toString()
      + ' scores.  '
    let promise1 = new Promise((resolve, reject) => {
      setTimeout(() => resolve(" timeout resolve"), 3500) // 5.5 seconds
    })
    let prom1var = await promise1 // wait until promise1 resolves (*)
    this.logFun('ww end timeout wait ') 
    ///=== done waiting, now run the rest of this paragraph.

    this.userObj['status']       = 'done'
    this.userObj['userDateTime'] = this.dateTimeNow 
    this.userObj['priorQ']       = this.answerClickedCnt
    this.updateParticipantDb(this.userObj,'from wrapUp')

    this.atEndCompareQuestionCounts()
    this.atEndCompareAccumsAndScores()
    this.atEndCompareAnswerCounts() 
    this.logFun('830 diagMsgArray:')
    this.logFun(this.diagMsgArray)
    this.msg1 = 'Thank you, ' + this.firstNameInput
    + ', for taking this Qna. '
    this.showDoneHtml = true

    // someday maybe:
    // < a href="mailto:john@example.com">John< /a>
  } // end wrapUp

  checkForAnyMissingScores(){
    this.logFun('running checkForAnyMissingScores ' )
    // Dec 2022 Selzer. 
    // look for any scores not yet written, and write them:
    // read accumArray, see if there are any not-yet-written scores.
    // look for a mismatch between questions asked and total questions.
    // these might be for questions that were never asked,
    // cuz they are part of un-asked (never triggered) groups,
    // yet some groups WERE asked. (there is a score > 0)
    this.logFun('851 accumArray:')
    this.logFun(this.accumArray)
    for (let i=0;i<this.accumArray.length;i++){
      if (this.accumArray[i].accumScore > 0) {
          if (this.accumArray[i].accumQuestCnt 
              != this.accumArray[i].accumQuestCntTot ) {
               this.logFun('854 found a not-yet-scored accumArray row.')
               this.logFun('calling para to store this one accum: '
               + this.accumArray[i].accum)
               //  this.accumArray[i].accumNeedsDbScoreUpsert = 'y'
               this.readOneScoreUpdateOrWriteOneScore(i) 
          } // end inner if
      } //end outer if
    } // end for
  } // end fun

  atEndCompareAccumsAndScores(){
    this.logFun('ww824 running atEndCompareAccumsAndScores')
    // run diagnostics at the end of the survey/assessment.
    let sdx = -1
    for (let i=0;i<this.accumArray.length;i++){
      // scoreDebugger array: we built that thing
      // when we inserted & updated score recs.
      sdx = this.scoreDiagArray
      .findIndex(sda => sda.accum == this.accumArray[i].accum)
      if (sdx==-1 && this.accumArray[i].accumQuestCnt > 0){
        this.logFun('ww824 rats, no scoredebugger rec to match accumArray accum:')
        this.logFun(this.accumArray[i].accum)
      }
      if (sdx>-1 && this.accumArray[i].accumScore != this.scoreDiagArray[sdx].score){
        this.logFun('ww824 rats, mismatch accumArray and scoreDiagArray.')
        this.logFun('ww824 accumArray accum: '+this.accumArray[i].accum)
        this.logFun('ww824 accumArray accumscore: '+this.accumArray[i].accumScore)
        this.logFun('ww824 scoreDiagArray accum: '+this.scoreDiagArray[sdx].accum)
        this.logFun('ww824 scoreDiagArray score: '+this.scoreDiagArray[sdx].score)
      }  // end if
    } // end for

    // compare accum question count with accum question count total:
    for (let i=0;i<this.accumArray.length;i++){
      if (this.accumArray[i].questCnt != this.accumArray[i].questCntTot){
        this.logFun('ww824 rats, accum questCnt <> questCntTot')
        this.logFun('accumArray question count:' )
        this.logFun( this.accumArray[i].questCnt)
        this.logFun('accumArray question count total:')
        this.logFun( this.accumArray[i].questCnt)
        // compare scores written to scores array?
      } // end if
    } // end for
  } // end atEndCompareAccumsAndScores

  atEndCompareAnswerCounts() {
    this.logFun('ww824 running atEndCompareAnswerCounts')
    this.logFun('past answers count: ' + this.pastAnswerCount)
    this.logFun('answer clicked this session count: '+ this.answerClickedCnt )
    this.logFun('answers captured this session count: ' + this.answerArrayStoredToDb.length)
    // let answersThisSessionCount = 
    //   this.allQuestions.filter(a=>a.answeredThisSession == 'y').length

    if (this.answerClickedCnt != this.answerArrayStoredToDb.length){
      this.logFun('908 rats, answerCount mismatch.')
    } // end if

      let questionsNotAsked = this.allQuestions
          .filter(a=>a.answeredAlready == 'n'
                  && a.answeredThisSession == 'n') 

      this.logFun('answers stored to db this session count:' + this.answerArrayStoredToDb.length  )
      this.logFun('questions not answered (assume not asked) count: '
                  + questionsNotAsked.length)
      this.logFun('924 allQuestions array: ')
      this.logFun(this.allQuestions)
      this.logFun('920 questions not answered (assume not asked) array: ')
      this.logFun(questionsNotAsked)
      this.logFun('922 answerArray:')
      this.logFun(this.answerArray)
      
  } // end atEndCompareAnswerCounts

  atEndCompareQuestionCounts() {
    this.logFun('939 running atEndCompareQuestionCounts')
  
      // Dec 2022 group main diagnostics
    // count  not-yet-answered questions in group 'Main'
    // count  already-answered questions in group 'Main'
    this.diagMainAnsweredCnt = this.allQuestions
      .filter(a=> a.subset == 'Main'  && a.answeredThisSession == 'y')
      .length
    this.diagMainNotAnsweredCnt = this.allQuestions
    .filter(a=> a.subset == 'Main'  && a.answeredThisSession != 'y')
    .length

   this.logFun('Main questions asked: ' +this.diagMainAnsweredCnt)
   this.logFun('Main questions not asked: ' +this.diagMainNotAnsweredCnt)
} // end atEndCompareQuestionCounts
   
  launchQtReadQuestions () {
    this.logFun('pp846 running launchQtReadQuestions')
    this.msg1 = 'reading questions...'
    apiFauna.qtReadQuestions(this.cust,this.qid)
        .then 
        (   (qtDbRtnObj) => 
          {
            this.logFun('pp846 running .then of apiFauna.qtReadQuestions ' ) 
            this.loadQuestionsFromDbToAllQuestions(qtDbRtnObj)
            this.buildListOfAccumsFromAllQuestions()
            this.matchAllQuestionsToAlreadyAnsweredQuestions()
            this.setAlreadyCompletedGroups()
            this.launchQtReadRules() // has its own chaining
          }
        )
        .catch(() => {  // apiFauna.qtReadQuestions returned an error 
          this.msg1 = 'error reading questions.'
          this.logFun('apiFauna.qtReadQuestions error. cust and qid:' )
          this.logFun(this.cust + this.qid)
        })
  } // end launchQtReadQuestions
 
  loadQuestionsFromDbToAllQuestions(qtDbObj){
    this.logFun('pp866 running loadQuestionsFromDbToAllQuestions ' )
    // input is qtDbObj from database and output allQuestions array.
    // get here after .then of reading db,
    // so qtDbObj is ready to use.
    this.allQuestions.length = 0 //blank out array, then load it
    for (let i = 0; i < qtDbObj.length; i++) {
      this.allQuestions.push(qtDbObj[i].data)
      this.allQuestions[i].answeredAlready = 'n'
      this.allQuestions[i].answeredThisSession = 'n'
      // this.allQuestions[i].subset = this.allQuestions[i].subset.toLowerCase()
      for(let j=0; j<this.allQuestions[i].accum.length; j++){
        // this.allQuestions[i].accum[j] = this.allQuestions[i].accum[j].toLowerCase()
      } // end inner for
    } // end outer for
    // this.logFun('bottom of loadQuestionsFromDbToAllQuestions')
    // this.logFun(this.allQuestions)
  }  // end loadQuestionsFromDbToAllQuestions

  buildListOfAccumsFromAllQuestions(){
    this.logFun('pp885 running buildListOfAccumsFromAllQuestions ' )
    // read all questions array, find the unique accumulators.
    // push a newly discovered accum into accumArray.
    let pos = -1
    for (let i = 0; i < this.allQuestions.length; i++) {
      // this question has an array of accumulators.
      for (let j = 0; j < this.allQuestions[i].accum.length; j++) {
        // find the accum in accumArray. if not found, add it.
        pos = this.accumArray
        .findIndex(a => a.accum.toLowerCase() 
                   == this.allQuestions[i].accum[j].toLowerCase())
        if (pos >=0){  // add to an existing accum
          this.accumArray[pos].accumQuestCntTot +=1
        } else {       // append a new accum 
           this.accumObj = { 
              'accum': this.allQuestions[i].accum[j],
              'accumScore' : 0,
              'accumQuestCntTot' : 1,
              'accumQuestCnt' : 0,
              'accumTimeGap' : 0,
              'accumScoreRound' : 0,
              'accumNeedsDbScoreUpsert' : 'n',
            }
          this.accumArray.push(this.accumObj)
        } // end if
      } // end inner for
    } // end outer for
    // this.logFun('pp885 bottom of buildListOfAccumsFromAllQuestions.')
    // this.logFun(this.accumArray)
  } //end buildListOfAccumsFromAllQuestions

  launchQtReadGroups() {
    this.logFun('pp918 running launchQtReadGroups ' )
    this.msg1 = 'reading question groups...'
    apiFauna.qtReadGroups(this.cust,this.qid)
        .then 
        (   (qtDbRtnObj) => 
          {
            this.logFun('pp918 running .then of apiFauna.qtReadGroups' ) 
            this.buildListOfGroups(qtDbRtnObj)
            this.sortListOfGroups()
            this.launchQtReadQuestions() // read questions
          }
        )
        .catch(() => {  // apiFauna.qtReadGroups returned an error 
          this.msg1 = 'error reading groups.'
          this.logFun('apiFauna.qtReadGroups error.')
          this.logFun('cust & qid: '+this.cust+this.qid)
        })
  } //end launchQtReadGroups

  buildListOfGroups(qtDbObj){
    this.logFun('pp937 running buildListOfGroups ' )
    this.groupArray.length = 0  //start out with an empty array.
    if (qtDbObj.length == 0){
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
    this.logFun('pp955 running sortListOfGroups ' )
    function compareSeq(a, b) {
      let comparison = 0;
       if (Number(a.seq) && Number(b.seq)){  
         // a and b are both numbers
         if (Number(a.seq) > Number(b.seq)) {comparison=1}
         if (Number(a.seq) < Number(b.seq)) {comparison=-1}
       } else {
          // a or b is alpha
          if (a.seq > b.seq) {comparison=1}
          if (a.seq < b.seq) {comparison=-1}
       } //end if/else
      //   if (Number(a.seq) > Number(b.seq)) { comparison=1 } 
      //   else { if (Number(a.seq) <  Number(b.seq)) { comparison=-1}
      // } 
      //===
  //     if (a.seq.toString().padStart(4,'0') 
  //     > b.seq.toString().padStart(4,'0')) {
  //    comparison = 1;
  //  } else if (a.seq.toString().padStart(4,'0') 
  //            < b.seq.toString().padStart(4,'0')) {
  //    comparison = -1;
  //  }
      //===
      return comparison;
    } // end function compareSeq
    
    this.groupArray.sort(compareSeq)
    // this.logFun('950 sorted groupArray:')
    // this.logFun(this.groupArray)
  } // end sortListOfGroups

  launchQtReadRules(){
    this.logFun('pp986 running launchQtReadRules ' )
    this.msg1 = 'reading rules...'
    apiFauna.qtReadRules(this.cust,this.qid)
      .then 
        (   (qtDbRtnObj) => 
          {
            this.logFun('pp986 running .then of apiFauna.qtReadRules' ) 
            this.buildListOfRules(qtDbRtnObj)
            this.calcPointsSetAccum() // set accumArray from prior answers
            this.findGroupsWithNoRules()
            this.findNextRoundOfActiveQuestions()
            this.sortRoundOfActiveQuestions()
            this.setRoundFirstActiveQuest()
          }
        )
        .catch(() => {  // apiFauna.qtReadRules returned an error 
          this.msg1 = 'error reading rules.'
          this.logFun('apiFauna.qtReadRules error. cust and qid:')
          this.logFun(this.cust+this.qid)
        })

  } //end launchQtReadRules

  buildListOfRules(qtDbObj){
    this.logFun('pp1010 running buildListOfRules ' )
    for (let i = 0; i < qtDbObj.length; i++) {
      this.rulesArray.push(qtDbObj[i].data)
    }
    for (let i=0;i<this.rulesArray.length; i++){
      // this.rulesArray[i].accum = this.rulesArray[i].accum.toLowerCase()
      // this.rulesArray[i].subset = this.rulesArray[i].subset.toLowerCase()
    }
  } // end buildListOfRules

  findGroupsWithNoRules(){
    this.logFun('pp1023 running findGroupsWithNoRules ' )
    // this is run at the start of a qna session.
    // look for groups that have no rule.
    // for groups with no rule,  set group.threshHit to 'y' 
    // becuz groups without rules are the same as hitting a thresh.
    let rax = 0
    for (let gax = 0; gax < this.groupArray.length; gax++) {
       rax = this.rulesArray
       .findIndex(r => r.subset.toLowerCase() == this.groupArray[gax].groupName.toLowerCase())
      if (rax == -1){
        // we found no rule for this group.
        this.logFun('1057 no rule for: '+ this.groupArray[gax].groupName.toLowerCase())
        this.groupArray[gax].threshHit = 'y' 
      } // end if
    }  // end for
    this.logFun('pp1023 end of findGroupsWithNoRules. groupArray:')
    this.logFun(this.groupArray)
  } // end findGroupsWithNoRules

  compareRulesScoresGroups(accumIxParmIn){
    this.logFun('pp1046 running compareRulesScoresGroups ' )
    // selzer Dec 2022 sax is now an input parm.
    let sax = accumIxParmIn
    /// this para is driven by rulesArray, 
    /// uses accumArray, groupArray --- updates groupArray.
    //   loop thru rules rax++  find a score for the rule(rax)
    //   if ya got a score for the rule,
    //    check thresh of the rule compare to score
    //   if thresh hit
    //    find group for this rule: 'will trigger group'  (rulesArray.subset) 
    //    and set groupArray(gax).threshHit = 'y'
    // done loop thru all rules.
    // dec 2022 do this just for one accum ==== accumIxParmIn.
    // call this para only when he answered a final question for this accum.
    for (let rax = 0; rax < this.rulesArray.length; rax++) {
      if (this.rulesArray[rax].accum == this.accumArray[sax].accum) { 
        let gax = -1
        gax = this.groupArray
        .findIndex(g => g.groupName.toLowerCase() == this.rulesArray[rax].subset.toLowerCase())
        if (gax > -1) {
          this.checkThresh(rax,gax,sax)
        } // end if
      }  //end if
    } //end for
    // this.logFun('pp1046 bottom of compareRulesScoresGroups.')
  } // end compareRulesScoresGroups

  checkThresh(rax,gax,sax){
    this.logFun('1085 running checkThresh... ' )
    // we are current on a rule,   group,  & scoreboard.
    // check if a rule threshold is hit for this group.
    // rax: rules array index (was set before we got here)
    // gax: group array index (was set before we got here)
    // sax: accum array index (was set before we got here)

    if ((this.rulesArray[rax].oper == '>='
      || this.rulesArray[rax].oper == 'greater than or equal to')
    &&  this.accumArray[sax].accumScore >= this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
    } //end if oper >=

    if ((this.rulesArray[rax].oper == '<='
      || this.rulesArray[rax].oper == 'less than or equal to')
    &&  this.accumArray[sax].accumScore <= this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
    } //end if oper <=

    if ((this.rulesArray[rax].oper == '!='
      || this.rulesArray[rax].oper == 'not equal to')
    &&  this.accumArray[gax].accumScore != this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
    } //end if oper !=

    if ((this.rulesArray[rax].oper == '=='
      || this.rulesArray[rax].oper == 'equal to')
    &&  this.accumArray[sax].accumScore == this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
    } //end if oper ==
    
    if ( (this.rulesArray[rax].oper == '=' 
      || this.rulesArray[rax].oper == 'equal to')
    &&  this.accumArray[sax].accumScore == this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
    } //end if oper =

    if (this.rulesArray[rax].oper == '<'
    ||  this.rulesArray[rax].oper == 'less than') {
      if  (this.accumArray[sax].accumScore < this.rulesArray[rax].thresh) {
        this.groupArray[gax].threshHit = 'y'  
        this.logFun('1140 less than threshHit..*-* ')
        this.logFun('rulesArray[rax].accum:')
        this.logFun(this.rulesArray[rax].accum)
        this.logFun('rulesArray[rax].subset:')
        this.logFun(this.rulesArray[rax].subset)  
      } //end inner if 
    } // end outer if

    if ((this.rulesArray[rax].oper == '>'
      || this.rulesArray[rax].oper == 'greater than')
    &&  this.accumArray[sax].accumScore > this.rulesArray[rax].thresh) { 
      this.groupArray[gax].threshHit = 'y'
      this.logFun('threshHit greater than *-*')
      this.logFun('rulesArray[rax].accum:')
      this.logFun(this.rulesArray[rax].accum)
      this.logFun('rulesArray[rax].subset:')
      this.logFun(this.rulesArray[rax].subset)
    } //end if oper >
  } // end checkThresh

  readParticipantUpdateOrAddParticipant() {
   this.logFun('aa1141 running readParticipantUpdateOrAddParticipant')
   this.msg1 = 'reading participant...'
   apiFauna.qtReadUser(this.cust,this.qid,this.qUserId)
   .then  
      ((qtDbRtnObj) => {
        this.logFun('aa1141 running .then of apiFauna.qtReadUser' ) 
        this.buildUserObj(qtDbRtnObj)
        if (qtDbRtnObj.length == 0) {
          this.launchQtAddParticipant()
        } else {
          // user has signed on before, now he is returning.
          if (this.userObj['status'] == 'done') {
            this.msg1 = 'you already completed this Qna.'
            this.showDoneHtml = true
            return
          } else {
             Object.assign(this.userObj,{userDateTime: this.dateTimeNow })
             this.updateParticipantDb(this.userObj,'from readParticipant')  
          } // end inner if
          } // end outer if
          this.launchQtReadPastAnswers() // find past answers. has chaining.
    }) // end .then
    .catch(() => {  // apiFauna.qtReadUser returned an error
        this.msg1 = 'error reading user.'
        this.logFun('apiFauna.qtReadUser error. cust qid qUserId:' 
        + this.cust + this.qid + this.qUserId)
    }) // end .catch
  } //end qtReadParticipant

  launchQtAddParticipant() {
  this.logFun('1165 running launchQtAddParticipant ' )
  //this.msg1 = 'adding participant...'
  apiFauna.qtAddParticipant(this.userObj)
    .then 
      (   (qtDbRtnObj) => 
        {
          this.logFun(' running .then of apiFauna.qtAddParticipant' ) 
          this.msg1 = 'Starting Qna for ' 
          + this.firstNameInput + ' ' + this.lastNameInput 
          + '.'
          this.showSignHtml = false
        }
      )
      .catch(() => {  // api returned an error 
        this.msg1 = 'error adding participant.'
        this.logFun('1165 apiFauna.qtAddParticipant error. userObj:')
        this.logFun(this.userObj)
      })

  } //end launchQtAddParticipant

  launchReadSurveyName(){
    this.logFun('1149 running launchReadSurveyName ' )
    this.msg1 = 'finding your Qna...'
    apiFauna.qtReadSurvey(this.cust,this.qid)
          .then ((qtDbRtnObj) => 
          {
            this.msg1 = 'Welcome. Please sign in to start the Qna.'
            this.logFun(' running .then of apiFauna.launchReadSurvey' )
            if (qtDbRtnObj.length>0) {
              this.surveyName = qtDbRtnObj[0].data.surveyName
              this.surveyIcode = qtDbRtnObj[0].data.icode
            } // end if
          } )
        .catch(() => {  // api returned an error 
          this.msg1 = 'error reading survey.'
          this.logFun('1165 apiFauna.readSurvey error.'+this.cust+this.qid)
        })
  } // end launchReadSurveyName

  debugAnswerError(answerObjParm){
    this.logFun('1204 running debugAnswerError. ')
  } // end debugAnswerError

  ctrlShiftAltWasHit(){
    this.logFun('running ctrlShiftAltWasHit ')
    // toggle diagnostic button on off
    if (this.showDiagButHtml){
      this.showDiagButHtml = false  // ctrl shift alt
    } else {
      this.showDiagButHtml = true  // ctrl shift alt
    }
  } // end ctrlShiftAltWasHit

  logFun(logParmIn1){
    // use this instead of console.log and console.table.
    // logs only if debugLvl not equal 0.
    if (this.debugLvl=='0'){ return }
    let nd = new Date() //format datetime to 2022/12/31 01:31:32.555
    let a = nd.toLocaleDateString('zh-CN')
    let b = nd.getHours().toString().padStart(2,'0')
    let c = nd.getMinutes().toString().padStart(2,'0')
    let d = nd.getSeconds().toString().padStart(2,'0')
    let e = nd.getMilliseconds().toString().padStart(3, '0') 
    let myDateTime = a+' '+b+':'+c+':'+d+'.'+e
    
    if (typeof logParmIn1  == 'object') {
      console.table(logParmIn1 )
      console.log('💫',myDateTime)
      //💫 Dizzy https://emojipedia.org/emoji-1.0/
    } else {
      console.log(myDateTime, '💠', logParmIn1 )
      //💠 Diamond with a Dot
      this.buildDiagMsgObj(myDateTime , logParmIn1)
      this.diagMsgArray.push(this.diagMsgObj)
      // maybe someday write to fauna log    
      // this.writeDiagMsgToDb(this.diagMsgObj) 
    } // end if 
} // end logfun

  setScrDiagOnOff(){
    this.logFun('1350 running setScrDiagOnOff ' )
    // as of Spring 2021, control diagnostics with ctrl+alt+shift
    if (this.showDiagHtml == true) {
      this.showDiagHtml = false
      this.msg1 = 'diagnostics turned off.'
    }else{
      this.showDiagHtml = true
      this.msg1 = 'diagnostics turned on.'
    } // end if
  } // end setScrDiagOnOff

} //end class QuestComponent

// notes
// how duz  .then stuff work? by chaining confusion.
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
// maybe restructure to follow the chain of .then every time?
// and we like how the test continues asking questions even though
// we store an answer async, but when we run out of questions
// we cant do the wrap up until the last answer is stored.
// ( cuz it makes the screen messages out-of-order)
// ( cuz it wrecks the final write to user db table)
/////
//what i think async await does:::::::::::::::::::::
//caller-function calls my-async-function
//code within my-async-function will halt at await, but with a twist. 
//the halt is only for this func, until the promise is resolved.
//the main pgm is SNEAKY and will continue on, 
//immediately running the next lines of code in caller-function.
//once the promise is resolved, my-async-function will continue after await.
////////////////////////////////////////////////////////////////
// TypeScript is not a first-class citizen 
// - I'm learning Angular 2 and, as a byproduct, 
// I'm learning enough TypeScript to get the job done. 
// Unfortunately, this means that I sometimes spend 
// lotsa time just trying to satisfy the type-checker. 
//// my way to test for numeric:
// if (Number('hello'))  {alert(115)} 
// if (Number(117))      {alert(117)}
//
