import { HostListener, Component, OnInit } from '@angular/core'
import api from 'src/utils/api'

@Component({
  selector: 'app-quest',
  templateUrl: './quest.component.html',
  styleUrls: ['./quest.component.css']
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
  //billy, maybe create question rec layout, like dateCodeCatalog.
  // right now, questions just follow the db rec layout.
  // is that good enuff, or will it be confusing later?
  // maybe related to 
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
  //
  // may 2021. figure out date time for all db files.
  // as of may 2021, we set answers and scores with 00:00 time.
  // but user db has the real latest time, so ya can see reality.
  // so, the user db duznt match answer/scores. but that seems ok.

  // when done building allQuestions array,
  // and done building pastAnswers array,
  // and before asking any questions,
  // mark those recs in allQuestions array that have been answered already.
  // later, when choosing a smaller set of questions,
  // further filter by only those questions no-yet-answered.

  ngOnInit(): void {
    this.setQueryStringParms()
    // may 2021 selzer. lauchQtReadSubsets after signon.
    //this.launchQtReadSubsets(Event) //fetch subsets from db
    // that chains launchQtReadQuestions (questions)
    //       that chains launchQtReadRules (rules) 
    // cuz of promise-oriented fauna, dont fetch more db data here.
    // someday chain the asyn events in an organized way.
    // as of Nov2020 see chain-ish stuff in .then of launch paras.
  } // end ngOnInit
  
  setQueryStringParms(){
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
    console.log ( 'done setQueryStringParms.' 
    + ' cust: ' + this.cust
    + ' qid: '  + this.qid
    + ' icode: '+ this.icode )
  }

  ctrlShiftAltWasHit(){
    console.log('running ctrlShiftAltWasHit')
    // toggle diagnostic button on off
    if (this.showDiagButHtml){
      this.showDiagButHtml = false  // ctrl shift alt
    } else {
      this.showDiagButHtml = true  // ctrl shift alt
    }
  } // end ctrlShiftAltWasHit

  doSign(){ // user clicked go onscreen
    console.log('running doSign')
    this.validateSignOn()
    if (this.msg1 == 'ok') {
      // db function chaining, see .then
      // readuser > readsubsets > readquestions
      this.msg1 =  "let's look you up, " + this.firstNameInput + ' ...'
      this.qtReadUser(Event) 
      // pgm will continue in .then of qtReadUser
    }
  }

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

  firstNameChg(ev){
    this.firstNameInput = 
      ev.target.value[0].toUpperCase() + ev.target.value.substring(1)
  }

  lastNameChg(ev){
    this.lastNameInput = 
      ev.target.value[0].toUpperCase() + ev.target.value.substring(1)
  }

  phoneChg(ev){
    this.phoneInput = ev.target.value 
  }

  buildUserObj(dbUserObj){
    if (dbUserObj.length > 0){
      console.log('user is found in dbb')
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
    if (dbUserObj.length ==0){
      console.log('user not found in dbb')
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
      console.table(this.userObj)
    }
    // for an exising user that is continuing,
    // cuz they help set a reduced question list.
    console.log('182')
    console.table(this.userObj)
  } // end buildUserObj

  chkUserStatus(){
    console.log('running chkUserStatus')
    // is the user signing on, but has completed the survey already?
    // is the user returning after partial completion?
    // can we shrink the remaining question list ?
    // like, maybe if priorQ == 777 then delete all questions before 777.
    // assumes that the question list is sorted nicely.
    // hey what about subsets? 
    // ... or .... is this more bulletproof?
    // if previously partially-completed, maybe match his prior answers
    // to the question list.
    // delete from question list if he answered already.
    //
    // a different complicated topic: what about a return user,
    // that is taking the survey AGAIN?
    // if he is purposely taking the survey again,
    // then we should make him say so:
    // dear john smith, you already completed this survey.
    // would you like to start again?
    // if YES, then take his old user rec, and flag it as INACTIVE.
    // then insert a new user rec.
    // john smith  1111 May13 INACTIVE
    // john smith  1111 May14 ACTIVE
    if (this.userFoundInDb &&   this.userObj[ "priorQ" ] > 0) {
      this.launchQtReadAnswers(Event) // find past answers. has chaining.
    }
  } // end chkUserStatus

  setPastAnswers(answersFromDb){
    console.log('running setPastAnswers')
    // get here after reading answers for this user, for a prior session.
    // set db records into pastAnswers array.
    // console.table(answersFromDb)
    // console.table(answersFromDb[0].data)
    for (let i = 0; i < answersFromDb.length; i++) {
      // console.log('238')
      this.pastAnswers.push(answersFromDb[i].data)
      // console.log(this.pastAnswers[i])
    } // end for loop
   //console.log(answersFromDb.data.length)
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
      this.launchQtWriteUser(Event)
    }
  }  // end upsertUser

  setUserFieldsAfterAnswer() {
    console.log('running setUserFieldsAfterAnswer')
    // he answered a question. lets remember how far he got.
    // set user info into userObj for some user attributes
    // bizzarre bracket notation -- this.myObj[ "foo" ]  typescript sucks.
    Object.assign(this.userObj,{userDateTime: this.dateTimeNow })
    Object.assign(this.userObj,{status:  'active' })
    Object.assign(this.userObj,{priorQ:  this.answerObj[ "questNbr" ]})
    //alert(this.answerObj[ "questNbr" ])
    console.table(this.userObj)
  } // end setUserFieldsAfterAnswer

  answerClicked(hisAnsAcaIxFromHtml) {
    console.log('running answerClicked')
    // called from html, he clicked an answer
    this.calcAnswerTimeGap()
    this.storeAnswer(hisAnsAcaIxFromHtml)  
    if (this.aqx < this.activeQuestions.length - 1) { 
      //console.log('ready to ask another question')
      this.aqx = this.aqx + 1
      this.curQuestTxt = this.activeQuestions[this.aqx].questTxt
      this.curPreQuest = this.activeQuestions[this.aqx].preQuest 
      this.curAca = this.activeQuestions[this.aqx].aca 
      this.curAcaFrame = this.activeQuestions[this.aqx].acaFrame
    } else { //we are at the end of active questions
        console.log('306 we are at the end of a subset ')
        this.closeOutActiveAndPrepNextQuestions()
        if (this.activeQuestions.length > 0) {  //we have more questions
          this.aqx = 0
          this.curPreQuest = this.activeQuestions[0].preQuest
          this.curQuestTxt = this.activeQuestions[0].questTxt
          this.curAca = this.activeQuestions[0].aca
          this.curAcaFrame = this.activeQuestions[0].acaFrame

        } else {
          this.wrapUp() //we are done with qNa.
        } // end if activeQuest length >0
    } // end if this.aqx
  } // end answerClicked

  closeOutActiveAndPrepNextQuestions(){
    console.log('closeOutActiveAndPrepNextQuestions')
    for (let i = 0; i < this.subsetArray.length; i++) {
      if (this.subsetArray[i].ssStatusQnA == 'active') {
          // console.log('143 setting status to done for subset:')
        console.log( this.subsetArray[i].subset)
        this.subsetArray[i].ssStatusQnA = 'done'
      }
    }
    this.calcScores()
    this.storeScores()
    this.applyRulesToAccumsAndSubsets() // set accumThreshHit to y or n  
    this.findNextRoundOfActiveQuestions()
    this.sortRoundOfActiveQuestions()

    this.curQuestTxt = ''
    this.curPreQuest = ''
    this.curAca = []
    this.curAcaFrame = []
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
    //console.log('running storeAnswer')
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
    this.writeAnswerToDb(Event) //has its own chaining  .then
    // billy ya might want to
    // first, look for an existing answer in the db and replace it.
    // if no existing answer, then insert one.
    // look in fauna forums for upsert.  

  } //end storeAnswer

  buildAnswerFields(){
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
    }
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

  writeAnswerToDb(e){
    //console.log('running writeAnswerToDb')
    // writing to the db is helpful for some other later time,
    // but for now, only the answerArray is useful.
    this.msg1 = 'writing answer to database...'
    api.qtWriteAnswer(this.answerObj)
        .then 
        (   (qtDbRtnObj) => 
          {
            this.qtDbDataObj = qtDbRtnObj.data
            this.answerCnt = this.answerCnt + 1
            if (! this.showWrapUpHtml) { // show progress if we arent done.
              this.msg1 = this.firstNameInput + "'s " 
              + 'answer count: ' + this.answerCnt 
              // setting msg1 here clobbers  wrapup, cuz of async.
            }
            this.setUserFieldsAfterAnswer() // remember how far he got.
            this.updateUserDb() // has its own chaining
            // return from this on-the-fly function is implied  
          }
        ) // done with .then
      .catch((e) => {
        console.log('qtWriteAnswer error. ' +  e)
      })
  } // end writeAnswerToDb

  launchQtReadAnswers = (e) => {
    console.log('running launchQtReadAnswers') 
    api.qtReadAnswers(this.cust, this.qid, this.qUserId)
      .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtReadAnswers') 
            //keep past answers in an array, for comparison later.
            this.setPastAnswers(qtDbRtnObj)
          }
        )
        .catch(() => {  // api.qtReadAnswers returned an error 
          console.log('api.qtReadAnswers error. cust & qid & user ' 
          , this.cust, ' ', this.qid,' ',this.qUserId,' ',
          )
        })
  //================
  } //end launchQtReadAnswers
  
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
          console.log('458 looping j:',j)
          if (this.answerArray[i].scoreRound == 0) { //not scored yet
            this.findAccumAndAddPoints(this.answerArray[i].accum[j],
                                      this.answerArray[i].answerPoints,
                                      this.answerArray[i].timeGap)
            // billy, u r here, need multiple scores cuz multiple accums?
            // this.answerArray[i].scoreRound  = this.scoreRound jun2021
          }
        }
        this.answerArray[i].scoreRound  = this.scoreRound
      } // end answerArray Loop
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
    console.log('ready to store scores. accumArray:')
    // for each row in accumArray,  buildScore & writeScore
    for (let i = 0; i < this.accumArray.length; i++) {
      if (this.accumArray[i].accumStoreDbYn == 'n'
      && this.accumArray[i].accumQuestCnt > 0) 
        {
        this.buildScoreFields(i)
        this.scoresArray.push(this.scoreObj) 
        this.writeScoresToDb(Event)  
        this.accumArray[i].accumStoreDbYn = 'y'
        this.accumArray[i].accumQuestCnt = 0  //reset to zero
      }
    }
  } // end storeScores

  buildScoreFields(i){
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
  }  // end buildScoreFields

  writeScoresToDb(e){
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
  .catch((e) => {
    console.log('qtWriteScore error. ' +  e)
  })
    
  } // end writeScoresToDb

  updateUserDb(){
    console.log('running updateUserDb')
    console.log('528')
    console.table(this.userObj)
    // update one rec on db table qtUser
    api.qtUpdateUser(this.userObj)
    .then 
    (   (qtDbRtnObj) => 
      {
        this.qtDbDataObj = qtDbRtnObj.data
        // return from this on-the-fly functon is implied  
      }
    )
  .catch((e) => {
    console.log('updateUserDb error. ' +  e)
  })
  } // end update User

  matchAllQuestionsToAlreadyAnsweredQuestions(){
    console.log('running matchAllQuestionsToAlreadyAnsweredQuestions')
    // allQuestions questNbr
    // pastAnswers questNbr
    // set allQuestions.answeredAlready to 'y'
    let j = 0
    for (let i = 0; i < this.pastAnswers.length; i++) {
      // find question that matches this pastAnswer, by questNbr
      j = this.allQuestions
          .findIndex(q  => q.questNbr == this.pastAnswers[i].questNbr);
      console.log(this.pastAnswers[i].questNbr)
      this.allQuestions[j].answeredAlready = 'y'
    } // end for
    console.table(this.allQuestions)
  } // end matchAllQuestionsToAlreadyAnsweredQuestions

  findNextRoundOfActiveQuestions(){
    console.log('running findNextRoundOfActiveQuestions')
    let nextMainSubset = '?'
    this.activeQuestions.length = 0  // resetting to zero for next subset
    this.subsetRound = this.subsetRound + 1
    //find the next bunch of subsets (those with rules) to ask
    this.subsetTempArray = []
    for (let i = 0; i < this.subsetArray.length; i++) {
      if (this.subsetArray[i].filterInYn == 'y' 
      &&  this.subsetArray[i].ssStatusQnA == 'pending') {
        this.subsetArray[i].subsetRound = this.subsetRound
        this.subsetTempArray.push(this.subsetArray[i].subset)
        this.subsetArray[i].ssStatusQnA = 'active'
      }
    }  // end for loop subsetArray

    // clever way to pass subsetTempVarArray into .filter  (comma!)
    let subsetTempVarArray = this.subsetTempArray,
    tempActiveQuestions = this.allQuestions.filter(function(q) {
      // May2021 further restrict the filter to not-yet-answered questions
      return subsetTempVarArray.includes(q.subset) && q.answeredAlready == 'n'
    })
    this.activeQuestions = tempActiveQuestions

    if (this.activeQuestions.length == 0){
      // we have not triggered any follow On subsets, 
      // or we are done with those, for now. time to move on and
      // find a not-yet-asked subset (like main2)
      // we are looking for subsets without conditional rules.
      // these type of subsets are always asked.
      for (let i = 0; i < this.subsetArray.length; i++) {
        if (this.subsetArray[i].ssStatusQnA == 'pending') {
          let rai =
          this.rulesArray.findIndex(obj => obj.subset === this.subsetArray[i].subset)
          if (rai == -1) { //subset has no rule.  lets turn it on.
            // console.log(this.subsetArray[i].subset)
            if (nextMainSubset == '?') {
              // console.log(' we hit the next main subset.')
              nextMainSubset = this.subsetArray[i].subset
              this.subsetArray[i].ssStatusQnA = 'active'
              this.subsetArray[i].filterInYn = 'y'
            } // end if nextMainSubset
          } // end if rai -1 subset has no rule. (like a mainX subset)
        } // end if status == pending
      }  //end for subsetArray loop
    } // end if this.activeQuestions.length == 0
    
    if (nextMainSubset != '?')  {
      console.log('nextMainSubset hit:',nextMainSubset)
      //we need to set active questions
      // to the first subset that has no conditional rule:
      let temp2ActiveQuestions = 
        this.allQuestions.filter(function(q) {
          return  q.subset == nextMainSubset
      })
      this.activeQuestions = temp2ActiveQuestions       
    } // end if nextMainSubset != '?'
    console.log('activeQuestions.length:',this.activeQuestions.length)
    if (this.activeQuestions.length == 0) {
      this.msg1 = 'This survey is complete. '
      this.wrapUp()
    }
      console.log('done findNextRoundOfActiveQuestions')
  } // end findNextRoundOfActiveQuestions

  sortRoundOfActiveQuestions(){
    //
    function compareSeq(a, b) {
      let comparison = 0;
      if (a.questSeq > b.questSeq) {
        comparison = 1;
      } else if (a.questSeq < b.questSeq) {
        comparison = -1;
      }
      return comparison;
    } // end function compareSeq
    
    this.activeQuestions.sort(compareSeq);
  }  // end sortRoundOfActiveQuestions

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
    this.msg2 = 'This survey was brought to you by the QnC company.  '
    + 'How was your experience?  Your feedback is appreciated.  '
    + 'Please email us at feedback@qncCompany.com.'
    Object.assign(this.userObj,{status:  'done' })
    this.updateUserDb()  
  } // end wrapUp

