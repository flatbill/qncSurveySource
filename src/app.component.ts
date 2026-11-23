import { HostListener, Component, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { inject } from '@angular/core'
// import { ActivatedRoute, RouterOutlet } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
// import { RouterModule } from '@angular/router'
import { Router } from '@angular/router'
import getEnvVars from '../../src/utils/getEnvVars'
import apiFauna from '../../src/utils/apiFauna'
import apiSupabase from '../../src/utils/apiSupabase'
import apiTurso from '../../src/utils/apiTurso'
import { isDevMode } from '@angular/core'
import { environment } from '../../src/environments/environment' //.ts
// import { afterNextRender } from '@angular/core'
@Component({
  selector: 'app-root',
  standalone: true,
  // imports: [RouterOutlet],
  templateUrl: './app.component.html',
  // styleUrl: './app.component.css'
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: 'styles.css'
})
export class AppComponent {
  router = inject(Router) //use this for querystrings
  title = 'QnA Tool by Fly Tech Free'
  msg1 = 'starting QnA tool...'
  surveyName: string = ' '
  alphabet = 'abcdefghijklmnopqrstuvwxyz '//valid name chars
  digits = '0123456789' 
  firstNameInput = ''
  lastNameInput = ''
  phoneInput = ''
  curQuestTxt = ''
  curPreQuest = ''
  curQuestNbr = ''
  allQuestions: any = []
  participantArray: any = []
  surveyArray: any = []
  activeQuestions: any = []
  rulesArray: any = []
  subsetArray: any = []
  groupArray: any = []
  questHasLinBrk = false
  curAcaFrame: any = ["never", "sometimes", "always"] //text above answer choices, like never,sometimes,always
  curAca: any = [1, 2, 3, 4, 5, 6, 7, 8]
  debugLvl = '0' // read queryString, set to 1 or 2 to debug.
  cust = '?'
  qid = '?'
  icode = '?'
  promo = '?'
  qUserId = '?'
  priorQ = '?'
  hisAns = '0'
  hisAnsPoints = 0
  aqx = 0 // active question index
  showQuestHtml = false // check default oct2024
  showAnswerGroupHtml = false // chk default oct2024
  showDoneHtml = false
  showDiagHtml = false
  showSignHtml = true // default true selz oct2024
  // todaysDate = new Date().toJSON().split("T")[0] + "T00:00:00"
  // todayStartLocal = new Date().toLocaleDateString('en-CA') 

  //   dateTimeNow = new Date().toJSON().split(".")[0] + "Z"
  //  dateTimeNowLocal = new Date(); // not really local?
  signonDateTime = ''
  answerDateTime = ''
  scoreDateTime = ''
  userObj: any = {}
  // bug user vs qUserId discovered Oct2024. stupid fauna index
  // mismatches the data that we run today.
  // so, all the old fauna data qtusers needs to change
  // from user to qUserId.  Maybe do this if you convert from v4 to v10.
  //the faunaUserObj layout here is not used anywhere.
  faunaUserObj = {
    "cust": this.cust,
    "qid": this.qid,
    "user": this.qUserId, // qtuserX2 has user, but should have qUserId.
    "firstName": this.firstNameInput,
    "lastName": this.lastNameInput,
    "phone": this.phoneInput,
    "userDateTime": this.signonDateTime,    //this.todayStartLocal,
    "localUserDateTime": this.signonDateTime, //this.todayStartLocal,
    "status": ' ',
    "priorQ": ' ',
    "answerCnt": "0",
    "icode": ' ',
    "promo": ' '
  } // end faunaUserObj
  answerObj = {}
  accumObj = {}
  accumArray: any[] = []
  timeGap = 0
  // answerStartTime = performance.now()
  // answerEndTime = performance.now()
  answerStartTime = Math.floor(performance.now() / 1000)
  answerEndTime = Math.floor(performance.now() / 1000)

  // console.log(`seconds elapsed = ${Math.floor(millis / 1000)}`);
  answerClickedCnt = 0
  answerArray: any = []
  qnaRound = 0 //first round will be round 0
  showDiagButHtml = false  // turn on with ctrl shift alt
  scoreDiagArray: any = []
  surveyIcode = ''
  answerArrayStoredToDb: any = []
  diagMainAnsweredCnt = 0
  diagMainNotAnsweredCnt = 0
  pastAnswerCount = 0
  diagMsgArray: any = []
  diagMsgObj = {}
  diagWhichDb = '?'
  fldsCustQid = {}
  fldsCustQidUser = {}
  fldsCustQidUserAccum = {}
  supaEtlEnabled = false
  supaArray = []
  faunaData = {}
  scoresArray: any = []
  whichDb = '?'
  lastInsertRowid: any = 0
  wrapUpPending = true
  ver = '2025.04.27.a'
  constructor(private route: ActivatedRoute) { }
  async ngOnInit() {
    this.logFun('running ngOnInit')
    this.getWhichDb()
     // this.setQueryStringParms() //duznt work here. see ngAfterViewInit.
    this.logFun('end ngOninit')
  }//end ngOnInit
  async getWhichDb() {
    if (isDevMode()) { //angular test environment
      console.log('Running in development mode')
      this.whichDb = environment.whichDb //look inside environment.ts file
    } else {
      console.log('Running in production mode')
      this.whichDb = await getEnvVars.getWhichDb()  
    }//end if
    this.logFun('136 end app.component whichDb')
  }//end getWhichDb 
  ngAfterViewInit() {
    this.logFun('running ngAfterViewInit')
    setTimeout(() => { //hack to wait for querystring to appear, ang.
      this.setQueryStringParms() 
      // localStorage.clear(); //use for testing.
      this.getLocalStorage()
    }, 1500); //timeout at 1.5 seconds
    // timeout hack cuz stupid ang has delay for setting query string parms 
  }//end ngAfterViewInit

  getLocalStorage(){

    // ?? localStorage.setItem('iCode', this.icode)  //came from querystr

   if (localStorage.getItem("fName")!==null){
     this.firstNameInput  = localStorage.getItem('fName')
   }
   if (localStorage.getItem("lName")!==null){
     this.lastNameInput  = localStorage.getItem('lName')
   }
   if (localStorage.getItem("phone")!==null){
     this.phoneInput  = localStorage.getItem('phone')
   }
   if (localStorage.getItem("qUserId")!==null){
     this.qUserId  = localStorage.getItem('qUserId')
   }
    // alert('166 local storage=' + Object.entries(localStorage))
  } //end getLocalStorage

  async setQueryStringParms() {
    // alert('running 167 setQueryString')
    this.logFun('aa 147 running setQueryStringParms ')
    // maybe means querystring might not exist.  default already set.
    // set default to demo
    this.cust = '2'
    this.qid = '1'

    let queryParams = this.route.snapshot.queryParams
    let maybeCust = this.route.snapshot.queryParamMap.get('cust')
    let maybeQid = this.route.snapshot.queryParamMap.get('qid')
    let maybeIcode = this.route.snapshot.queryParamMap.get('icode')
    let maybePromo = this.route.snapshot.queryParamMap.get('promo')
    let maybeDebugLvl = this.route.snapshot.queryParamMap.get('debugLvl')
    if (maybeCust === null) { } else { this.cust = maybeCust }
    if (maybeQid === null) { } else { this.qid = maybeQid }
    if (maybeIcode === null) { } else { this.icode = maybeIcode }
    if (maybePromo === null) { } else { this.promo = maybePromo }
    if (maybeDebugLvl === null) { } else { this.debugLvl = maybeDebugLvl }
    if (this.cust == '?' || this.qid == '?') { } // end if
    this.logFun('154 setQueryStringParms cust,qid,icode,promo:')
    this.logFun(this.cust)
    this.logFun(this.qid)
    this.logFun(this.icode)
    this.logFun(this.promo)
    this.fldsCustQid = {
      "cust": this.cust,
      "qid": this.qid
    }//end set fldsCustQid

    if (this.cust > '' && this.qid > '') {
      this.msg1 = 'finding your survey...'
      if (this.whichDb == 'fauna') {
        this.surveyArray = await this.launchFaunaReadSurvey()
      }//end if fauna
      if (this.whichDb == 'supabase') {
        this.surveyArray = await this.launchReadSupabase('qtSurveys', this.fldsCustQid)
      }//end if supabase
      if (this.whichDb == 'turso') {
        this.surveyArray = await this.launchReadTurso('qtSurveys', this.fldsCustQid)
      }// end if turso
    }//end if

    this.logFun('aa 142 surveyArray:')
    this.logFun(this.surveyArray)
    if (this.surveyArray.length > 0) {
      this.surveyName = this.surveyArray[0].surveyName
      this.surveyIcode = this.surveyArray[0].icode
      this.msg1 = 'Welcome. Please sign in to start the Qna.'
    }//end if
  }//end setQueryStringParms
  
  async doSign() { // user clicked go button onscreen or hit enter
    this.logFun('aa running doSign ')
    this.signonDateTime = this.formatNow()
    this.logFun('aa 199 ' + this.signonDateTime)
    this.logFun(this.participantArray)
    this.validateSignOnFields()
    if (this.msg1 == 'ok') {
      // signon fields are ok.
      this.saveToLocalStorage()
      await this.checkUserAtSignOn()
      if (this.userObj['status'] != 'done') {
        this.startSurvey()
      } // end if
      if (this.userObj['status'] == 'done') {
        this.finalize() // he already finished the survey.
      } // end if
    } // end if
  }//end doSign 

  validateSignOnFields() {
    this.logFun('aa running validateSignOnFields')
    this.msg1 = ''
    this.firstNameInput = this.firstNameInput.trim()
    this.lastNameInput = this.lastNameInput.trim()
    this.phoneInput = this.phoneInput.trim()
    for (let i = 0; i < this.firstNameInput.length; i++) {
      let myChar = this.firstNameInput.toLowerCase().substr(i, 1)
      if (!this.alphabet.includes(myChar)) {
        this.msg1 = 'you have a bad char in firstName'
      }// end if
    }// end for
    if (this.phoneInput.length < 4) { this.msg1 =  'please enter a four-digit phone number.' }
    //
    for (let i = 0; i < this.phoneInput.length; i++) {
      let myDigit = this.phoneInput.substr(i, 1)
      if (!this.digits.includes(myDigit)) {
        this.msg1 = 'please enter a four-digit phone number.'
      }// end if
    }// end for
    this.logFun('phone input' + this.phoneInput.toString())
    if (this.lastNameInput.length < 1) { this.msg1 = 'Please enter your last name.' }
    if (this.firstNameInput.length < 1) { this.msg1 = 'Please enter your first name.' }
    if (this.surveyIcode > ''
      && this.icode != this.surveyIcode
      && this.cust + this.qid != '21') { // qnc demo is 2,1. 
      // alert('icode='+ this.icode)
      // alert('surveyIcode='+ this.surveyIcode)
      // billyy? old icode here? 

      this.msg1 = 'Your email invitation link is invalid or expired.'
        + ' To start this Qna, please follow the link from your email.'
    }
    if (this.msg1.length == 0) {
      this.msg1 = 'ok'
      this.qUserId =
        this.firstNameInput.trim()
        + this.lastNameInput.trim()
        + this.phoneInput.trim()
      this.fldsCustQidUser = {
        "cust": this.cust,
        "qid": this.qid,
        "qUserId": this.qUserId
      }//end set fldsCustQidUser

      this.showSignHtml = false
    }//end if

  }// end validateSignOnFields

  firstNameChg(firstNameParmIn: any) {
    this.logFun('running firstNameChg')
    this.logFun(firstNameParmIn)
    this.firstNameInput =
      firstNameParmIn.charAt(0).toUpperCase() + firstNameParmIn.slice(1)
    this.logFun(this.firstNameInput)
  }// end firstNameChg
  lastNameChg(lastNameParmIn: any) {
    this.lastNameInput =
      lastNameParmIn.charAt(0).toUpperCase() + lastNameParmIn.slice(1)
  } // end lastNameChg
  setScrDiagOnOff() {
    this.logFun('running setScrDiagOnOff ')
    // as of Spring 2021, control diagnostics with ctrl+alt+shift
    if (this.showDiagHtml == true) {
      this.showDiagHtml = false
      this.msg1 = 'diagnostics turned off.'
    } else {
      this.showDiagHtml = true
      this.msg1 = 'diagnostics turned on.'
    } // end if
  } // end setScrDiagOnOff
  phoneChg(phoneParmIn: any) { this.phoneInput = phoneParmIn }

  async checkUserAtSignOn() {
    this.logFun('ab running checkUserAtSignOn')
    this.msg1 = "let's look you up, " + this.firstNameInput + ' ...'
    if (this.whichDb == 'fauna') {
      // this.participantArray = await this.launchFaunaReadParticipant()
    }//end if fauna
    if (this.whichDb == 'supabase') {
      // alert('321 gonna read participantArray')
      this.participantArray = await this.launchReadSupabase('qtUsers', this.fldsCustQidUser)
    }//end if supabase 
    if (this.whichDb == 'turso') {
      this.participantArray = await this.launchReadTurso('qtUsers', this.fldsCustQidUser)
    }//end if turso

    if (this.participantArray.length > 0) {
      this.buildUserObjForChg()
      if (this.userObj['status'] != 'done') {
        // Object.assign(this.userObj,{userDateTime: this.dateTimeNow })
        if (this.whichDb == 'fauna') {
          await this.launchFaunaChgParticipant(this.userObj, 'from readParticipant')
        } // end if fauna
        if (this.whichDb == 'supabase') {
          await this.launchChgSupabase('qtUsers', this.userObj)
        } // end if supabase
        if (this.whichDb == 'turso') {
          await this.launchChgTurso('qtUsers', this.userObj)
        }//end if turso

        this.msg1 = 'welcome back, ' + this.firstNameInput + '.'
        this.answerClickedCnt = Number(this.participantArray[0].answerCnt)
      } // end if status not done
    } // end if participantArray len > 0

    if (this.participantArray.length == 0) {
      this.msg1 = 'adding you as a new user...'
      this.buildUserObjForAdd()
      this.participantArray.push(this.userObj)
      if (this.whichDb == 'fauna') {
        this.participantArray = await this.launchFaunaAddParticipant()
      } // end if fauna
      if (this.whichDb == 'supabase') {
        this.participantArray = await this.launchAddSupabase('qtUsers', this.userObj)
      }//end if supabase
      if (this.whichDb == 'turso') {
        let tursoResponse = await this.launchAddTurso('qtUsers', this.userObj)
        this.participantArray[0]['rowid'] = this.lastInsertRowid
      }//end if turso
    } // end if participant len
    this.logFun('319 ab userObj:')
    this.logFun(this.userObj)
    this.logFun('321 participant array:')
    this.logFun(this.participantArray)
    this.logFun('323 ab done with checkUserAtSignOn')
  } // end checkUserAtSignOn

  async saveToLocalStorage() {
    // alert('369 gonna set local storage.')
    localStorage.setItem('qUserId',this.qUserId)
    localStorage.setItem('fName',  this.firstNameInput)
    localStorage.setItem('lName',  this.lastNameInput)
    localStorage.setItem('phone',  this.phoneInput)
    // alert('375 local storage=' + Object.entries(localStorage))
    // alert(this.oldIcode) ?? 
  }//end savetoLocalStorage

  async startSurvey() {
    this.logFun('ac 337 running startSurvey')
    this.msg1 = 'Starting Qna for '
      + this.firstNameInput + ' ' + this.lastNameInput
      + '.'
    this.showSignHtml = false
    if (this.participantArray.length > 0) {
      // if user found, read past answers
      if (this.whichDb == 'fauna') {
        this.answerArray = await this.launchFaunaReadPastAnswers()
      }
      if (this.whichDb == 'supabase') {
        this.logFun('215 looking for past qtAnswers')
        this.logFun('216 fldsCustQidUser:')
        this.logFun(this.fldsCustQidUser)
        this.answerArray = await this.launchReadSupabase('qtAnswers', this.fldsCustQidUser)
      } // end if supabase
      if (this.whichDb == 'turso') {
        this.answerArray = await this.launchReadTurso('qtAnswers', this.fldsCustQidUser)
        this.transformTursoAnswerFldsToArrays()
      }//end if turso
    } // end if participant array len > 0
    this.logFun('ac 353 answerArray:')
    this.pastAnswerCount = this.answerArray.length
    this.answerClickedCnt = this.answerArray.length
    this.logFun(this.answerArray)
    if (this.whichDb == 'fauna') {
      this.groupArray = await this.launchFaunaReadGroups()
    }
    if (this.whichDb == 'supabase') {
      this.groupArray = await this.launchReadSupabase('qtGroups', this.fldsCustQid)
    }//end if supabase
    if (this.whichDb == 'turso') {
      this.groupArray = await this.launchReadTurso('qtGroups', this.fldsCustQid)
      this.logFun('ac 364 turso groupArray:')
      this.logFun(this.groupArray)
    }//end if turso
    this.setGroups()
    this.sortListOfGroups()
    this.setGroupRound()
    if (this.whichDb == 'fauna') {
      this.allQuestions = await this.launchFaunaReadQuestions()
    }
    if (this.whichDb == 'supabase') {
      this.allQuestions = await this.launchReadSupabase('qtQuestions', this.fldsCustQid)
    }//end if supabase
    if (this.whichDb == 'turso') {
      this.allQuestions = await this.launchReadTurso('qtQuestions', this.fldsCustQid)
      this.transformTursoQuestionFldsToArrays()
    }//end if turso
    this.setQuestions()
    this.buildListOfAccumsFromAllQuestions()
    this.matchAllQuestionsToAlreadyAnsweredQuestions()
    this.setAlreadyCompletedGroups()
    if (this.whichDb == 'fauna') {
      this.rulesArray = await this.launchFaunaReadRules()
    }
    if (this.whichDb == 'supabase') {
      this.logFun('242')
      this.rulesArray = await this.launchReadSupabase('qtRules', this.fldsCustQid)
    }//end if supabase
    if (this.whichDb == 'turso') {
      this.rulesArray = await this.launchReadTurso('qtRules', this.fldsCustQid)
    }// end if turso
    await this.calcPointsSetAccum() // set accumArray from prior answers
    this.logFun('ac 320 done with calcPoints')
    this.findGroupsWithNoRules()
    this.findNextBunchOfActiveQuestions()
    this.sortRoundOfActiveQuestions()
    this.setRoundFirstActiveQuest() // sets html on. participant sees/answers questions.
    this.logFun('ac end of startSurvey')
  }// end startSurvey

  transformTursoQuestionFldsToArrays() {
    // needed cuz turso duznt do arrays.
    this.logFun('ac 401 allQuestions:')
    this.logFun(this.allQuestions)
    for (let i = 0; i < this.allQuestions.length; i++) {
      this.allQuestions[i].aca = this.allQuestions[i].aca.split(",")
      this.allQuestions[i].acaFrame = this.allQuestions[i].acaFrame.split(",")
      this.allQuestions[i].accum = this.allQuestions[i].accum.split(",")
      this.allQuestions[i].acaPointVals = this.allQuestions[i].acaPointVals.split(",")
      for (let j = 0; j < this.allQuestions[i].accum.length; j++) {
        if(this.allQuestions[i].accum[j] == ''){
          this.allQuestions[i].accum[j]='blank'// chg ''  to blank
        }// end if
      }//end inner for  
      }//end for
    this.logFun('ac 409 allQuestions:')
    this.logFun(this.allQuestions)
  }//end transformTursoQuestionFldsToArrays

  transformTursoAnswerFldsToArrays() {
    // needed cuz turso duznt do arrays.
    for (let i = 0; i < this.answerArray.length; i++) {
      this.answerArray[i].accum = this.answerArray[i].accum.split(",")
    }//end for
    this.logFun('ac 423 answerArray:')
    this.logFun(this.answerArray)

  }//end transformTursoAnswerFldsToArrays

  async answerClicked(hisAnsAcaIxFromHtml: any) {
    // called from html, he clicked an answer
    this.logFun('ad 278 running answerClicked ')
    this.answerClickedCnt = this.answerClickedCnt + 1
    this.curAca = [] // block him from answering same question too quickly
    this.curAcaFrame = [] //text above answer choices, like never,sometimes,always
    this.curQuestTxt = '... loading ...'
    this.curPreQuest = ''
    this.calcAnswerTimeGap()
    this.getReadytoAddAnswer(hisAnsAcaIxFromHtml)
    await this.addAnswer(hisAnsAcaIxFromHtml)
    this.msg1 = this.firstNameInput + "'s "
      + 'answer count: ' + this.answerClickedCnt
    // billy is this the right spot for this?
    Object.assign(this.userObj, { status: 'active' })
    Object.assign(this.userObj, { priorQ: this.curQuestNbr })
    Object.assign(this.userObj, { answerCnt: this.answerClickedCnt.toString() })

    this.updateUser()
    this.logFun('ad 313 allQuestions:')
    this.logFun(this.allQuestions)
    this.logFun('ad 315 activeQuestions:')
    this.logFun(this.activeQuestions)
    // add points to accum array. .. but don't do it later.
    await this.calcPointsSetAccum() // oct2024   feb2025 added await.
    this.logFun('ad 320 done with calcPoints')
    let pos = this.allQuestions
      .findIndex((a: any) => a.cust == this.cust && a.qid == this.qid
        && a.questNbr == this.activeQuestions[this.aqx].questNbr)
    if (pos > -1) {
      this.allQuestions[pos].answeredThisSession = 'y' //diagnostics
      this.priorQ = this.allQuestions[pos].questNbr // 
    } // end if pos > -1
    if (this.aqx < this.activeQuestions.length - 1) {
      this.aqx = this.aqx + 1  //increments question we are about to ask.
      this.curQuestTxt = this.activeQuestions[this.aqx].questTxt
      this.curPreQuest = this.activeQuestions[this.aqx].preQuest
      this.curQuestNbr = this.activeQuestions[this.aqx].questNbr
      this.curAca = this.activeQuestions[this.aqx].aca
      this.curAcaFrame = this.activeQuestions[this.aqx].acaFrame
      if (this.curQuestTxt.includes('\n')) {
        this.questHasLinBrk = true
      } else {
        this.questHasLinBrk = false
      } // end if includes \n
    } else { //we are at the end of active questions
      // set next groups and set next bunch of active questions:
      this.logFun('338 we are at the end of active questions')
      this.closeOutActiveAndPrepNextQuestions()
      this.aqx = 0
    }//end if this.aqx
    this.appendToQueryString()
    this.logFun('ad 472 end running answerClicked ')
  }// end answerClicked

  calcAnswerTimeGap() {
    this.answerEndTime = performance.now()
    let tdif = (this.answerEndTime - this.answerStartTime) / 1000
    this.timeGap = Math.round(tdif)
    this.answerStartTime = performance.now()
  }// end calcAnswerTimeGap

  getReadytoAddAnswer(hisAnsAcaIx: any) {
    this.logFun('361 running getReadytoStoreAnswer ')
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
  }// end getReadytoStoreAnswer

  async addAnswer(hisAnsAcaIx: any) {
    this.logFun('322 running addAnswer ')
    this.buildAnswerObjForAdd()
    if (this.whichDb == 'fauna') {
      this.launchFaunaAddAnswer(this.answerObj)
    }//end if fauna
    if (this.whichDb == 'supabase') {
      let oneAns: any = await this.launchAddSupabase('qtAnswers', this.answerObj)
      Object.assign(this.answerObj, { id: oneAns[0].id })
      this.answerArray.push(this.answerObj)
    }//end if supabase
    if (this.whichDb == 'turso') {
      await this.launchAddTurso('qtAnswers', this.answerObj)
      Object.assign(this.answerObj, { rowid: this.lastInsertRowid })
      this.answerArray.push(this.answerObj)
    }//end if turso
    this.logFun('513 answerArray:')
    this.logFun(this.answerArray)
    this.logFun('515 end addAnswer ')
  }// end addAnswer

  updateUser() {
    // update participant db every 5 answers
    if (this.answerClickedCnt / 5 == Math.round(this.answerClickedCnt / 5)) {
      // this.logFun(this.userObj)
      if (this.whichDb == 'fauna') {
        this.launchFaunaChgParticipant(this.userObj, 'from writeAnswer')
      }//end if fauna
      if (this.whichDb == 'supabase') {
        Object.assign(this.userObj, { id: this.participantArray[0].id })
        this.launchChgSupabase('qtUsers', this.userObj)
      }//end if supabase
      if (this.whichDb == 'turso') {
        Object.assign(this.userObj, { rowid: this.participantArray[0].rowid })
        this.launchChgTurso('qtUsers', this.userObj)
      }//end if turso
    } // end if ans / 5
    this.logFun('end of updateUser. 535 participantArray:')
    this.logFun(this.participantArray)
  }//end updateUser

  async calcPointsSetAccum() {
    this.logFun('435 running calcPointsSetAccum ')
    // read answerArray, set accumArray.
    // look at answers not-yet-added to accumArray
    // normally, this is run for an answer recently given,
    // but might be for answers from a prior session (participant returner)
    // exit this paragrf with nice values in accumArray.
    // for each answer he gave:
    // add ansPoints to one or more accumulators,
    // depending on which accumulators were tied to the question.
    // look at answerArray.addPointsStatus = 'pending'
    //                     (points not yet added))
    // this.logFun('392 app answerArray:')
    // this.logFun(this.answerArray)
    for (let i = 0; i < this.answerArray.length; i++) {
      this.logFun('414 add point status:')
      this.logFun(this.answerArray[i].addPointsStatus)
      this.logFun('414 this.answerArray[i]')
      this.logFun(this.answerArray[i])
      if (this.answerArray[i].addPointsStatus == 'pending') {
        // answer points not added to accumArray yet
        for (let j = 0; j < this.answerArray[i].accum.length; j++) {
          this.logFun('402 looping thru answerArray accums')
          this.logFun('403 gonna findAccumAndAddPoints for'
            + this.answerArray[i].accum[j])
          this.logFun('432 answerPoints: ')
          this.logFun(this.answerArray[i].answerPoints)
          await this.findAccumAndAddPoints(this.answerArray[i].accum[j],
            this.answerArray[i].answerPoints,
            this.answerArray[i].timeGap)
        } // end for j
        this.answerArray[i].addPointsStatus = 'done'
      } // end if answerArray[i].addPointsStatus == pending
    } // end for i
    this.logFun('572 this.accumArray:')
    this.logFun(this.accumArray)
    this.logFun('575 end calcPointsSetAccum')
  }//end calcPointsSetAccum

  async findAccumAndAddPoints(
    accumParmIn: any, ansPointsParmIn: any, ansTimeGapParmIn: any) {
    ansPointsParmIn = Number(ansPointsParmIn) //Feb2025
    this.logFun('440 running findAccumAndAddPoints. accum: ' + accumParmIn)
    this.logFun(ansPointsParmIn)
    // called for one accum (from answerArray). update accumArray.
    // find matching accumArray row.
    let pos = 0
    if (accumParmIn !== undefined) {
      pos = this.accumArray
        .findIndex((a: any) => a.accum.toLowerCase() == accumParmIn.toLowerCase())
    } //end if
    if (pos >= 0) {
      this.logFun('428 pos: ' + pos)
      this.logFun('429 accum: ' + accumParmIn)
      this.logFun('430 adding to accum: ' + ansPointsParmIn)
      this.accumArray[pos].accumNeedsDbScoreUpsert = 'y' //adding to accum score.
      this.accumArray[pos].accumScore += ansPointsParmIn
      this.accumArray[pos].accumQuestCnt += 1
      this.logFun('598 accumScore:')
      this.logFun(this.accumArray[pos].accumScore)
      this.accumArray[pos].accumTimeGap += ansTimeGapParmIn
      if (this.accumArray[pos].accumQuestCnt == this.accumArray[pos].accumQuestCntTot) {
        this.logFun('455 he answered last question for this accum:'
          + this.accumArray[pos].accum)
        this.compareRulesScoresGroups(pos) // Oct2024 kill this now?
        this.accumArray[pos].accumNeedsDbScoreUpsert = 'y' //billy?
        await this.readOneScoreChgOrAddOneScore(pos)
        this.logFun('466 returned from readOneScoreChgOrAddOneScore')
        // read/write score is now running on its own thread.
      } // end if
    } // end if
    this.logFun('614 accumArray:')
    this.logFun(this.accumArray)
    this.logFun('end findAccumAndAddPoints')
  } // end findAccumAndAddPoints

  async readOneScoreChgOrAddOneScore(i: number) {
    this.logFun('bb529 running readOneScoreChgOrAddOneScore')
    let myScoreObj = this.buildScoreObj(i)
    if (this.whichDb == 'fauna') {
      this.scoresArray = await this.launchFaunaReadScore(myScoreObj)
    } // end if
    if (this.whichDb == 'supabase') {
      this.scoresArray = await this.launchReadSupabase('qtScores', this.fldsCustQidUserAccum)
    }// end if supabase
    if (this.whichDb == 'turso') {
      this.scoresArray = await this.launchReadTurso('qtScores', this.fldsCustQidUserAccum)
    }// end if turso
    if (this.scoresArray.length > 0) { //score rec found
      this.logFun('604 score rec found.')
      if (this.scoresArray[0]['score'] != this.accumArray[i].accumScore) {
        // user answered that resulted in a change to the score.
        // lets chg a score rec on the db.
        if (this.whichDb == 'fauna') {
          await this.launchFaunaChgScore(myScoreObj)
        }
        if (this.whichDb == 'supabase') {
          Object.assign(myScoreObj, { id: this.scoresArray[0].id })
          await this.launchChgSupabase('qtScores', myScoreObj)
        } // end if supabase
        if (this.whichDb == 'turso') {
          // alert('613 chg turso. set rowid first. from where?')
          Object.assign(myScoreObj, { rowid: this.scoresArray[0].rowid })
          // alert('rats, gotta set scoresArray rowid in earlier read')
          this.logFun('651 scoresArray:')
          this.logFun(this.scoresArray)
          await this.launchChgTurso('qtScores', myScoreObj)
        }//end if turso
        this.accumArray[i].accumNeedsDbScoreUpsert = 'n'  //wrote a score rec
        let sdx = this.scoreDiagArray
          .findIndex((sda: any) => sda.accum == this.accumArray[i].accum)
        this.scoreDiagArray.splice(sdx, 1, myScoreObj)
      } // end if score not eq accum
    } else { // score rec not found. lets add a score rec to the db.
      this.logFun('620 score rec not found')
      if (this.whichDb == 'fauna') {
        await this.launchFaunaAddScore(myScoreObj)
      }
      if (this.whichDb == 'supabase') {
        await this.launchAddSupabase('qtScores', myScoreObj)
      }//end if supabase
      if (this.whichDb == 'turso') {
        this.logFun('628 add turso qtScores')
        this.logFun(myScoreObj)
        await this.launchAddTurso('qtScores', myScoreObj)
        Object.assign(myScoreObj, { rowid: this.lastInsertRowid })
        this.scoresArray.push(myScoreObj)
        this.logFun('scoresArray:')
        this.logFun(this.scoresArray)
      }//end if turso
      this.accumArray[i].accumNeedsDbScoreUpsert = 'n' //wrote a score rec
      this.scoreDiagArray.push(myScoreObj)
    } // end if scoresArray len  0
  }//end readOneScoreChgOrAddOneScore

  compareRulesScoresGroups(accumIxParmIn: any) {
    this.logFun('676 running compareRulesScoresGroups ')
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
      //
      for (let gax = 0; gax < this.groupArray.length; gax++) {

      }
      //

      if (this.rulesArray[rax].accum == this.accumArray[sax].accum) {
        let gax = -1
        gax = this.groupArray
          .findIndex((g: any) => g.groupName.toLowerCase() == this.rulesArray[rax].subset.toLowerCase())
        if (gax > -1) {
          this.logFun('group row and rules array row to compare:')
          this.logFun(this.groupArray[gax])
          this.logFun(this.rulesArray[rax])
          this.checkThresh(rax, gax, sax)
        } // end if
      }  // end if
    } // end for rax
    this.logFun('710 groupArray:')
    this.logFun(this.groupArray)
    this.logFun('712 end compareRulesScoresGroups.')
  } //end compareRulesScoresGroups

  buildScoreObj(i: number) {
    this.logFun('bb576 running buildScoreObj for accum: '
      + this.accumArray[i].accum)
    this.scoreDateTime = this.formatNow()
    let myTrueFalse = Number.isNaN(this.accumArray[i].accumScore)
    if (myTrueFalse == true) { this.accumArray[i].accumScore = 666 }
    let scoreObj = {
      'cust': this.cust,
      'qid': this.qid,
      'qUserId': this.qUserId,
      'testDate': this.scoreDateTime, //this.todaysDate,
      'accum': this.accumArray[i].accum,
      'score': this.accumArray[i].accumScore,
      'wscore': this.accumArray[i].accumScore,
      'questCnt': this.accumArray[i].accumQuestCnt,
      'timeGap': this.accumArray[i].accumTimeGap,
    }//end set scoreObj
    this.fldsCustQidUserAccum = {
      "cust": scoreObj.cust,
      "qid": scoreObj.qid,
      "qUserId": scoreObj.qUserId,
      "accum": scoreObj.accum
    }// end set fldsCustQidUserAccum
    return scoreObj
  }//end buildScoreObj

  checkThresh(rax: any, gax: any, sax: any) {
    this.logFun('1085 running checkThresh... ')
    this.logFun('667  app  rules,accum,group ')
    this.logFun(this.rulesArray[rax])
    this.logFun(this.accumArray[sax])
    this.logFun(this.groupArray[gax])
    this.logFun('754 qnaRound: ' + this.qnaRound.toString())
    let threshNumeric = 0
    if (!isNaN(this.rulesArray[rax].thresh)) {
      threshNumeric = Number(this.rulesArray[rax].thresh);
    }//end if

    let accumscoreNumeric = 0
    if (!isNaN(this.accumArray[sax].accumScore)) {
      accumscoreNumeric = Number(this.accumArray[sax].accumScore);
    }//end if

    // let accumscoreNumeric = Number(this.accumArray[sax].accumScore);
    // if (threshNumeric == NaN){threshNumeric = 0}
    // if (accumscoreNumeric == NaN){accumscoreNumeric = 0}
    // this.logFun(threshNumeric) 
    // this.logFun(accumscoreNumeric)

    // we are current on a rule,   group,  & scoreboard.
    // check if a rule threshold is hit for this group.
    // rax: rules array index (was set before we got here)
    // gax: group array index (was set before we got here)
    // sax: accum array index (was set before we got here)

    if ((this.rulesArray[rax].oper == '>='
      || this.rulesArray[rax].oper == 'greater than or equal to')
      && accumscoreNumeric >= threshNumeric) {
      this.groupArray[gax].threshHit = 'y'
    } // end if oper >=

    if ((this.rulesArray[rax].oper == '<='
      || this.rulesArray[rax].oper == 'less than or equal to')
      && accumscoreNumeric <= threshNumeric) {
      this.groupArray[gax].threshHit = 'y'
    } // end if oper <=

    if ((this.rulesArray[rax].oper == '!='
      || this.rulesArray[rax].oper == 'not equal to')
      && accumscoreNumeric != threshNumeric) {
      this.groupArray[gax].threshHit = 'y'
    } // end if oper !=

    if ((this.rulesArray[rax].oper == '=='
      || this.rulesArray[rax].oper == 'equal to')
      && accumscoreNumeric == threshNumeric) {
      this.logFun('796 threshHit eq for rules array:')
      this.logFun(this.rulesArray)
      this.groupArray[gax].threshHit = 'y'
    } // end if oper ==

    if ((this.rulesArray[rax].oper == '='
      || this.rulesArray[rax].oper == 'equal to')
      && accumscoreNumeric == threshNumeric) {
      this.groupArray[gax].threshHit = 'y'
    } // end if oper =

    if (this.rulesArray[rax].oper == '<'
      || this.rulesArray[rax].oper == 'less than') {
      if (accumscoreNumeric < threshNumeric) {
        this.groupArray[gax].threshHit = 'y'
      } // end inner if 
    } // end outer if

    if ((this.rulesArray[rax].oper == '>'
      || this.rulesArray[rax].oper == 'greater than')
      && accumscoreNumeric > threshNumeric) {
      this.groupArray[gax].threshHit = 'y'
    } // end if oper >

    this.logFun('822 this.groupArray[gax].threshHit:')
    this.logFun(this.groupArray[gax].threshHit)
    this.logFun(this.groupArray[gax].groupName)
  } // end checkThresh

  ctrlShiftAltWasHit() {
    this.logFun('running ctrlShiftAltWasHit ')
    // toggle diagnostic button on off
    if (this.showDiagButHtml) {
      this.showDiagButHtml = false  // ctrl shift alt
    } else {
      this.showDiagButHtml = true  // ctrl shift alt
    }
  } // end ctrlShiftAltWasHit

  enterKeyWasHit() {
    // he hit enter instead of go button. same thing.
    this.logFun('running enterKeyWasHit')
    if (this.showSignHtml) {
      this.doSign()
    } // end if
  } // end enterKeyWasHit

  buildAnswerObjForAdd() {
    this.logFun('350 running buildAnswerObjForAdd')
    // let myAccum = this.activeQuestions[this.aqx].accum
    this.logFun('493 active questions accum: ')
    this.logFun(Array.isArray(this.activeQuestions[this.aqx].accum)) // true
    this.logFun(this.activeQuestions[this.aqx].accum)

    let myAccumArray = [] // Jul 2023 now accum is an array.
    if (this.activeQuestions[this.aqx].accum != undefined) {
      for (let i = 0; i < this.activeQuestions[this.aqx].accum.length; i++) {
        myAccumArray.push(this.activeQuestions[this.aqx].accum[i])
      }  // end for
    } // end if
    this.answerDateTime = this.formatNow()
    this.answerObj =
    {
      "cust": this.cust,
      "qid": this.activeQuestions[this.aqx].qid,
      "questNbr": this.activeQuestions[this.aqx].questNbr,
      "answerDate": this.answerDateTime, //this.todaysDate,
      "qUserId": this.qUserId,
      "answer": this.hisAns,
      "answerPoints": this.hisAnsPoints,
      "timeGap": this.timeGap,
      "accum": myAccumArray, // June 2023 accum is now an array.
      'addPointsStatus': 'pending',
      'questTxt': this.activeQuestions[this.aqx].questTxt.substring(0, 40)
       .replaceAll("'","") // Apr 2025 kill single quotes
       .replaceAll(",","") // Apr 2025 kill commas
    } // end answerObj
    // "accum" : this.activeQuestions[this.aqx].accum,

    // when building an answer rec, we copy-in the accum array 
    // from the question to help later with scoring.
    // we are NOT adding to answers.accum here,
    // we use answers.addPointsStatus later, to add to accumArray
    // to keep track of whether the answer points have been added yet.
    // we store answers to the database as we go.
  } // end buildAnswerObjForAdd

  async launchReadSupabase(tbl: any, flds: object) {
    this.logFun('354 running launchReadSupabase')
    this.logFun('tbl:')
    this.logFun(tbl)
    this.logFun('640 flds:')
    this.logFun(flds)
    let supaRes = await apiSupabase.readSupabase(tbl, flds)
    this.supaArray = supaRes.supabaseData
    if (this.supaArray === null) { this.supaArray = [] }
    this.logFun('1445 supaArray from launchReadSupabase:')
    this.logFun(this.supaArray)
    return this.supaArray
  } // end launchReadSupabase

  async launchChgSupabase(tbl: any, flds: object) {
    this.logFun('354 running launchChgSupabase')
    let supaRes = await apiSupabase.chgSupabase(tbl, flds)
    this.supaArray = supaRes.supabaseData
    if (this.supaArray === null) { this.supaArray = [] }
    return this.supaArray
  } // end launchChgSupabase

  async launchAddSupabase(tbl: any, flds: object) {
    this.logFun('aa354 running launchAddSupabase')
    this.logFun('tbl:')
    this.logFun(tbl)
    this.logFun('665 flds:')
    this.logFun(flds)

    let supaRes = await apiSupabase.addSupabase(tbl, flds)
    this.supaArray = supaRes.supabaseData
    if (this.supaArray === null) { this.supaArray = [] }
    this.logFun('1455 supaArray from launchAddSupabase:')
    this.logFun(this.supaArray)
    if (this.supaArray.length > 0) {
      if (tbl == 'qtAnswers') {
        this.answerArrayStoredToDb.push(flds)
      } // end if qtanswers
    } // end if supaArray len
    return this.supaArray
  } // end launchAddSupabase

  async launchReadTurso(tbl: any, flds: object) {
    this.logFun('889 app running launchReadTurso')
    let tursoDataArray: any = []
    let tursoResponse: any = await apiTurso.readTurso(tbl, flds)
    this.logFun(tursoResponse)
    if (Array.isArray(tursoResponse)) {
      for (let i = 0; i < tursoResponse.length; i++) {
        tursoDataArray.push(tursoResponse[i])
      }//end for
    }// end if
    let xxx = tursoDataArray.slice()
    return xxx
  }//end launchReadTurso

  async launchChgTurso(tbl: any, flds: object) {
    this.logFun('905 running launchChgTurso')
    let tursoDataArray: any = []
    let tursoResponse: any = await apiTurso.chgTurso(tbl, flds)
    this.logFun(tursoResponse)
  }//end launchChgTurso

  async launchAddTurso(tbl: any, flds: object) {
    let tursoResponse = await apiTurso.addTurso(tbl, flds)
    for (let [pairNm, pairVal] of Object.entries(tursoResponse)) {
      if (pairNm == 'lastInsertRowid') {
        this.lastInsertRowid = pairVal
      }// end if
    }// end for
    this.logFun('956 launchAddTurso tursoResponse:')
    this.logFun(tursoResponse)
    if (tbl == 'qtAnswers') {
      this.answerArrayStoredToDb.push(flds)
    } // end if qtanswers
    return tursoResponse
  }//end launchAddTurso

  async launchFaunaReadParticipant() {
    this.logFun('aa1141 running launchFaunaReadParticipant')
    this.msg1 = 'reading participant...'
    // let faunaDataArray =  []
    // this.logFun(this.cust)
    // this.logFun(this.qid)
    // this.logFun(this.qUserId)
    let rawFauna = await apiFauna.qtReadUser(this.cust, this.qid, this.qUserId)
      .catch(() => {  // apiFauna.qtReadUser returned an error 
        this.msg1 = 'error reading user.'
        this.logFun('apiFauna.qtReadUser error. cust qid qUserId:')
        this.logFun(this.cust + this.qid + this.qUserId)
      })
    this.logFun(' read participant rawFauna:')
    this.logFun(rawFauna)
    this.logFun('1208 read participant rawFauna is Array true/false:')
    this.logFun(Array.isArray(rawFauna)) // true
    let faunaDataArray = []
    for (let i = 0; i < rawFauna.length; i++) {
      this.logFun('521 pushing into faunaDataArray')
      faunaDataArray.push(rawFauna[i].data)
    } // end for
    this.logFun('525 ready to return faunaDataArray')
    this.logFun(faunaDataArray)
    return faunaDataArray // Oct2024 return with val duznt work ??
  }//end launchFaunaReadParticipant
  async launchFaunaAddParticipant() {
    this.logFun('1165 running launchFaunaAddParticipant ')
    let rawFauna = await apiFauna.qtAddParticipant(this.userObj)
      .catch(() => {  // api returned an error 
        this.msg1 = 'error adding participant.'
        this.logFun('1165 apiFauna.qtAddParticipant error. userObj:')
        this.logFun(this.userObj)
      }) //end catch
    this.logFun('fauna add participant rawFauna:')
    this.logFun(rawFauna)
    this.logFun('qtAddParticipant rawFauna is Array true/false:')
    this.logFun(Array.isArray(rawFauna)) // false  
    let myNewArray = []
    myNewArray.push(rawFauna)
    return myNewArray // result is one participant stuffed into an array.
  } // end launchFaunaAddParticipant
  async launchFaunaChgParticipant(userObjParmIn: any, fromWhere: any) {
    this.logFun('594 running launchFaunaChgParticipant')
    this.logFun(userObjParmIn)
    //this.msg1 = 'updating participant...'
    this.faunaData = await apiFauna.qtUpdateParticipant(userObjParmIn)
      .catch(() => {
        this.msg1 = 'error updating participant.'
        this.logFun('601 launchFaunaChgParticipant error. userObjParmIn:')
        this.logFun(userObjParmIn)
      })
    this.logFun('fauna chg participant faunaData:')
    this.logFun(this.faunaData)
    this.logFun('qtUpdateParticipant faunaData is Array true/false:')
    this.logFun(Array.isArray(this.faunaData)) // false
  } // end launchFaunaChgParticipant
  async launchFaunaChgScore(scoreObjParmIn: any) {
    this.logFun('bb588 running launchFaunaChgScore ')
    this.msg1 = 'updating score...'
    // this.logFun('bb588 scoreObjParmIn: =====')
    // this.logFun(scoreObjParmIn)
    let faunaRtnObj = await apiFauna.qtUpdateScore(scoreObjParmIn)
      .catch(() => {
        this.msg1 = 'error updating score.'
        this.logFun('qtUpdateScore error. ')
        this.logFun(faunaRtnObj)
      }) // end catch
    this.logFun('faunaRtnObj')
    this.logFun(faunaRtnObj)

    return faunaRtnObj
  }  // end launchFaunaChgScore  
  async launchFaunaReadQuestions() {
    this.logFun('pp846 running launchFaunaReadQuestions')
    this.msg1 = 'reading questions...'
    let rawFauna = await apiFauna.qtReadQuestions(this.cust, this.qid)
      .catch(() => {  // apiFauna.qtReadQuestions returned an error 
        this.msg1 = 'error reading questions.'
        this.logFun('apiFauna.qtReadQuestions error. cust and qid:')
        this.logFun(this.cust + this.qid)
      })
    this.logFun('1317 qtReadQuestions rawFauna:')
    this.logFun(rawFauna)
    this.logFun('qtReadQuestions rawFauna is array true/false:')
    this.logFun(Array.isArray(rawFauna)) // true
    let faunaDataArray = []
    for (let i = 0; i < rawFauna.length; i++) {
      faunaDataArray.push(rawFauna[i].data)
    } // end for
    this.logFun(faunaDataArray)
    return faunaDataArray
  } // end launchFaunaReadQuestions
  async launchFaunaReadScore(scoreObjParmIn: any) {
    this.logFun('bb636 running launchFaunaReadScore')
    let rawFauna =
      await apiFauna.qtReadScore(this.cust, this.qid, this.qUserId, scoreObjParmIn['accum'])
        .catch(() => {  // apiFauna.qtReadScore returned an error 
          this.logFun('apiFauna.qtReadScore error.')
          this.logFun('cust & qid: & user & scoreboardName:')
          this.logFun(this.cust + this.qid + this.qUserId + scoreObjParmIn['accum'])
        }) // end 
    this.logFun('rawFauna:')
    this.logFun(rawFauna)
    this.logFun('1358  qtReadScore array test true/false')
    this.logFun(Array.isArray(rawFauna)) // true
    let faunaDataArray = []
    for (let i = 0; i < rawFauna.length; i++) {
      faunaDataArray.push(rawFauna[i].data)
    } // end for
    this.logFun('bb578 bottom of launchFaunaReadScore')
    return faunaDataArray
  } // end launchFaunaReadScore
  async launchFaunaReadRules() {
    this.logFun('pp986 running launchFaunaReadRules ')
    this.msg1 = 'reading rules...'
    let rawFauna = await apiFauna.qtReadRules(this.cust, this.qid)
      .catch(() => {  // apiFauna.qtReadRules returned an error 
        this.msg1 = 'error reading rules.'
        this.logFun('apiFauna.qtReadRules error. cust and qid:')
        this.logFun(this.cust + this.qid)
      })
    this.logFun('rawFauna:')
    this.logFun(rawFauna)
    this.logFun('qtReadRules rawFauna is an array true/false:') //  
    this.logFun(Array.isArray(rawFauna)) // true
    let faunaDataArray = []
    for (let i = 0; i < rawFauna.length; i++) {
      faunaDataArray.push(rawFauna[i].data)
    } // end for
    this.logFun('1319 fauna rules array:')
    this.logFun(faunaDataArray)
    this.logFun(' done with launchFaunaReadRules')
    return faunaDataArray
  } // end launchFaunaReadRules
  async launchFaunaAddAnswer(answerObjParm: any) {
    this.logFun('aa354 running launchFaunaAddAnswer')
    // writing to the db is helpful for later admin retrieval,
    // but for now, only the answerArray is useful.
    this.msg1 = 'saving answer...'
    this.faunaData = await apiFauna.qtWriteAnswer(answerObjParm)
      .catch(() => {
        this.msg1 = 'error writing answer.'
        this.logFun('aa354 qtWriteAnswer error. answerObj:')
        this.logFun(answerObjParm)
      }) // end catch
    this.answerArrayStoredToDb.push(answerObjParm)
  } // end launchFaunaAddAnswer
  async launchFaunaAddScore(scoreObjParmIn: any) {
    this.logFun('bb573 running launchFaunaAddScore ')
    // this.logFun(scoreObjParmIn.accum)
    // this.logFun(scoreObjParmIn.score)
    //this.msg1 = 'writing score...'
    // write to db table qtScores
    let faunaRtnObj = await apiFauna.qtWriteScore(scoreObjParmIn)
      .catch(() => {
        this.msg1 = 'error writing score.'
        this.logFun('bb573 qtWriteScore error. scoreObjParmIn:')
        this.logFun(scoreObjParmIn)
      })
    this.logFun('faunaRtnObj')
    this.logFun(faunaRtnObj)
    return faunaRtnObj
  }//end launchFaunaAddScore

  buildUserObjForChg() {
    this.logFun('202 running buildUserObjForChg')
    this.userObj =
    {
      "cust": this.cust,
      "qid": this.qid,
      "qUserId": this.qUserId,
      "firstName": this.firstNameInput,
      "lastName": this.lastNameInput,
      "phone": this.phoneInput,
      "userDateTime": this.signonDateTime,
      "localUserDateTime": this.signonDateTime,
      "status": this.participantArray[0].status,
      "priorQ": this.participantArray[0].priorQ,
      "answerCnt": this.participantArray[0].answerCnt,
      "icode": this.participantArray[0].icode,
      "promo": this.participantArray[0].promo,
      "id": this.participantArray[0].id
    } // end obj

    if (this.whichDb == 'turso') {
      Object.assign(this.userObj, { rowid: this.participantArray[0].rowid })
    }// end if turso

    this.logFun('247 answer cnt:')
    this.logFun(this.userObj['answerCnt'])
  }//end buildUserObjForChg

  buildUserObjForAdd() {
    this.logFun('running buildUserObjForAdd')
    this.userObj =
    {
      "cust": this.cust,
      "qid": this.qid,
      "qUserId": this.qUserId,
      "firstName": this.firstNameInput,
      "lastName": this.lastNameInput,
      "phone": this.phoneInput,
      "userDateTime": this.signonDateTime,
      "localUserDateTime": this.signonDateTime,
      "status": "active",
      "priorQ": this.priorQ,
      "answerCnt": "0",
      "icode": this.surveyIcode,
      "promo": this.promo,
      "oldicode": this.icode
    }
  } // end buildUserObjForAdd

  async launchFaunaReadSurvey() {
    this.logFun('1149 running launchFaunaReadSurvey ')
    let faunaDataArray = []
    let rawFauna = await apiFauna.qtReadSurvey(this.cust, this.qid)
      .catch(() => {  // api returned an error 
        this.msg1 = 'error reading survey.'
        this.logFun('1165 apiFauna.readSurvey error.' + this.cust + this.qid)
      })
    for (let i = 0; i < rawFauna.length; i++) {
      faunaDataArray.push(rawFauna[i].data)
    } // end for
    this.logFun('fauna read survey fauna array:')
    this.logFun(faunaDataArray)
    this.logFun('1196 read survey faunaDataArray is Array true/false:')
    this.logFun(Array.isArray(faunaDataArray)) // true
    // this results in one entry in an array.
    return faunaDataArray
  } // end readFaunaSurvey
  async launchFaunaReadPastAnswers() {
    this.logFun('pp387 running launchFaunaReadPastAnswers ')
    this.msg1 = 'reading past answers...'
    let myDateTime = this.userObj['userDateTime'] //Oct2024 need this in parm?
    let rawFauna = await apiFauna.qtReadAnswers(this.cust, this.qid, this.qUserId, myDateTime)
      .catch(() => {  // apiFauna.qtReadAnswers returned an error 
        this.msg1 = 'error reading past answers.'
        this.logFun('apiFauna.qtReadAnswers error. cust & qid & user ')
        this.logFun(this.cust + ' ' + this.qid + ' ' + this.qUserId)
      })
    this.logFun('1273  read past answers rawFauna:')
    this.logFun(rawFauna)
    this.logFun('qtReadAnswers rawFauna is Array true/false:')
    this.logFun(Array.isArray(rawFauna)) // true
    let faunaDataArray = []
    for (let i = 0; i < rawFauna.length; i++) {
      faunaDataArray.push(rawFauna[i].data)
    } // end for
    return faunaDataArray
  }// end launchFaunaReadPastAnswers
  async launchFaunaReadGroups() {
    this.logFun('pp918 running launchFaunaReadGroups ')
    this.msg1 = 'reading question groups...'
    let rawFauna = await apiFauna.qtReadGroups(this.cust, this.qid)
      .catch(() => {  // apiFauna.qtReadGroups returned an error 
        this.msg1 = '1122 error reading groups.'
        this.logFun('apiFauna.qtReadGroups error.')
        this.logFun('cust & qid: ' + this.cust + this.qid)
      })
    this.logFun('1147 read group rawFauna:')
    this.logFun(rawFauna)
    this.logFun('qtReadGroups rawFauna is array true/false:')
    this.logFun(Array.isArray(rawFauna)) // true
    let faunaDataArray = []
    for (let i = 0; i < rawFauna.length; i++) {
      faunaDataArray.push(rawFauna[i].data)
    } // end for
    return faunaDataArray
  }// end launchFaunaReadGroups

  setGroups() {
    this.logFun('running setGroups')
    for (let j = 0; j < this.groupArray.length; j++) {
      this.groupArray[j]["statusQnA"] = 'pending'
      this.groupArray[j]["threshHit"] = 'n'
      // this.groupArray[j][ "groupName" ] = this.groupArray[j][ "groupName" ].toLowerCase()        
      // this.groupArray[j][ "subset" ] = this.groupArray[j][ "subset" ] //.toLowerCase()        
    } // end for loop j
    this.logFun('ac 1032 groupArray:')
    this.logFun(this.groupArray)
    this.logFun('end of setGroups')
  }// end setGroups
  sortListOfGroups() {
    this.logFun('ac 1247 running sortListOfGroups ')
    function compareSeq(a: any, b: any) {
      let comparison = 0;
      if (Number(a.seq) && Number(b.seq)) {
        // a and b are both numbers
        if (Number(a.seq) > Number(b.seq)) { comparison = 1 }
        if (Number(a.seq) < Number(b.seq)) { comparison = -1 }
      } else {
        // a or b is alpha
        if (a.seq > b.seq) { comparison = 1 }
        if (a.seq < b.seq) { comparison = -1 }
      } // end if/else
      //   if (Number(a.seq) > Number(b.seq)){ comparison=1 } 
      //   else { if (Number(a.seq) <  Number(b.seq)){ comparison=-1}
      // } 
      //===
      //     if (a.seq.toString().padStart(4,'0') 
      //     > b.seq.toString().padStart(4,'0')){
      //    comparison = 1;
      //  } else if (a.seq.toString().padStart(4,'0') 
      //            < b.seq.toString().padStart(4,'0')){
      //    comparison = -1;
      //  }
      //===
      return comparison;
    } // end function compareSeq

    this.groupArray.sort(compareSeq)
    this.logFun('ac 1275 sorted groupArray:')
    this.logFun(this.groupArray)
  } // end sortListOfGroups
  setGroupRound() {
    // use groupArray.seq as a guide to set GroupRound to a sequential nbr.
    // like seq 0010 0015 0030  set GroupGroupArray.GroupRound to 1 2 3
    let groupRoundWork = 0
    for (let i = 0; i < this.groupArray.length; i++) {
      if (i > 0) {
        if (this.groupArray[i].seq != this.groupArray[i - 1].seq) {
          groupRoundWork = groupRoundWork + 1
        }//end inner if
      }//end outer if
      this.groupArray[i].groupRound = groupRoundWork
    }//end for
    this.logFun('1312 GroupArray:')
    this.logFun(this.groupArray)
  }//end setGroupRound
  setQuestions() {
    this.logFun('ac 1279 running setQuestions ')
    for (let i = 0; i < this.allQuestions.length; i++) {
      this.allQuestions[i].answeredAlready = 'n'
      this.allQuestions[i].answeredThisSession = 'n'
    } // end for i
    this.logFun('ac 1292 end of setQuestions')
  } // end setQuestions

  buildListOfAccumsFromAllQuestions() {
    this.logFun('ac 1295 running buildListOfAccumsFromAllQuestions ')
    // read all questions array, find the unique accumulators.
    // push a newly discovered accum into accumArray.
    let pos: any = -1
    for (let i: number = 0; i < this.allQuestions.length; i++) {
      // this question has an array of accumulators.
      for (let j: number = 0; j < this.allQuestions[i].accum.length; j++) {
        // find the accum in accumArray. if not found, add it.
        pos = this.accumArray
          .findIndex((a: any) => a.accum.toLowerCase()
            == this.allQuestions[i].accum[j].toLowerCase())
        if (pos >= 0) {  // add to an existing accum
          this.accumArray[pos].accumQuestCntTot += 1
        } else {       // append a new accum 
          this.accumObj = {
            'accum': this.allQuestions[i].accum[j],
            'accumScore': 0,
            'accumQuestCntTot': 1,
            'accumQuestCnt': 0,
            'accumTimeGap': 0,
            'accumScoreRound': 0,
            'accumNeedsDbScoreUpsert': 'n',
          }
          this.accumArray.push(this.accumObj)
        } // end if
      } // end inner for
    } // end outer for
    this.logFun('ac1322 bottom of buildListOfAccumsFromAllQuestions.')
    this.logFun(this.accumArray)
  } // end buildListOfAccumsFromAllQuestions

  setAlreadyCompletedGroups() {
    this.logFun('pp650 running setAlreadyCompletedGroups ')
    this.logFun('658 allQuestion:')
    this.logFun(this.allQuestions)
    this.logFun('662 activeQuestions:')
    this.logFun(this.activeQuestions)
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
        if (this.allQuestions[j].subset.toLowerCase()
          == this.groupArray[i].groupName.toLowerCase()) {
          if (this.allQuestions[j].answeredAlready == 'n') {
            groupHasMoreQuestions = true
            break // break out of j loop
          }
        } // end if
      } // end inner for j loop
      if (!groupHasMoreQuestions) {
        this.groupArray[i].statusQnA = 'done'
        this.logFun(' 681 no more questions for group:')
        this.logFun(this.groupArray[i])
        this.logFun(' 683  group:')
        this.logFun(this.groupArray)
      }
    } // end for
    this.logFun('pp650 bottom of setAlreadyCompletedGroups. ')
  } // end setAlreadyCompletedGroups

  findGroupsWithNoRules() {
    this.logFun('pp1023 running findGroupsWithNoRules ')
    this.logFun('1156 groupArray:')
    this.logFun(this.groupArray)
    this.logFun('1158 rulesArray:')
    this.logFun(this.rulesArray)
    // look for groups that have no rule.
    // for groups with no rule,  set group.threshHit to 'y' 
    // becuz groups without rules are the same as hitting a thresh.
    let rax = 0
    for (let gax = 0; gax < this.groupArray.length; gax++) {
      rax = this.rulesArray
        .findIndex((r: any) => r.subset.toLowerCase() == this.groupArray[gax].groupName.toLowerCase())
      if (rax == -1) {
        // we found no rule for this group.
        this.logFun('1057 no rule for: ' + this.groupArray[gax].groupName.toLowerCase())
        this.groupArray[gax].threshHit = 'y'
      } // end if
    }  // end for
    this.logFun('pp1023 end of findGroupsWithNoRules. groupArray:')
    this.logFun(this.groupArray)
  }//end findGroupsWithNoRules

  matchAllQuestionsToAlreadyAnsweredQuestions() {
    this.logFun('pp626 running matchAllQuestionsToAlreadyAnsweredQuestions ')
    this.logFun('count of past answers: ' + this.answerArray.length)
    this.logFun('pp626 past answers array:')
    this.logFun(this.answerArray)
    // pastAnswers questNbr
    // if ya find a match: set allQuestions.answeredAlready to 'y'
    let j = 0
    for (let i = 0; i < this.answerArray.length; i++) {
      // find question that matches this pastAnswer, by questNbr
      j = this.allQuestions
        .findIndex((q: any) => q.questNbr == this.answerArray[i].questNbr)
      if (j > -1) {  //mark this question as answered already
        this.allQuestions[j].answeredAlready = 'y'
      }
    } // end for
  } // end matchAllQuestionsToAlreadyAnsweredQuestions

  async closeOutActiveAndPrepNextQuestions() {
    this.logFun('qna1168 running closeOutActiveAndPrepNextQuestions')
    this.logFun('1450 this.groupArray before close:')
    this.logFun(this.groupArray)
    this.logFun('1452 qnaRound:' + this.qnaRound.toString())

    for (let i = 0; i < this.groupArray.length; i++) {
      // alert(this.groupArray.groupRound)
      // if (this.groupArray[i].groupRound ==   1 ){alert(1455)}
      if (this.groupArray[i].statusQnA == 'active'
        // &&  this.groupArray[i].seq == this.qnaRound){
        && this.groupArray[i].groupRound <= this.qnaRound) {
        this.groupArray[i]['statusQnA'] = 'done'
        this.logFun('closing out group:')
        this.logFun(this.groupArray[i])
      } // end if
    } // end for  close out groups
    this.logFun('1465 groupArray after close Group:')
    this.logFun(this.groupArray)

    // await this.calcPointsSetAccum() //oct2024 remove this, was adding too much to accums
    //this.compareRulesScoresGroups(this.accumIx)
    this.writeAccumsThatNeedScores()
    this.findNextBunchOfActiveQuestions()
    this.sortRoundOfActiveQuestions()
    this.setRoundFirstActiveQuest()
    if (this.activeQuestions.length == 0) { // no more questions
      this.logFun('qna278 no more questions ')
      if(this.wrapUpPending){this.wrapUp()}
    } // end if
  } // end closeOutActiveAndPrepNextQuestions

  setRoundFirstActiveQuest() {
    this.logFun('qna773 running setRoundFirstActiveQuest ')
    this.msg1 = 'starting a set of questions. '
    this.curQuestTxt = ''
    this.curPreQuest = ''
    this.curAca = []
    this.curAcaFrame = []
    this.logFun('877 activeQuestions:')
    this.logFun(this.activeQuestions)
    if (this.activeQuestions.length > 0) {
      this.showQuestHtml = true // turns on the survey.
      this.showAnswerGroupHtml = true
      this.curQuestTxt = this.activeQuestions[0].questTxt
      this.curPreQuest = this.activeQuestions[0].preQuest
      this.curAca = this.activeQuestions[0].aca
      this.curAcaFrame = this.activeQuestions[0].acaFrame
      if (this.curQuestTxt.includes('\n')) {
        this.questHasLinBrk = true
      } else {
        this.questHasLinBrk = false
      } // end if includes \n    
    } // end if
    if (this.activeQuestions.length == 0) { // the participant is active, but there are no questions.
      if(this.wrapUpPending){this.wrapUp()}
    }
    this.logFun('qna766 bottom of setRoundFirstActiveQuest')
  } // end setRoundFirstActiveQuest

  writeAccumsThatNeedScores() {
    //loop thru all accums, look for
    // needs score db update.
    // upsert a score rec & set score db update to n
    for (let i = 0; i < this.accumArray.length; i++) {
      this.logFun('1450 looking at accumArray ' + i.toString())
      this.logFun(this.accumArray[i])
      if (this.accumArray[i].accumNeedsDbScoreUpsert == 'y') {
        //billy write a score
        this.accumArray[i].accumNeedsDbScoreUpsert = 'n'
      }//end if
    }//end for

  }//end writeAccumsThatNeedScores

  findNextBunchOfActiveQuestions() {
    this.logFun('ac qna686 running findNextBunchOfActiveQuestions ')
    this.logFun('ac 1490 groupArray:')
    this.logFun(this.groupArray)
    this.msg1 = 'building next set of questions...'
    let activeGroups = [] // start fresh
    this.activeQuestions.length = 0  // blank out , start fresh
    let groupRoundMax =
      Math.max.apply(Math, this.groupArray.map(function (g: any) { return Number(g.groupRound) }))
    this.logFun('1550 groupRoundMax:')
    this.logFun(groupRoundMax)
    // what is t loop ?  t loop controls which round we are in.
    // if we have any new questions to ask, we activate questions,
    // and exit t loop.  If no new questions, we INCREMENT qnaRound,
    // and stay in the t loop (the t loop increments t)
    for (let t = this.qnaRound; t <= groupRoundMax; t++) {
      this.logFun('1554 top of t loop. t is: ' + t.toString())
      for (let i = 0; i < this.groupArray.length; i++) {
        if (Number(this.groupArray[i].groupRound) == this.qnaRound
          && this.groupArray[i].threshHit == 'y'
          && this.groupArray[i].statusQnA == 'pending') {
          this.logFun('1507 adding a group to activeGroups:')
          this.logFun(this.groupArray[i].groupName)
          this.groupArray[i].statusQnA = 'active'
          activeGroups.push(this.groupArray[i].groupName.toLowerCase())
        }// end if
      }//end for i
      if (activeGroups.length == 0) {
        // no groups  to activate, try next round
        this.logFun('1523 no active groups')
        this.qnaRound = this.qnaRound + 1
      } else {
        this.logFun('1574  group(s) were activated. qnaRound:')
        this.logFun(this.qnaRound)
        //some group(s) were activated. get out of t loop.
        t = 9999
      }// end if else activegroups empty
    }//end for t
    this.logFun('ac 1524 newly activated groups:')
    this.logFun(activeGroups)
    ////////
    this.logFun('1557 round:')
    this.logFun(this.qnaRound)
    if (activeGroups.length == 0) {
      this.logFun('1560 activeGroups is blank')
      // no groups were actived. let try all rounds,
      // to look for any late-answered questions that hit a rule.
      for (let i = 0; i < this.groupArray.length; i++) {
        if (this.groupArray[i].threshHit == 'y'
          && this.groupArray[i].statusQnA == 'pending') {
          this.logFun('turn on da late group:')
          this.logFun(this.groupArray[i].groupName)
          this.groupArray[i].statusQnA = 'active'
          activeGroups.push(this.groupArray[i].groupName.toLowerCase())
          this.logFun('1534 activeGroups:')
          this.logFun(activeGroups)
        }//end if
      }//end for
    }//end if
    //////////
    for (let i = 0; i < this.allQuestions.length; i++) {
      if (activeGroups.includes(this.allQuestions[i].subset.toLowerCase())) {
        if (this.allQuestions[i].answeredAlready == 'n') {
          this.activeQuestions.push(this.allQuestions[i])
          this.logFun('1583 pushing to activeQuestions:')
          this.logFun(this.allQuestions[i])
        } // end if
      }//end if
    }// end for

    this.logFun('ac 1569 end of findNextBunchOfActiveQuestions. qnaRound:')
    this.logFun(this.qnaRound)
  }//end findNextBunchOfActiveQuestions

  sortRoundOfActiveQuestions() {
    this.logFun('qna753 running sortRoundOfActiveQuestions ')
    function compareSeq(a: any, b: any) {
      let comparison = 0
      if (Number(a.questSeq) && Number(b.questSeq)) {
        // a and b are both numbers
        if (Number(a.questSeq) > Number(b.questSeq)) { comparison = 1 }
        if (Number(a.questSeq) < Number(b.questSeq)) { comparison = -1 }
      } else {
        // a or b is alpha
        if (a.questSeq > b.questSeq) { comparison = 1 }
        if (a.questSeq < b.questSeq) { comparison = -1 }
      } // end if/else
      return comparison
    } // end function compareSeq
    this.activeQuestions.sort(compareSeq)
    this.logFun('1020 activeQuestions:')
    this.logFun(this.activeQuestions)
  }  // end sortRoundOfActiveQuestions

  async wrapUp() {
    this.logFun('ww789 running wrapUp ')
    this.msg1 = 'wrapping up answers and scores...'
    this.wrapUpPending = false
    this.showQuestHtml = false
    this.showAnswerGroupHtml = false
    this.logFun('ww794 final answers in answerArray:')
    this.logFun(this.answerArray)
    this.logFun('ww794 final accums in accumArray:')
    this.logFun(this.accumArray)
    this.logFun('1611 groupArray:')
    this.logFun(this.groupArray)
    this.checkForAnyMissingScores()

    ///=== hack to wait for db updates. wait for 3500 milliseconds.
    this.logFun('ww start timeout wait ')
    this.msg1 = ' Wrapping up answers and scores... '
      + this.answerArray.length.toString() + ' answers. '
      + this.accumArray.filter((a: any) => a.accumScore > 0).length.toString()
      + ' scores.  '
    let promise1 = new Promise((resolve, reject) => {
      setTimeout(() => resolve(" timeout resolve"), 3500) // 3.5 seconds
    })
    let prom1var = await promise1 // wait until promise1 resolves (*)
    this.logFun('1763 ww end timeout wait ')
    ///=== done waiting, now run the rest of this paragraph.
    this.userObj['status'] = 'done'
    this.userObj['priorQ'] = this.curQuestNbr
    this.userObj['answerCnt'] = this.answerClickedCnt.toString()
    if (this.whichDb == 'fauna') {
      this.launchFaunaChgParticipant(this.userObj, 'from wrapUp')
    }
    if (this.whichDb == 'supabase') {
      Object.assign(this.userObj, { id: this.participantArray[0].id })
      this.launchChgSupabase('qtUsers', this.userObj)
    }// end if supabase
    if (this.whichDb == 'turso') {
      this.logFun('1593 participantArray:')
      this.logFun(this.participantArray)
      this.launchChgTurso('qtUsers', this.userObj)
    }//end if turso
    this.atEndCompareQuestionCounts()
    this.atEndCompareAccumsAndScores()
    this.atEndCompareAnswerCounts()
    // this.logFun('830 diagMsgArray:')
    // this.logFun(this.diagMsgArray) 
    this.finalize()
  }//end wrapUp
  atEndCompareAnswerCounts() {
    this.logFun('ww824 running atEndCompareAnswerCounts')
    this.logFun('past answers count: ' + this.pastAnswerCount)
    this.logFun('answer clicked this session count: ' + this.answerClickedCnt)
    this.logFun('answers captured this session count: ' + this.answerArrayStoredToDb.length)

    let answeredThisSessionCnt = this.answerClickedCnt - this.pastAnswerCount
    if (answeredThisSessionCnt != this.answerArrayStoredToDb.length) {
      this.logFun('908 rats, answerCount mismatch.')
    } // end if

    let questionsNotAsked = this.allQuestions
      .filter((a: any) => a.answeredAlready == 'n'
        && a.answeredThisSession == 'n')

    this.logFun('answers stored to db this session count:'
      + this.answerArrayStoredToDb.length)
    this.logFun('questions not answered (assume not asked) count: '
      + questionsNotAsked.length)
    this.logFun('924 allQuestions array: ')
    this.logFun(this.allQuestions)
    this.logFun('920 questions not answered (assume not asked) array: ')
    this.logFun(questionsNotAsked)
    this.logFun('922 answerArray:')
    this.logFun(this.answerArray)
  }//end atEndCompareAnswerCounts
  atEndCompareQuestionCounts() {
    this.logFun('939 running atEndCompareQuestionCounts')
    let mainQuestions = this.allQuestions
      .filter((a: any) => a.subset.toLowerCase().includes('main'))
    // count  not-yet-answered questions in group 'Main'
    // count  already-answered questions in group 'Main'
    this.diagMainAnsweredCnt = this.allQuestions
      .filter((a: any) => a.subset.toLowerCase().includes('main')
        && a.answeredThisSession == 'y')
      .length
    this.diagMainNotAnsweredCnt = this.allQuestions
      .filter((a: any) => a.subset.toLowerCase().includes('main')
        && a.answeredThisSession != 'y')
      .length

    this.logFun('Main questions asked: ' + this.diagMainAnsweredCnt)
    this.logFun('Main questions not asked: ' + this.diagMainNotAnsweredCnt)
  } // end atEndCompareQuestionCounts
  atEndCompareAccumsAndScores() {
    // run diagnostics at the end of the survey/assessment.
    this.logFun('ww824 running atEndCompareAccumsAndScores')
    this.logFun('910 accumArray:')
    this.logFun(this.accumArray)
    this.logFun('912 scoreDiagArray:')
    this.logFun(this.scoreDiagArray)
    for (let i = 0; i < this.accumArray.length; i++) {
      for (let j = 0; j < this.scoreDiagArray.length; j++) {
        if (this.accumArray[i].accum == this.scoreDiagArray[j].accum) {
          this.logFun('922 scoreDiagArray[j].accum:')
          this.logFun(this.scoreDiagArray[j].accum)
          this.logFun('925 accumArray[i].accum:')
          this.logFun(this.accumArray[i].accum)
        } // end if
      } // end for k
    } // end for i
  } // end atEndCompareAccumsAndScores
  async checkForAnyMissingScores() {
    this.logFun('running checkForAnyMissingScores ')
    // Dec 2022 Selzer. 
    // look for any scores not yet written, and write them:
    // read accumArray, see if there are any not-yet-written scores.
    // look for a mismatch between questions asked and total questions.
    // these might be for questions that were never asked,
    // cuz they are part of un-asked (never triggered) groups,
    // yet some groups WERE asked. (there is a score > 0)
    //
    // Oct2024 this para is run at wrap up time.
    // there may be questions that added to an accum,
    // and the accum has not resulted in a scores rec.
    // detect these and create a scores rec.
    // detect these by looking at accumArray[i].accumQuestCnt
    // accumQuestCnt  > 0 means he answered a question 
    //                    that added to the accum.
    // accumQuestCnt  < accumQuestCntTot means 
    //                    that we have not yet created a score rec.
    //                                   
    this.logFun('851 accumArray:')
    this.logFun(this.accumArray)
    for (let i = 0; i < this.accumArray.length; i++) {
      //
      if (this.accumArray[i].accumQuestCnt > 0
        && this.accumArray[i].accumQuestCnt
        < this.accumArray[i].accumQuestCntTot) {
        this.logFun('1473 found a not-yet-scored accumArray row:')
        this.logFun(this.accumArray[i].accum)
        await this.readOneScoreChgOrAddOneScore(i)
        // 2025 maybe write a score for every accum
        // (even if no questions were asked?) 
        // or keep as is, sometimes write score rec,
        // only when a question for it was asked
      }//end if

    } // end for
  } // end checkForAnyMissingScores
  appendToQueryString() {
    this.logFun('1329 running appendToQueryString')
    let loco = new URLSearchParams(location.search)
    loco.set('priorQ', this.priorQ)
    this.logFun('loco' + loco.toString())
    window.history.replaceState(
      {}, 'unused', `${location.pathname}?${loco}`)
    //  now try setting history to the prior question
    let myNewUrl = new URL(window.location.toString())
    window.history.pushState({}, '', myNewUrl)
    this.logFun('myNewUrl ' + myNewUrl)
    // pushstate might work, but now ya gotta find that priorQ.
  }//end appendToQueryString

  logFun(logParmIn1: any) {
    // use logFun instead of console.log and console.table.
    // logs only if debugLvl not equal 0.
    if (this.debugLvl == '0') { return }
    let nd = new Date() //format datetime to 2022/12/31 01:31:32.555
    let a = nd.toLocaleDateString('zh-CN')
    let b = nd.getHours().toString().padStart(2, '0')
    let c = nd.getMinutes().toString().padStart(2, '0')
    let d = nd.getSeconds().toString().padStart(2, '0')
    let e = nd.getMilliseconds().toString().padStart(3, '0')
    let myDateTime = a + ' ' + b + ':' + c + ':' + d + '.' + e

    if (Array.isArray(logParmIn1) == true) {
      // console.log('1928 IS an Array')
      console.table(logParmIn1)
      console.log('💫', myDateTime)
      //💫 Dizzy https://emojipedia.org/emoji-1.0/
    } else {
      // console.log ('1934 logParmin1 is NOT an array')
      console.log(myDateTime, '💠', logParmIn1)
      //💠 Diamond with a Dot
      // this.buildDiagMsgObj(myDateTime , logParmIn1)
      this.diagMsgArray.push(this.diagMsgObj)
      // maybe someday write to fauna log    
      // this.writeDiagMsgToDb(this.diagMsgObj) 
    } // end if 
  } // end logfun
  formatNow() {
    let now = new Date()
    let year = now.getFullYear().toString()
    let month = (now.getMonth() + 1).toString() //stupid js needs +1
    let day = now.getDate().toString()
    let hour = now.getHours().toString()
    let minute = now.getMinutes().toString()
    let second = now.getSeconds().toString()
    if (month.length == 1) { month = '0' + month }
    if (day.length == 1) { day = '0' + day }
    if (hour.length == 1) { hour = '0' + hour }
    if (minute.length == 1) { minute = '0' + minute }
    if (second.length == 1) { second = '0' + second }

    let dateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
    return dateTime
  }// end formatNow
  finalize() {
    this.logFun('running finalize')
    this.msg1 = 'Thank you, ' + this.firstNameInput
      + ', for taking this Qna. '
    this.showDoneHtml = true
    this.showQuestHtml = false
    this.showAnswerGroupHtml = false
  } // end finalize
  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (event.ctrlKey && event.shiftKey && event.altKey) {
      this.ctrlShiftAltWasHit()
    } // end if
    if (event.key == 'Enter') {
      this.enterKeyWasHit()
    } // end if
  }//end onKeydownHandler
}// end export