/////////////////////////////////////////////////////////////////
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
//
//
////////////////////////////////////////////////////////////////

  launchQtReadQuestions = (e) => {
    api.qtReadQuestions(this.cust,this.qid)
        .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of qtReadQuestions') 
            //this.subset = this.subsetArray[this.sax].subset
            this.loadQuestionsFromDbToAllQuestions(qtDbRtnObj)
            this.buildListOfAccumsFromAllQuestions()
            this.launchQtReadRules(event) // has its own chaining
            console.table(this.allQuestions)
            this.matchAllQuestionsToAlreadyAnsweredQuestions()
            this.findNextRoundOfActiveQuestions()
            this.sortRoundOfActiveQuestions()

            if (this.activeQuestions.length > 0) {
              this.curQuestTxt = this.activeQuestions[0].questTxt
              this.curPreQuest = this.activeQuestions[0].preQuest
              this.curAca = this.activeQuestions[0].aca
              this.curAcaFrame = this.activeQuestions[0].acaFrame

            }
          }
        )
        .catch((e) => {  // api.qtReadQuestions returned an error 
          console.log('api.qtReadQuestions error.' + e)
        })
  }

  loadQuestionsFromDbToAllQuestions(qtDbObj){
    //console.log('running loadQuestionsFromDbToAllQuestions')
    // input is qtDbObj from database and output allQuestions array.
    // get here after .then of reading db,
    // so qtDbObj is ready to use.
    this.allQuestions.length = 0 //blank out array, then load it
    for (let i = 0; i < qtDbObj.length; i++) {
      this.allQuestions.push(qtDbObj[i].data)
      // console.log('questSeq:', this.allQuestions[i].questSeq)
      this.allQuestions[i].answeredAlready = 'n'
      console.table(this.allQuestions[i])
    }
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
      }
    }
  } //end buildListOfAccumsFromAllQuestions

  launchQtReadSubsets = (e) => {
    console.log('running launchQtReadSubsets')
    api.qtReadSubsets(this.cust,this.qid)
        .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtReadSubsets') 
            this.buildListOfSubsets(qtDbRtnObj)
            this.launchQtReadQuestions(Event) // read questions
          }
        )
        .catch((e) => {  // api.qtReadSubsets returned an error 
          console.log('api.qtReadSubsets error.' + e)
        })
  } //end launchQtReadSubsets

  buildListOfSubsets(qtDbObj){
    console.log('running buildListOfSubsets')
    console.table(this.subsetsFromDb)
    this.subsetsFromDb.length = 0 //start out with an empty array.
    for (let i = 0; i < qtDbObj.length; i++) {
      // we are reading as if there are multiple recs from db,
      // but we expect to fetch just one (for this qid), like:
      // {
      //   qid: "1",
      //   subsets: ["main1", "parakeet2", "parakeet3", "doggySet"]
      // }
      this.subsetsFromDb.push(qtDbObj[i].data)
    }
    for (let j = 0; j < this.subsetsFromDb[0].subsets.length; j++) {
      this.subsetObj = {
        'subset' : this.subsetsFromDb[0].subsets[j],
        'filterInYn' : 'n', // variably overwritten below
        'ssStatusQnA' : 'pending',
        'subsetRound' : 0
      } // end subsetObj
      this.subsetArray.push( this.subsetObj )
    } //end for loop j
    this.subsetArray[0].filterInYn = 'y' //billy cheating here main1
    this.subsetArray[0].subsetRound = 1 //billy cheating here main1
    console.log('result of buildListOfSubsets')
    console.table(this.subsetArray)
  }  // end buildListOfSubsets

  launchQtReadRules = (e) => {
    console.log('running launchQtReadRules')
    api.qtReadRules(this.cust,this.qid)
      .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtReadRules') 
            this.buildListOfRules(qtDbRtnObj)
          }
        )
        .catch((e) => {  // api.qtReadRules returned an error 
          console.log('api.qtReadRules error.' + e)
        })

  } //end launchQtReadRules

  buildListOfRules(qtDbObj){
    console.log('running buildListOfRules')
    for (let i = 0; i < qtDbObj.length; i++) {
      this.rulesArray.push(qtDbObj[i].data)
    }
    console.log('804 I built these rules:')
    console.table(this.rulesArray)
  } // end buildListOfRules

  applyRulesToAccumsAndSubsets(){
    console.log('running applyRulesToAccumsAndSubsets 488')
    console.table(this.accumArray)
    // two arrays here.  accumArray  rulesArray
    // accumArray[].accumScore is already set.
    // run thru accumArray and set accum.threshHit 'y' 
    // for accums that have hit a rule threshHold.
    for (let i = 0; i < this.accumArray.length; i++) {
      // find this accum in rulesArray to get rulesArray.thresh
      //rules array index:
      let rai = this.rulesArray 
      .map(function(ra) { return ra.accum })
      .indexOf(this.accumArray[i].accum)
      if(rai > -1) { this.checkAccumAgainstRule(rai,i) }
    } // end for loop on accumArray
  } // end applyRulesToAccumsAndSubsets

  checkAccumAgainstRule(rai,i){
    console.log('running checkAccumAgainstRule')
    // console.log(this.rulesArray[rai].accum)
    // console.log(this.rulesArray[rai].oper)
    if (this.rulesArray[rai].oper == '>='
    &&  this.accumArray[i].accumScore >= this.rulesArray[rai].thresh) { 
      this.accumArray[i].accumThreshHit = 'y'
    } //end if oper >=
    if (this.rulesArray[rai].oper == '<='
    &&  this.accumArray[i].accumScore <= this.rulesArray[rai].thresh) { 
      this.accumArray[i].accumThreshHit = 'y'
    } //end if oper <=
    if (this.rulesArray[rai].oper == '!='
    &&  this.accumArray[i].accumScore != this.rulesArray[rai].thresh) { 
      this.accumArray[i].accumThreshHit = 'y'
    } //end if oper !=
    if (this.rulesArray[rai].oper == '=='
    &&  this.accumArray[i].accumScore == this.rulesArray[rai].thresh) { 
      // console.log('bingoo hit thresh ==')
      this.accumArray[i].accumThreshHit = 'y'
    } //end if oper ==
    if (this.rulesArray[rai].oper == '<'
    &&  this.accumArray[i].accumScore < this.rulesArray[rai].thresh) { 
      this.accumArray[i].accumThreshHit = 'y'
    } //end if oper <
    if (this.rulesArray[rai].oper == '>'
    &&  this.accumArray[i].accumScore > this.rulesArray[rai].thresh) { 
      this.accumArray[i].accumThreshHit = 'y'
    } //end if oper >

    if ( this.accumArray[i].accumThreshHit == 'y') {
    this.subsetToFilterIn = this.rulesArray[rai].subset
    this.applyAccumToSubsets() // set subset filterInYn to y
    }
  }

  applyAccumToSubsets(){
    // come into this para with subsetToFilterIn
    // and use it to set one subsetArray.filterInYn
     console.log('running applyAccumToSubsets')
    //  console.log(this.subsetToFilterIn)
    // console.log('find subset and set filterIn to y',this.subsetToFilterIn)
    let ssi =
      this.subsetArray.findIndex(obj => obj.subset === this.subsetToFilterIn)
    this.subsetArray[ssi].filterInYn = 'y'
    //console.table(this.subsetArray)
    //   console.log('ssi',ssi)
    // console.log(this.subsetArray[ssi])

  } // end applyAccumToSubsets

qtReadUser =  (e) => {
   // qtReadUser = async (e) => {  // dreaded async await?
   console.log('running qtReadUser')
   api.qtReadUser(this.cust,this.qid,this.qUserId)
   .then 
      (   (qtDbRtnObj) => 
        {
          console.log(' running .then of api.qtReadUser') 
          this.buildUserObj(qtDbRtnObj)
          this.chkUserStatus()
          this.upsertUser()
          this.launchQtReadSubsets(Event) // leads to more chaining!
        }
      )
      .catch((e) => {  // api.qtReadUser returned an error 
        console.log('api.qtReadUser error.' + e)
      })
} //end launchQtReadUser

launchQtWriteUser = (e) => {
  console.log('running launchQtWriteUser')
  api.qtWriteUser(this.userObj)
    .then 
      (   (qtDbRtnObj) => 
        {
          console.log(' running .then of api.qtWriteUser') 
          //this.buildUserObj(qtDbRtnObj)
          this.msg1 = 'Starting the survey for ' 
          + this.firstNameInput + ' ' + this.lastNameInput 
          + '.'
          this.showSignHtml = false
        }
      )
      .catch((e) => {  // api returned an error 
        console.log('api.qtWriteUser error.' + e)
      })

} //end launchQtWriteUser


  setDiagnosticsOnOff(){
    //console.log('running setDiagnosticsOnOff')
    if (this.showDiagHtml === true) {
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
          .catch((e) => {  // api.qtMassDeleteAnswers returned an error 
            console.log('api.qtMassDeleteAnswers error.' )
          })
} // end massDeleteAnswers

massDeleteScores = (e) => {
    alert('gonna delete Scores...')
    console.log('running massDeleteScores')
    api.qtMassDeleteScores(this.cust,this.qid)
      .then 
        (   (qtDbRtnObj) => 
          {
            console.log(' running .then of api.qtMassDeleteScores') 
          }
        )
        .catch((e) => {  // api.qtMassDeleteScores returned an error 
          console.log('api.qtMassDeleteScores error.' + e)
        })
} // end massDeleteScores

} //end class QuestComponent

// TypeScript is not a first-class citizen 
// - I'm learning Angular 2 and, as a byproduct, 
// I'm learning enough TypeScript to get the job done. 
// Unfortunately, this means that I sometimes spend 
// lotsa time just trying to satisfy the type-checker. 