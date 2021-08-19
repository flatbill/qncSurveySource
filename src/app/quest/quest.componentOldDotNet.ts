// 'Nov 2003 Create Logical Unit of Work with BeginTransaction and Commit
// 'Dec 2004 Changed Ed's email to comcast.
// 'Jun 2006 Set connection id based on URL.
// 'Apr 2007 Bridgestreet partner mods.
// 'Jul 2007 VisualCoachSports.com mods
// 'Aug 2007 Invitation Code icode icods
// 'Aug 2011 Check for dup answers
Protected WithEvents lblStreamOUt As Label
Protected WithEvents WFNAME   As Textbox
Protected WithEvents WLNAME   As Textbox
Protected WithEvents WQUSER_ID As Textbox
Protected WithEvents WCOMPANY As Textbox
Protected WithEvents WQID     As Textbox
Protected WithEvents WANSWERS As Textbox
Protected WithEvents WELAPSED As Textbox
Protected WithEvents WFQNBR   As Textbox
Protected WithEvents WLQNBR   As Textbox
Protected WithEvents WREFER As TextBox

let qfun = "SIGNON"
let i = 0
let SDONE : boolean = false
let QUSER_FOUND : boolean = false
let QUEST_FOUND : boolean = false
let SCORE_FOUND : Boolean = false

let NOW    : Datetime
let ERRMSG = ''

//'Public QTITLE As String = "Management By Design"
let QTITLE : String = " "
let FNAME  : String
let FNAMEx : String
let LNAME   : String
let LNAMEx : String
let QUSER_ID  : String
let COMPANY  : String
let COMPANYx : String
let COMPANYsfx : String // 'like VCS BSP 

let ANSWERS  : String
let ELAPSED  : String
let FQNBR    : String
let LQNBR : String
let QREFER : String = " "
let ICODE : String = " "
let ICODS : String = " "

let QID   = "1   "
let COCAPTION  = "Sponsoring Company:"
let GOBUTVAL = "Continue"  //'qt120 jscript uses this
let TEST_DATE = ''
let SEQ   = "   0"
let QUEST = ''  
let INTBRKFINKEY  = ''
let ans = ''    
let wei = ''  //'     "
let cor = ''   //'     "
let ac  = ''  //'     "
let tim = ''   //'     "
let sid = ''  //' sponser id, like BridgeStreet
let Cor_Ans_Thresh  = 0

let tans= []    //'array for answer descriptors, DESC200 (DESC1 + DESC2 3 4 5)
let txid = []       //'array for QUEST_ID'S for previously-asked questions. (not outbound)
let elap = []        //'ARRAY for the elapsed time  1 ENTRY for each answer
let answer = []     //'ARRAY for the incoming 20 answers
let tqstyle = []   //' HORIZONTAL, VERTICAL, OR SCALE
let tdesca = []    //'  DESC A B C is like 'always sometimes never', helper descriptions,
let tdescb = []   //'  used in tandem with the scale style
let tdescc = []    //'
let tquest = []   //' array for the question text
let pquest = []   //'array for pre-question text PQUEST
let dquest = []   //'array for answer choices built into the bottom of quest
let ScoAccum= []   //'array for holding accumulator names for scoring
let ScoSums = []    //'array for summing answers to scores table
let ScoSumw = []   //'array for summing weighted answers to scores table
let ScoQcnt = []    //'array for summing weighted answers to scores table
let ScoTime = []    //'array for summing weighted answers to scores table


let pw  = "krsp"
let QM = 0 //'NBR OF QUESTIONS IN THE MAIN SUBSET
let QF  = 0 //'NBR OF QUESTIONS IN FOLLOW-ON SUBSETS
let QS  = 0 //'NBR OF QUESTIONS TO-BE-ASKED, TOTAL (EST AT START, ACTUAL AFTER BRK)
let QT  = 0 //'NBR OF QUESTION IN FOLLOW-ON SUBSETS THAT WE WILL ACTUALL ASK HIM
let QA  = 0 //'NBR OF QUESTIONS ALREADY ANSWERED
let QD  = 0 //'PERCENT COMPLETE
let AK  = 0 //'ANSWER COUNT WHEN LOOKING FOR EXISTING (DUP) ANSWERS

let PRIORQ = '' //'QUEST REC# OF THE LAST GOOD ANSWER STORED TO THE DATABASE.
//'BE CAREFUL NOT TO RESET PRIORQ.  (EXCEPT FOR AT THE BREAK).
// 'PRIORQ IS THE SERVERS ONLY WAY TO REMEMBER HOW FAR THE GUY GOT STORED TO OUR DATABASE.
// 'EARLY IN THIS ROUND, PRIORQ IS FROM QUSER table FROM PREVIOUS ROUND(S).
// 'PRIORQ IS A RECNO() OF QUEST.DBF, BUT IT MATCHES THE LAST GOOD ANSWER STORED IN ANSWER table.
// 'LATE IN THIS ROUND, PRIORQ IS LAST GOOD ANSWER STORED THIS ROUND INTO ANSWER.DBF.
// 'WE CAN USE PRIORQ TO SEE HOW FAR HE GOT, SO WE CAN DECIDE WHAT QUESTIONS TO ASK NEXT.


let CURRQ = '' //'WILL BE 1ST-OF-20 QUESTIONS REC#
// '* BE CAREFUL NOT TO EVER RESET CURRQ.
// '* CURRQ IS THE SERVERS ONLY WAY TO REMEMBER HOW FAR THE TESTEE GOT, WE SENT OUT TO HIS PAGE.
// '* EARLY IN THIS ROUND, CURRQ IS FROM QUSER.DBF. IT IS 1ST-OF-20 THAT WE ASKED HIM LAST ROUND.
// '* LATE IN THIS ROUND, CURRQ IS 1ST-OF-20 THAT WE ARE ABOUT TO ASK HIM, SENDING OUT THE WEBPAGE.

let LANSQ = '' //'DETECT THE QUEST.DBF RECNO MATCHING THE LAST-OF-20 INCOMING ANSWERS
// '* LANSQ IS ONLY USED TO VERIFY THAT THIS PROGRAM IS WORKING CORRECTLY. LANSQ IS CROSS-CHECKED
// '* AGAINST THE OTHER RECNO() FIELDS THAT TRACK HOW FAR WE ARE IN THE TOTAL LIST OF QUESITONS,
// '* AND THE EVER SHIFTING LIST-OF-20 QUESTIONS.


let SUBSETKEYS = "MAIN" //'LIST OF SUBSETS. FEEDS WHICH QUESTIONS ARE INCLUDED.
let SUBSETKEYLIST = '' //'CONVERTER IS B21 PARAGRF.

let objConn : SQLConnection
let strConn : String
let objTran : SQLTransaction



//''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
//''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
// Page Load 
A1GetQtcomm()     //'get incoming fields from browser client form
A2ReferChk()    //'see  who linked in to us, set REFER
A2ReferVars()  //'set variable based on who linked-in originally

if (SDONE === true) {   //'need more info from the incoming form
  D1Merge()
  return
}

D1Px()

A2ConnectDB()
A2QUserChk()   //'find this guy and restore his state from quser

//'use this to test email at every post
//'D2SendEmail2()

A2IcodeChk()
if (SDONE === true) {    //'he did not supply an ICODE
  D1Merge()
  return
}


if (QS === 0) {
  A2QuestCounts()
}

A3IntroChk()  //' VALIDATE QFUN, AND SHOW INTRO (if that's where we're at)
if (SDONE === true) {  
  C1SaveQuser()
  objConn.Close()
  D1Merge()
  return
}

if (qfun === "BREAK") {  //' incoming qfun = BREAK, means we just showed him the break screen.
 // '  now lets compute the scores for the completed main subset & compute new SUBSETKEYS
  B1SumAnswers()      //'APPENDS TO SCORES FILE
  B2SetSubsetKeys()   //'SETS SUBSETKEYS FOR THE FOLLOW-ON QUESTIONS WE WILL ASK
  A2QuestCounts()     //'RE-COUNT QUESTIONS NOW THAT WE KNOW FOLLOW-ONS
}

// RE-FIND THE LAST 20 QUESTIONS WE ASKED HIM, TABLE-UP THEIR QUEST_ID'S
B5Refind20()
if (SDONE === true) {
  C1SaveQuser()
  objConn.Close()
  D1Merge()
  return
}

//' STORE INCOMING ANSWERS TO THE ANSWER DATABASE
B6InsertAnswers()
if (SDONE === true) {
  C1SaveQuser()
  objConn.Close()
  D1Merge()
  return
}

//' Look for next 20 questions to send to the outbound webpage
B7Next20Questions()
if (SDONE === true) {
  C1SaveQuser()
  objConn.Close()
  D1Merge()
  return
}


//'  FALL HERE WHEN WE DONT HAVE A QUESTION TO ASK, WE WILL SHOW BREAK OR FINISH.
B9ChkFinish()        //'THIS ALSO COMPUTES FINAL SCORES AT THE FINISH.

C1SaveQuser()
objConn.Close()
D1Merge()
Return

End Sub

//''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
//''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''


//'''''''''''''''''''
A1GetQtcomm() {
  ICODE = Request.QueryString("icode")
  ICODS = Request.QueryString("icods")
  if (Page.IsPostBack)  {
        A11formin()
  } else {
    ERRMSG = " "
    qfun = "SIGNON"
    SDONE = true
  }
     
    if (hour < 18) {
        greeting = "Good day";
      } else {
        greeting = "Good evening";
      }


} // end A1GetQtcomm
//''''''''''''''''''


//'''''''''''''''''''''''''
Sub A11formin() {
FNAME = Request.Form("WFNAME")
LNAME = Request.Form("WLNAME")
QUSER_ID = Request.Form("WQUSER_ID")
COMPANY = Request.Form("WCOMPANY")
FQNBR = Request.Form("WFQNBR")
LQNBR = Request.Form("WLQNBR")
QID = Request.Form("WQID")
ELAPSED = Request.Form("WELAPSED")
ANSWERS = Request.Form("WANSWERS")
QREFER = Request.Form("WREFER")





let x = 0

if (ELAPSED.Length > 0) {
 x = ELAPSED.Length - 1
 ELAPSED = ELAPSED.Substring(0, x)  //'take the extra comma off the end
 elap = ELAPSED.Split(",") //'builds an array of elapsed times
}

if (ANSWERS.Length > 0) {
  x = ANSWERS.Length - 1
  ANSWERS = ANSWERS.Substring(0, x)  //'take the extra comma off the end
  answer = ANSWERS.Split(",") //'builds an array of answers
}

if (FQNBR.Trim.Length === 0) {
  FQNBR = 0
}

if (LQNBR.Trim.Length === 0) {
  LQNBR = 0
}

if (FNAME.Trim.Length === 0 
Or LNAME.Trim.Length === 0 
Or COMPANY.Trim.Length === 0) {
    qfun = "SIGNON"
    ERRMSG = "Please enter-- First Name, Last Name and Sponsor."
    SDONE = true
    return
}


} // end A11formin
//'''''''''''''''''''''''''

A2ReferChk() {
// 'Catch the refering website the first-time-in.
if (QREFER === " ") {
  QREFER = Request.ServerVariables("HTTP_REFERER")
}

// ' need this variable for the signon:
if Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(QREFER), "VIRTUALCOACH") {
    COCAPTION = "Sponsor:"
}

If Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(QREFER), "TESTLINK") {
    COCAPTION = "Sponsor:"
}

if (ICODS > "") {
    COCAPTION = "Sponsor:"
}

} // end A2ReferChk
//'''''''''
A2ReferVars() {

If Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(QREFER), "PONDERA") {
    COMPANYsfx = "PON"
}

if Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(QREFER), "LOGDOG.NET") {
    COMPANYsfx = "LOG"
    // 'COMPANYsfx = "BSP"  'BILLY remove this after testing
}


if Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(QREFER), "VIRTUALCOACH") {
    COMPANYsfx = "VC"
}

if Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(QREFER), "DIGITAL-COUCH.COM") {
    COMPANYsfx = "DIG"
}

if (ICODS > "") {
    COMPANYsfx = "AB"
}


//' If the link was digital-couch.com/bridgestreet then the suffix will be BSP
If Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(QREFER), "BRIDGESTREET") {
    COMPANYsfx = "BSP"
}

if Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(QREFER), "MBYDESIGN.COM") {
    COMPANYsfx = "MBD"
}

if Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(COMPANY), COMPANYsfx) {
   //' The Company Suffix is already stuffed on the end
} else {
if (Page.IsPostBack) {
if (COMPANY.Trim.Length > 0) {
     //' Don't stick the suffix on blank Company, test-taker must fill in Company first
     COMPANY = Microsoft.VisualBasic.Trim(COMPANY) + " " + COMPANYsfx
    }
}
}


// 'old dead stuff here:
// ' If linked-in from ?sid=b then this is BridgeStreet
// 'sid = Request.QueryString("sid")
// 'If sid = "b" Then
// '  QTITLE = "BridgeStreet Partners"
// ' If Microsoft.VisualBasic.InStr(Microsoft.VisualBasic.UCase(COMPANY), "BSP") Then
// ' Else
// '   COMPANY = Microsoft.VisualBasic.Trim(COMPANY) + " BSP"
// ' }
// '}

} // End A2ReferVars
//'''''''''''''''''''''''''
A2ConnectDB() {
//'strConn = "server=sql43.mysite4now.com;database=AlaskaTest;uid=asp3147;pwd=3147" & pw
strConn = "server=aster.arvixe.com;database=alaska2;uid=dc1111;pwd=3147" & pw

if Microsoft.VisualBasic.InStr(Request.ServerVariables("SERVER_NAME"), "digital-couch.com") > 0 {
  //'strConn = "server=sql346.mysite4now.com;database=Alaska2;uid=asp3147;pwd=3147" & pw
}

if Microsoft.VisualBasic.InStr(Request.ServerVariables("SERVER_NAME"), "mbydesign.com") > 0 {
  //'strConn = "server=sql385.mysite4now.com;database=Alaska;uid=asp3147;pwd=3147" & pw
}

objConn = New SqlConnection(strConn)
objConn.Open()
objTran = objConn.BeginTransaction()
NOW = DateTime.Now()
} // End A2ConnectDB

//'''''''''''''''''''''''''
 A2QUserChk() {
// ' RETRIEVE  QUSER REC FOR THE GUY TAKING THIS QUESTIONNAIRE,
// ' AND SET OUR MEMVARS FROM  MATCHING table FIELDS.
// ' QUSER table contains SAVED DATA FROM THE PREVIOUS SESSION, ALL TEST-TAKERS.
// ' USE QUSER and find fname  lname. When multiple recs exist, we take
// ' the most recent date where the test is un-finished.
// ' IF WE Find HIM, WE CAN RESTORE HIS 'STATE'.
// ' IF WE dont FIND HIM, THEN HE IS A NEW GUY.
// ' He can repeat the test if 3 days have gone by since he finished.

// ' WE INITIALIZE HIS 'STATE' WITH BLANKS & ZEROS.
QUSER_FOUND = false

FNAMEx = FNAME.Replace("'", "''")
LNAMEx = LNAME.Replace("'", "''")
let strSQL : String
strSQL = "SET ROWCOUNT 0 SELECT * FROM qx1quser WHERE qid = " & QID _
  & " AND fname = " & "'" & FNAMEx & "'" _
  & " AND lname = " & "'" & LNAMEx & "'" _
  & " AND ( datediff(day,test_date,getdate()) < 3 " _
  & "       OR qfun <> 'FINISH' ) " _
  & " ORDER BY test_date DESC"


Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr1 As SqlDataReader
dr1 = objCommand.ExecuteReader()

While dr1.Read()
  QUSER_FOUND = true
  QUSER_ID = dr1("quser_id")
  PRIORQ = dr1("priorq")
  CURRQ = dr1("currq")
  QA = dr1("qa")
  QS = dr1("qs")
  qfun = dr1("qfun")
  COMPANY = dr1("company")
  TEST_DATE = dr1("test_date")
  SUBSETKEYS = dr1("subsetkeys")
  if (qfun <> "FINISH") {  //'this is an active test, lets use this record
    Exit While
}
End While

dr1.Close()

 } // End A2QUserChk
//'''''''''''''''''''''''''
 A2QUserChk() {
// ' Selzer Sep2018 dont bypass invitation code check.
// 'bypass the ICODE check if referer is BridgeStreet:
// ' If COMPANYsfx = "BSP" Then
// '   Return
// ' }

// ' 'bypass the ICODE check during flyredsky move:
// ' If COMPANYsfx <>  "BSP" Then
// '   Return
// ' }

if (ICODE === "" And ICODS === "") {
    qfun = "SIGNON"
    ERRMSG = "Please enter an Invitation Code."
    SDONE = true
    return
}


//' Selzer Sep2018 check invite code for ICODE and ICODS as ICODE
let ICODEKEY = "ICODE"
//ICODEKEY = "ICODE"
// ' If ICODS > "" Then
// '   ICODEKEY = "ICODS"
// ' Else
// '   ICODEKEY = "ICODE"
// ' }



// 'Look for the ICODE rec in the Quest table:
Dim strSQL As String
strSQL = "SET ROWCOUNT 1 SELECT * FROM qx1quest WHERE qid = " & QID _
  & " AND subset =  " & "'" & ICODEKEY & "'"
Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr14 As SqlDataReader
dr14 = objCommand.ExecuteReader()
Dim iCODEdb As String = " "
While dr14.Read()
  iCODEdb = dr14("seq")
End While
dr14.Close()




if (ICODE > "" And ICODE <> iCODEdb) //'_
// 'Or (ICODS > "" And ICODS <> iCODEdb) Then
   if (ANSWERS.Trim.Length === 0) {
    qfun = "SIGNON"
    ERRMSG = "Your Invite Code is not valid. "
    SDONE = true
    return
}
}

if (ICODS > "" And ICODS <> iCODEdb) {
 if (ANSWERS.Trim.Length === 0) {
    qfun = "SIGNON"
    ERRMSG = "Your Invite Code is not valid. "
    SDONE = true
    return
}
}



// '''''''''''''''''''''''''
 A2QuestCounts() { //'sets qs (number of questions)  at start of test
                    // 'count main, then count non-main (estimate or real)
  Dim strSQL As String
  strSQL = " SET ROWCOUNT 0 SELECT COUNT(*) AS mycount FROM qx1quest" _
  & " WHERE SUBSET = 'MAIN' "
  Dim objCommand As New SqlCommand(strSQL, objConn)
  objCommand.Transaction = objTran
  Dim dr9 As SqlDataReader
  dr9 = objCommand.ExecuteReader()
  While dr9.Read()
    QM = dr9("mycount")
  End While
  dr9.Close()

  Dim whereClause = " WHERE SUBSET <> 'MAIN' "
  let divisor = 2   //'we are estimating how many follow-ons
  if (SUBSETKEYS <> "MAIN") {
    divisor = 1                // 'we know exactly how many follow-ons
    B21SetSubsetKeyList()
    whereClause = " WHERE SUBSET IN " & SUBSETKEYLIST
}

  strSQL = " SET ROWCOUNT 0 SELECT COUNT(*) AS mycount FROM qx1quest" & whereClause
  Dim objComm10 As New SqlCommand(strSQL, objConn)
  objComm10.Transaction = objTran
  Dim dr10 As SqlDataReader
  dr10 = objComm10.ExecuteReader()
  While dr10.Read()
    QF = dr10("mycount")
  End While
  dr10.Close()

  QS = QM + QF / divisor   //'if estimating follow-ons, divide by 2
 } End A2QuestCounts
// '''''''''''''''''''''''''


// '''''''''''''''''''''''''
A3IntroChk() { //'VALIDATE QFUN, AND CHECK FOR INTRO.


if (qfun = "FINISH") {
  //' He is done & already saw the finish, but show it again.
  INTBRKFINKEY = "FINISH"
  A33SetIntBrkFin()
  GOBUTVAL = "Close"  'qt120 jscript uses this for onclick
  ERRMSG = "100% complete."
  SDONE = true
  return
}



if (qfun <> "SIGNON"  
And qfun <> "INTRO"  
And qfun <> "QUEST" 
And qfun <> "BREAK") {
  ERRMSG = "INVALID QFUN:" & qfun & ":"
  SDONE = true
  return
}

if (FQNBR = 0 And LQNBR === 0) {   //'check incoming web page for consistentcy
  if (ANSWERS.Trim.Length > 0) {
    qfun = "SIGNON"
    ERRMSG = "Answers not allowed yet. Please sign on."
    SDONE = true
    return
}
}

if (FQNBR <> 0 Or LQNBR <> 0) {  //' check incoming web page for consistentcy
  if (ANSWERS.Trim.Length === 0) {
    qfun = "SIGNON"
    ERRMSG = "Trouble with Answers or Questions. Please sign on."
    SDONE = true
    return
}
}


if (qfun = "SIGNON" And CURRQ === 0) {
  //' AT THIS POINT WE ALREADY HAVE A VALID NAME, AND THE FUNCTION WAS SIGNON.
  //' AND HE HAS NO ANSWERS IN OUR DATABASE. WE ARE READY TO SHOW THE INTRO.
  qfun = "INTRO"
  INTBRKFINKEY = "INTRO"
  A33SetIntBrkFin()
  FQNBR = 0
  LQNBR = 0
  SDONE = true
  return
}

}  End A3IntroChk
// '''''''''''''''''''''''''

// '''''''''''''''''''''''''
A33SetIntBrkFin() {
QUEST = "Please Continue..."        'default

' Find the Intro, Break, or Finish question using SUBSET as a key
' (In quest table, there is 1 question each for subset 'INTRO' 'BREAK' 'FINISH'
Dim strSQL As String
strSQL = "SET ROWCOUNT 1 SELECT * FROM qx1quest WHERE qid = " & QID _
  & " AND subset =  " & "'" & INTBRKFINKEY & "'"
Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr6 As SqlDataReader
dr6 = objCommand.ExecuteReader()

While dr6.Read()
  QUEST = dr6("quest")
End While
dr6.Close()

} // End A33SetIntBrkFin
// '''''''''''''''''''''''''

// '''''''''''''''''''''''''
 B1SumAnswers() {
// ''  build datareader for answers + questions
// ''  for each answered question, store/update up to 3 ScoAccum entries,
// ''  one for each accumulator for this question.
// ''  for every entry in ScoAccum, write a scores record.

For i = 0 To 99
  ScoAccum(i) = " "
  ScoSums(i) = 0
  ScoSumw(i) = 0
  ScoQcnt(i) = 0
  ScoTime(i) = 0
Next

B21SetSubsetKeyList()
Dim strSQL As String
strSQL = "SET ROWCOUNT 0 SELECT qx1answers.quser_id, qx1answers.quest_id, " _
  & "qx1answers.answer,   qx1answers.time_gap, " _
  & " qx1quest.accum1, qx1quest.accum2, qx1quest.accum3,   " _
  & " qx1quest.cor_ans, qx1quest.weight " _
  & " FROM qx1answers,qx1quest " _
  & " WHERE qx1answers.quest_id = qx1quest.quest_id " _
  & " AND  qx1answers.qid      = " & QID _
  & " AND  qx1quest.qid        = " & QID _
  & " AND  qx1answers.quser_id = " & QUSER_ID _
  & " AND  qx1quest.subset    IN " & SUBSETKEYLIST

Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr8 As SqlDataReader
dr8 = objCommand.ExecuteReader()

While dr8.Read()
 ans = dr8("answer")
 wei = dr8("weight")
 cor = dr8("cor_ans")
 tim = dr8("time_gap")
 ac = dr8("accum1")
 B111SetScore()
 ac = dr8("accum2")
 B111SetScore()
 ac = dr8("accum3")
 B111SetScore()
End While
dr8.Close()

For i = 0 To 99
if (ScoAccum(i).Trim.Length <> 0) {
   B113FindScore()
   if (SCORE_FOUND === true) {
     B114UpdateScore()
    } else {
     B115InsertScore()
    }
} else {
   Exit For
}
Next

 } // End B1SumAnswers
// '''''''''''''''''''''''''

// '''''''''''''''''''''''''
 B111SetScore()  { //' before calling this, please set (ac,ans,cor,wei,tim)
 if (ac.Trim.Length <> 0) {
 For i = 0 To 99
   if (ScoAccum(i) = ac Or ScoAccum(i) === " ") {     'find accum or 1st blank
     ScoAccum(i) = ac
     ScoQcnt(i) = ScoQcnt(i) + 1
     ScoTime(i) = ScoTime(i) + tim
     if (cor > 0) {
       if (ans === cor) {
         ScoSums(i) = ScoSums(i) + 1
         ScoSumw(i) = ScoSumw(i) + (1 * wei)
        }
    } else {
       ScoSums(i) = ScoSums(i) + ans
       ScoSumw(i) = ScoSumw(i) + (ans * wei)
    }
     Exit For
    }
 Next
}
 } // End B111SetScore
// '''''''''''''''''''''''''


// '''''''''''''''''''''''''
 B113FindScore() {

SCORE_FOUND = false
Dim strSQL As String
strSQL = "SET ROWCOUNT 1 SELECT * FROM qx1scores WHERE qid = " & QID _
  & " AND quser_id  = " & "'" & QUSER_ID & "'" _
  & " AND accum     = " & "'" & ScoAccum(i) & "'"

Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr13 As SqlDataReader
dr13 = objCommand.ExecuteReader()

While dr13.Read()
  SCORE_FOUND = true   //'don't really do anything here, just remember
End While               //'that we found a scores record.
dr13.Close()

 } // End B113FindScore
// '''''''''''''''''''''''''

// '''''''''''''''''''''''''
B114UpdateScore() {
Dim strSQL As String
strSQL = "UPDATE qx1scores SET " _
 & "  SCORE      =  SCORE    + " & "'" & ScoSums(i) & "'," _
 & "  WSCORE     = WSCORE    + " & "'" & ScoSumw(i) & "'," _
 & "  QUEST_CNT  = QUEST_CNT + " & "'" & ScoQcnt(i) & "'," _
 & "  TIME_GAP   = TIME_GAP  + " & "'" & ScoTime(i) & "'" _
 & " WHERE QID     = " & "'" & QID & "'" _
 & " AND QUSER_ID  = " & "'" & QUSER_ID & "'" _
 & " AND ACCUM     = " & "'" & ScoAccum(i) & "'"

Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
objCommand.ExecuteNonQuery()

} // End B114UpdateScore
// '''''''''''''''''''''''''

// '''''''''''''''''''''''''
 B115InsertScore() {
Dim strSQL As String
strSQL = "INSERT INTO qx1scores " _
 & " (QID,QUSER_ID,TEST_DATE,ACCUM,SCORE,WSCORE,QUEST_CNT,TIME_GAP) " _
 & "VALUES (" _
 & "'" & QID & "'," _
 & "'" & QUSER_ID & "'," _
 & "'" & TEST_DATE & "'," _
 & "'" & ScoAccum(i) & "'," _
 & "'" & ScoSums(i) & "'," _
 & "'" & ScoSumw(i) & "'," _
 & "'" & ScoQcnt(i) & "'," _
 & "'" & ScoTime(i) & "' ) "

Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
objCommand.ExecuteNonQuery()
 } // End B115InsertScore
// '''''''''''''''''''''''''



// '''''''''''''''''''''''''
 B2SetSubsetKeys() {  'SETS SUBSETKEYS FOR THE FOLLOW-ON QUESTIONS WE WILL ASK
// '/ EVALUATE SCORE  (SO FAR), SET DESIRED SUBSETS KEYS.
// ' SWEEP RULES RECS.
// '   FOR EACH RULE,  LOOKUP MATCHING SCORE REC (MATCHES ON ACCUM).
// '   COMPARE EACH RULE TO THE ACCUMULATOR.
// '   IF RULE IS TRUE, THEN PUT THE RULE'S SUBSET INTO SUBSETKEYS.
// '   This only works when QX1RULES.OPER IS A > SIGN.

SUBSETKEYS = ""
Dim strSQL As String
strSQL = "SET ROWCOUNT 0 SELECT " _
& "QX1RULES.SUBSET, " _
& "QX1RULES.ACCUM,  " _
& "QX1RULES.OPER,   " _
& "QX1RULES.THRESH, " _
& "QX1SCORES.QUSER_ID,  " _
& "QX1SCORES.SCORE,     " _
& "QX1SCORES.ACCUM      " _
& "FROM                 " _
& "QX1RULES,QX1SCORES   " _
& "WHERE                " _
& "QX1SCORES.ACCUM = QX1RULES.ACCUM " _
& " AND QX1RULES.QID = 1             " _
& " AND QX1SCORES.QUSER_ID = " & "'" & QUSER_ID & "'" _
& " AND QX1SCORES.QID =      " & "'" & QID & "'" _
& " AND QX1RULES.OPER = '>'          " _
& " AND QX1SCORES.WSCORE > QX1RULES.THRESH  "

Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr11 As SqlDataReader
dr11 = objCommand.ExecuteReader()

While dr11.Read()
  SUBSETKEYS = SUBSETKEYS & "|" & dr11("SUBSET")
End While
dr11.Close()

'repeat the same rule search usin "<"  this time:
strSQL = "SET ROWCOUNT 0 SELECT " _
& "QX1RULES.SUBSET, " _
& "QX1RULES.ACCUM,  " _
& "QX1RULES.OPER,   " _
& "QX1RULES.THRESH, " _
& "QX1SCORES.QUSER_ID,  " _
& "QX1SCORES.SCORE,     " _
& "QX1SCORES.ACCUM      " _
& "FROM                 " _
& "QX1RULES,QX1SCORES   " _
& "WHERE                " _
& "QX1SCORES.ACCUM = QX1RULES.ACCUM " _
& " AND QX1RULES.QID = 1             " _
& " AND QX1SCORES.QUSER_ID = " & "'" & QUSER_ID & "'" _
& " AND QX1SCORES.QID =      " & "'" & QID & "'" _
& " AND QX1RULES.OPER = '<'          " _
& " AND QX1SCORES.WSCORE < QX1RULES.THRESH  "

Dim objComm2 As New SqlCommand(strSQL, objConn)
objComm2.Transaction = objTran
Dim dr12 As SqlDataReader
dr12 = objComm2.ExecuteReader()

While dr12.Read()
  SUBSETKEYS = SUBSETKEYS & "|" & dr12("SUBSET")
End While
dr12.Close()

 } // End B2SetSubsetKeys
// '''''''''''''''''''''''''


// '''''''''''''''''''''''''
B21SetSubsetKeyList()  { //'Converts raw subsets to a format for sql lookup
//'                 Format subsetkeylist like:  ('cherry','lime','grape')
Dim x As Integer
if (SUBSETKEYS.Length > 0) {
  x = SUBSETKEYS.Length - 1
  if (SUBSETKEYS.Substring(x, 1) === "|") {
    SUBSETKEYS = SUBSETKEYS.Substring(0, x)  //'take  extra | off the end
}
  if (SUBSETKEYS.Substring(0, 1) === "|") {
    x = SUBSETKEYS.Length - 1
    SUBSETKEYS = SUBSETKEYS.Substring(1, x)  //'take  extra | off front
}
}
SUBSETKEYLIST = "('" & SUBSETKEYS.Replace("|", "','") & "')"
} // End B21SetSubsetKeyList
// '''''''''''''''''''''''''

 B22SetCor_Ans_Thresh() {
// ' Sports test takers come in with an invite code querystring mysite?icods=xxxxx
// ' Normal test takers come in with an invite code querystrying mysite?icode=yyyyy
// ' For sports test takers, skinny down the list of questions by removing those with
// ' correct answers.
// ' Quest.Cor_Ans is zero when the question has no correct answer.
// ' Quest.Con_Ans is 1-8 when the question has a correct answer.
if (ICODS > "") {
  Cor_Ans_Thresh = 1  //'filter out all questions except those with Cor_Ans of zero.
} else {
  Cor_Ans_Thresh = 99 //'the filter will let everything pass thru
}

 } // End B22SetCor_Ans_Thresh
// '''''''''''''''''''''''''

B5Refind20()  {  // TABLE-UP PRIOR 20 QUESTIONS WE ASKED HIM LAST ROUND, TO PREP FOR STORING ANSWERS
//' This will populate txid array.  ALSO sets LANSQ to the last-of-20 quest rec nbrs.

if (FQNBR === 0) {
//   ' NO INCOMING ANSWERS THIS ROUND, SO WE WONT BE STORING ANY ANSWERS TO THE DATABASE.
//   ' NO NEED TO LOOK UP ANY OF THE PREVIOUSLY-ASKED-QUESTIONS  FROM A PREVIOUS ROUND.
  return
}

if (FQNBR <> CURRQ) {  'CURRQ IS FROM QUSER DATABASE,  HAS 1ST-OF-20 ASKED LAST ROUND.
//   ' THE INCOMING ANSWER WEB PAGE DUZNT MATCH THE QUESTIONS WE JUST ASKED.
//   ' THIS MEANS HE RE-SUBMITTED A PAGE WE WERE NOT EXPECTING. NOTHING FATAL HERE.
//   ' JUST GET OUT OF THIS PARAGRAF, AND LATER PARAGRFS WILL ASK SAME QUESTIONS AGAIN.
  return
}


// ' Find the 1st of 20 from last round, using question key saved last round in quser table
Dim strSQL As String
strSQL = "SET ROWCOUNT 1 SELECT * FROM qx1quest WHERE qid = " & QID _
  & " AND quest_id = " & "'" & CURRQ & "'"
Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr4 As SqlDataReader
dr4 = objCommand.ExecuteReader()

QUEST_FOUND = false
While dr4.Read()
  SEQ = dr4("seq")
  QUEST_FOUND = true
End While
dr4.Close()

if (QUEST_FOUND === false) {
  qfun = "SIGNON"
  ERRMSG = "Trouble Re-Finding last question asked. Please sign on."
  SDONE = true
  return
}

SEQ = pad(SEQ)
CURRQ = pad(CURRQ)
B21SetSubsetKeyList()
B22SetCor_Ans_Thresh()

// '* CURRQ is the quest rec THAT IS THE FIRST-OF-20, PREVIOUSLY ASKED
// '* RE-READ 20, including this first rec:
// 'Dim strSQL As  String
strSQL = "SET ROWCOUNT 0 SELECT TOP 20 * FROM qx1quest WHERE qid = " & QID _
  & " AND (str(seq,4) + str(quest_id,4)) >= " _
  & "'" & SEQ & CURRQ & "'" _
  & " AND subset   IN " & SUBSETKEYLIST _
  & " AND cor_ans < " & Cor_Ans_Thresh _
  & " ORDER BY qid, seq, quest_id "

Dim objCommand5 As New SqlCommand(strSQL, objConn)
objCommand5.Transaction = objTran
Dim dr5 As SqlDataReader
dr5 = objCommand5.ExecuteReader()

Dim txidLst As String = ""  //'helps us build array from datareader results
QUEST_FOUND = false
i = 0

While dr5.Read()
  txidLst = txidLst & dr5("quest_id") & ","  //'to be LATER STORED IN ANSWER table.
  LANSQ = dr5("quest_id") //' LAST-OF-20 ANSWERED FROM THE LAST ROUND
  SEQ = dr5("seq")      //' LAST-OF-20 ANSWERED FROM THE LAST ROUND
  QUEST_FOUND = true
  i = i + 1
End While
dr5.Close()

let k = 0
if (txidLst.Length > 0) {
 k = txidLst.Length - 1
 txidLst = txidLst.Substring(0, k)  //'take the extra comma off the end
 txid = txidLst.Split(",") //'builds an array of quest_ids
}

if (QUEST_FOUND === false) {
  qfun = "SIGNON"
  ERRMSG = "Trouble Re-Finding last group of Questions asked. Please sign on."
  SDONE = true
  return
}

// 'WEB PAGE THINKS HE IS ANSWERING 20 QUESTIONS. SERVER THINKS HE IS ANSWER 20 QUESTIONS.
// 'MATCH LAST-OF-20 FROM THE SERVER (LANSQ) TO THE WEB PAGE (LQNBR)
If (LANSQ <> LQNBR) {
  ERRMSG = "Trouble re-matching Questions Asked VS Questions Answered. Please SIGN ON again."
  ERRMSG = ERRMSG & "LANSQ:" & LANSQ & " LQNBR:" & LQNBR & " I:" & i
  ERRMSG = ERRMSG & strSQL
  qfun = "SIGNON"
  SDONE = true
  return
}

} // End B5Refind20
// '''''''''''''''''''''''''

// 
// '''''''''''''''''''''''''
 B6InsertAnswers()  { //'STORE INCOMING ANSWERS

 if      (qfun === "INTRO" Or qfun === "BREAK" Or qfun === "FINISH" _
        Or (answer Is Nothing) Or FQNBR === 0 Or LQNBR === 0 Or (txid Is Nothing) ) {
            // ' THERE ARE NO INCOMING ANSWERS, AND THAT'S OK.
            // ' LIKE, THE USER JUST SAW A INTRO OR BREAK SCREEN, AND HE HIT CONTINUE.
            // ' IF THE FUNCTION IS 'FINISH', IT MEANS THIS GUY COMPLETED THE QUESTIONNAIRE, AND THEN
            // ' HE SIGNED ON AGAIN. HE CANT DO THE QUESTIONNAIRE AGAIN UNLESS HE USES A DIFFERENT NAME.
            return
        }

        // 'If txid Is Nothing ----selzer Apr07 just re-ask the prior20
        // '  'should have been set earler
        // '  QFUN = "SIGNON"
        // '  ERRMSG = "Trouble matching your answers to empty list of Questions. Please sign on."
        // '  SDONE = true
        // '  RETURN
        // '}

if (answer.GetUpperBound(0) <> txid.GetUpperBound(0) ) {
  qfun = "SIGNON"
  ERRMSG = "Trouble matching your answers to list of Questions. Please Sign on."
  SDONE = true
  return
}

if (answer.GetUpperBound(0) <> elap.GetUpperBound(0) ) {
  qfun = "SIGNON"
  ERRMSG = "Trouble Matching Answers to Answer times. Please sign on."
  SDONE = true
  return
}

For i = 0 To answer.GetUpperBound(0)
  B61Insert1Answer()
Next


// ' VERIFY THAT WE SUCCESSFULLY STORED MATCHING ANSWERS TO OUR ANSWER table.
// ' PRIORQ IS THE LAST ANSWERED QUESTION. We JUST SET THIS A SECOND AGO.
// ' LQNBR IS FROM THE FORM, IT IS THE LAST-OF-20.
if (PRIORQ <> LQNBR) {
  ERRMSG = "Trouble, matching your last answer to answer stored on Server. Sign on."
  qfun = "SIGNON"
  SDONE = true
  return
}

QD = QA / QS * 100
ERRMSG = QD & " % complete."

 } // End B6InsertAnswers
// '''''''''''''''''''''''''


// '''''''''''''''''''''''''
 B61Insert1Answer() {
if (answer(i) < "1" Or answer(i) > "8") {
return  //'extra comman in form field causes an extra blank answer. ignore it.
}

if (txid(i) < 1 Or txid(i) > 99999) {
  ERRMSG = "Trouble setting Answer for a saved Question. Please sign-on."
  qfun = "SIGNON"
  SDONE = true
  return
}


// 'Aug 2011 look for a dup before storing answer:
Dim strSQL15 As String
strSQL15 = "SET ROWCOUNT 0 SELECT COUNT(*) AS myAnsCount FROM qx1answers" _
& " WHERE  qx1answers.qid      = " & QID _
& " AND  qx1answers.quser_id = " & QUSER_ID _
& " AND ( datediff(day,test_date,qx1answers.Test_Date)) = 0 " _
& " AND  qx1answers.QUEST_ID = "  & txid(i)  

'& " AND  qx1answers.Test_Date = " & TEST_DATE _
 Dim objCommand15 As New SqlCommand(strSQL15, objConn)
  objCommand15.Transaction = objTran
  Dim dr15 As SqlDataReader
  dr15 = objCommand15.ExecuteReader()
  While dr15.Read()
    AK = dr15("myAnsCount")
  End While
  dr15.Close()
  if (AK === 0)
  // 'This question has not yet been answered
  Dim strSQL As String
  strSQL = "INSERT INTO qx1answers " _
   & " (QID,TEST_DATE,QUSER_ID,QUEST_ID,ANSWER,TIME_GAP) " _
   & "VALUES (" _
   & "'" & QID & "'," _
   & "'" & TEST_DATE & "'," _
   & "'" & QUSER_ID & "'," _
   & "'" & txid(i) & "'," _
   & "'" & answer(i) & "'," _
   & "'" & elap(i) & "' ) "

  Dim objCommand As New SqlCommand(strSQL, objConn)
  objCommand.Transaction = objTran
  objCommand.ExecuteNonQuery()
}
// 'End Aug 2011

PRIORQ = txid(i)
QA = QA + 1

 } // End B61Insert1Answer
// '''''''''''''''''''''''''


// '''''''''''''''''''''''''
B7Next20Questions() {

 if (answer Is Nothing And PRIORQ > 0) {  //'he has re-started.
  B70RegainCurrPriorq()  //' find last-of-20 previous quests. we need
}                   //' the seq from priorq, which is the last-of-20.
//' If this is not a restart, then priorq is already set from b5.

B21SetSubsetKeyList()
B22SetCor_Ans_Thresh()
SEQ = pad(SEQ)
PRIORQ = pad(PRIORQ)

// '* PRIORQ is the quest rec THAT IS THE last-OF-20, PREVIOUSLY answered
Dim strSQL As String
strSQL = "SET ROWCOUNT 0 SELECT TOP 20 * FROM qx1quest WHERE qid = " & QID _
  & " AND (str(seq,4) + str(quest_id,4)) > " _
  & "'" & SEQ & PRIORQ & "'" _
  & " AND subset   IN " & SUBSETKEYLIST _
  & " AND cor_ans < " & Cor_Ans_Thresh _
  & " ORDER BY qid, seq, quest_id "

Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr2 As SqlDataReader
dr2 = objCommand.ExecuteReader()

i = 0
While dr2.Read()
  if (i === 0) {
      FQNBR = dr2("quest_id")
      CURRQ = dr2("quest_id")
    }
    tquest(i) = dr2("quest")
    B71setquest()
    if (dquest(i) > " ") {
      tans(i) = dquest(i)
    } else {
      tans(i) = dr2("answer_dt")
    }
    B72settans()
    tqstyle(i) = dr2("qstyle")
    B73setqstyle()
    i = i + 1
    LQNBR = dr2("quest_id")
    SEQ = dr2("seq")
End While
dr2.Close()


if (i > 0) {
  SDONE = true  //'there is at least one question to ask him, so we will stop this pgm after B7.
  qfun = "QUEST"
}

} // End B7Next20Questions
// ''''''''''''''''''''''''''

// ''''''''''''''''''''''''''
B70RegainCurrPriorq() {  //'we just need the seq nbr of priorq.
Dim strSQL As String   //'this para called when he restarts halfway thru.
strSQL = "SET ROWCOUNT 1 SELECT * FROM qx1quest WHERE qid = " & QID _
  & " AND quest_id = " & "'" & PRIORQ & "'"

Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr7 As SqlDataReader
dr7 = objCommand.ExecuteReader()

QUEST_FOUND = false
While dr7.Read()
  SEQ = dr7("seq")
  QUEST_FOUND = true
End While
dr7.Close()

if (QUEST_FOUND === false) {
  qfun = "SIGNON"
  ERRMSG = "Trouble Re-Finding prior question asked. Please sign on."
  SDONE = true
  return
}

} //End B70RegainCurrPriorq
// ''''''''''''''''''''''''''

// ''''''''''''''''''''''''''''''''''''''''''''''
B71setquest() { //'format database question field into multiple memvars
Dim x As String = tquest(i)
Dim aquest() As String
Dim j As Integer
if Microsoft.VisualBasic.InStr(x, "}") === 0 {
  x = "}" & x
}
if Microsoft.VisualBasic.InStr(x, "[") === 0 {
  x = x & "["
}
x = x.Replace("}", "|")
x = x.Replace("{", "")
x = x.Replace("[", "|")
x = x.Replace("]", "")
aquest = x.Split("|") //'builds an array of 3 elements
pquest(i) = Microsoft.VisualBasic.Trim(aquest(0))
tquest(i) = Microsoft.VisualBasic.Trim(aquest(1))
dquest(i) = Microsoft.VisualBasic.Trim(aquest(2))
} // End B71setquest
// ''''''''''''''''''''''''''''''''''''''''''''''


// ''''''''''''''''''''''''''
B72settans() { //'re-arrange tans answer choices into a 200 chr string
Dim x As String = tans(i)
Dim desc200 As String
Dim desc() As String
Dim j As Integer
x = x.Replace("  ", "|")
'x = x.Replace("   ","|")  'was 3 blanks, try 2 blanks
desc = x.Split("|") //'builds an array
For j = 0 To desc.GetUpperBound(0)
  if desc(j) > " " {
    desc200 = desc200 & Microsoft.VisualBasic.LSet(desc(j), 40)
}
Next
tans(i) = desc200

// ' set desca descb desc
For j = 0 To desc.GetUpperBound(0)
  if (desc(j) > " ") {
  if (tdesca(i) <= " ") {
      tdesca(i) = desc(j)
    } else {
      if (tdescb(i) <= " ") {
        tdescb(i) = desc(j)
    } else {
      if (tdescc(i) <= " ") {
          tdescc(i) = desc(j)
        }
    }
}
}
Next
} // end B72settans
// ''''''''''''''''''''''''''''''''''''


// '''''''''''''''''''''''''
B73setqstyle() {
  if (tqstyle(i) === "  ") {
    tqstyle(i) = "S8"
}
} // End B73setqstyle
// '''''''''''''''''''''''''


// '''''''''''''''''''''''''''''''
B9ChkFinish()  { //'SHOW BREAK OR FINISH

if (SUBSETKEYS === "MAIN") { //'WE WERE ASKING THE MAIN SUBSET, NO MORE MAIN QUESTIONS
  qfun = "BREAK"
  INTBRKFINKEY = "BREAK"
} else {
  qfun = "FINISH"
  INTBRKFINKEY = "FINISH"
  ERRMSG = "100% complete."
  GOBUTVAL = "Close"  //'qt120 jscript uses this for onclick
}

A33SetIntBrkFin()

FQNBR = 0
LQNBR = 0

if (qfun === "FINISH") {
  B1SumAnswers()      //'APPENDS TO SCORES FILE
  D2SendEmail2()
}

SDONE = true
} // End B9ChkFinish
// '''''''''''''''''''''''''''''''


// ''''''''''''''''''''''''''''''''''''
C1SaveQuser() {

// 'WE ARE GETTING READY TO QUIT, SO SAVE THE CURRENT MEMVARS IN QUSER table
// 'SO THAT WE CAN RETRIEVE THEM NEXT TIME WE ARE CALLED.
QUSER_FOUND = false

if (FNAME <= " ") {
//   Return   '&& HE HAS NOT SIGNED ON YET, SO WE CANT SAVE HIS STATE.
}

if (qfun === "BREAK") {
  PRIORQ = 0  //'BREAK IS LIKE STARTING OVER, CUZ THERE WILL BE DIFFERNT SUBSETKEYS.
//   ' ITS GOOD TO RESET THIS HERE , SO THAT IF WE HAVE ANY TROUBLES, THE TEST WILL START OVER AT
//   ' THE BEGINNING OF THE FOLLOW-ON SUBSETS, USING THIS USER'S LIST OF SUBSETKEYS.
}

Dim strSQL As String
strSQL = "SET ROWCOUNT 1 SELECT * FROM qx1quser WHERE quser_id = " & "'" & QUSER_ID & "'"
Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
Dim dr3 As SqlDataReader
dr3 = objCommand.ExecuteReader()

While dr3.Read()
  QUSER_FOUND = true
End While
dr3.Close()


if (QUSER_FOUND === true) {
  C12UpdateQuser()
} else {
 C11InsertQuser()
}

objTran.Commit()
} // End C1SaveQuser
// ''''''''''''''''''''''''''''''''''''


// ''''''''''''''''''''''''''''''''''''
C11InsertQuser() {
FNAMEx = FNAME.Replace("'", "''")
LNAMEx = LNAME.Replace("'", "''")
COMPANYx = COMPANY.Replace("'", "''")
Dim strSQL As String
strSQL = "INSERT INTO qx1quser " _
 & " (FNAME,LNAME,QFUN,QID,PRIORQ,CURRQ,TEST_DATE,COMPANY,SUBSETKEYS,QA,QS) " _
 & "VALUES (" _
 & "'" & FNAMEx & "'," _
 & "'" & LNAMEx & "'," _
 & "'" & qfun & "'," _
 & "'" & QID & "'," _
 & "'" & PRIORQ & "'," _
 & "'" & CURRQ & "'," _
 & "'" & NOW & "'," _
 & "'" & COMPANYx & "'," _
 & "'" & SUBSETKEYS & "'," _
 & "'" & QA & "'," _
 & "'" & QS & "' ) "

Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
objCommand.ExecuteNonQuery()
} // End C11InsertQuser
// ''''''''''''''''''''''''''''''''''''

// ''''''''''''''''''''''''''''''''''''
C12UpdateQuser(){
FNAMEx = FNAME.Replace("'", "''")
LNAMEx = LNAME.Replace("'", "''")
COMPANYx = COMPANY.Replace("'", "''")
Dim strSQL As String
strSQL = "UPDATE qx1quser SET " _
 & "  FNAME      = " & "'" & FNAMEx & "'," _
 & "  LNAME      = " & "'" & LNAMEx & "'," _
 & "  TEST_DATE  = " & "'" & NOW & "'," _
 & "  QFUN       = " & "'" & qfun & "'," _
 & "  QID        = " & "'" & QID & "'," _
 & "  PRIORQ     = " & "'" & PRIORQ & "'," _
 & "  CURRQ      = " & "'" & CURRQ & "'," _
 & "  COMPANY    = " & "'" & COMPANYx & "'," _
 & "  SUBSETKEYS = " & "'" & SUBSETKEYS & "'," _
 & "  QA         = " & "'" & QA & "'," _
 & "  QS         = " & "'" & QS & "'" _
 & " WHERE QUSER_ID  = " & "'" & QUSER_ID & "'"


Dim objCommand As New SqlCommand(strSQL, objConn)
objCommand.Transaction = objTran
objCommand.ExecuteNonQuery()

} End C12UpdateQuser
// ''''''''''''''''''''''''''''''''''''


// ''''''''''''''''''''''''''''''''''''
D1Merge() {

Dim myHtmFile As String

if (qfun === "SIGNON") {
  myHtmFile = "qt110.htm"
}

        // 'IF Microsoft.VisualBasic.InStr(Request.ServerVariables("PATH_INFO"), "bridgestreet")  > 0 
        // '  If qfun = "SIGNON"
        // '   myHtmFile = "qt105.htm"
        // '  }
        // '}


If (qfun === "QUEST") {
  myHtmFile = "qt190.htm"
}

if (qfun === "INTRO" Or qfun === "BREAK" Or qfun === "FINISH") {
  myHtmFile = "qt120.htm"
}

// 'Open the HTM file for reading
 Dim FILENAME As String = Server.MapPath(myHtmFile)
// 'Get a StreamReader class that can be used to read the file
Dim objStreamReader As StreamReader
objStreamReader = File.OpenText(FILENAME)

// 'Now, read the entire file into a string
Dim ho As String = objStreamReader.ReadToEnd()
objStreamReader.Close()

// ' Set outbound hidden form fields from memvars:
WFNAME.Text = FNAME
WLNAME.Text = LNAME
WQUSER_ID.Text = QUSER_ID
WCOMPANY.Text = COMPANY
WFQNBR.Text = FQNBR
WLQNBR.Text = LQNBR
WQID.Text = QID
WREFER.Text = QREFER
WANSWERS.Text = "" //'reset ANSWERS
WELAPSED.Text = "" //'reset ELAPSED

  ho = ho.Replace("<<errmsg>>", ERRMSG)
  ho = ho.Replace("<<fname>>", FNAME)
  ho = ho.Replace("<<lname>>", LNAME)
  ho = ho.Replace("<<company>>", COMPANY)

  ho = ho.Replace("<<qid>>", QID)
  ho = ho.Replace("<<qtitle>>", QTITLE)
  ho = ho.Replace("<<coCaption>>", COCAPTION)
  ho = ho.Replace("<<GoButVal>>", GOBUTVAL)
  ho = ho.Replace("<<quest>>", QUEST)

  ho = ho.Replace("<<questf1>>", tquest(0))
  ho = ho.Replace("<<questf2>>", tquest(1))
  ho = ho.Replace("<<questf3>>", tquest(2))
  ho = ho.Replace("<<questf4>>", tquest(3))
  ho = ho.Replace("<<questf5>>", tquest(4))
  ho = ho.Replace("<<questf6>>", tquest(5))
  ho = ho.Replace("<<questf7>>", tquest(6))
  ho = ho.Replace("<<questf8>>", tquest(7))
  ho = ho.Replace("<<questf9>>", tquest(8))
  ho = ho.Replace("<<questf10>>", tquest(9))
  ho = ho.Replace("<<questf11>>", tquest(10))
  ho = ho.Replace("<<questf12>>", tquest(11))
  ho = ho.Replace("<<questf13>>", tquest(12))
  ho = ho.Replace("<<questf14>>", tquest(13))
  ho = ho.Replace("<<questf15>>", tquest(14))
  ho = ho.Replace("<<questf16>>", tquest(15))
  ho = ho.Replace("<<questf17>>", tquest(16))
  ho = ho.Replace("<<questf18>>", tquest(17))
  ho = ho.Replace("<<questf19>>", tquest(18))
  ho = ho.Replace("<<questf20>>", tquest(19))

  ho = ho.Replace("<<tpquest1>>", pquest(0))
  ho = ho.Replace("<<tpquest2>>", pquest(1))
  ho = ho.Replace("<<tpquest3>>", pquest(2))
  ho = ho.Replace("<<tpquest4>>", pquest(3))
  ho = ho.Replace("<<tpquest5>>", pquest(4))
  ho = ho.Replace("<<tpquest6>>", pquest(5))
  ho = ho.Replace("<<tpquest7>>", pquest(6))
  ho = ho.Replace("<<tpquest8>>", pquest(7))
  ho = ho.Replace("<<tpquest9>>", pquest(8))
  ho = ho.Replace("<<tpquest10>>", pquest(9))
  ho = ho.Replace("<<tpquest11>>", pquest(10))
  ho = ho.Replace("<<tpquest12>>", pquest(11))
  ho = ho.Replace("<<tpquest13>>", pquest(12))
  ho = ho.Replace("<<tpquest14>>", pquest(13))
  ho = ho.Replace("<<tpquest15>>", pquest(14))
  ho = ho.Replace("<<tpquest16>>", pquest(15))
  ho = ho.Replace("<<tpquest17>>", pquest(16))
  ho = ho.Replace("<<tpquest18>>", pquest(17))
  ho = ho.Replace("<<tpquest19>>", pquest(18))
  ho = ho.Replace("<<tpquest20>>", pquest(19))

  ho = ho.Replace("<<tans1>>", tans(0))
  ho = ho.Replace("<<tans2>>", tans(1))
  ho = ho.Replace("<<tans3>>", tans(2))
  ho = ho.Replace("<<tans4>>", tans(3))
  ho = ho.Replace("<<tans5>>", tans(4))
  ho = ho.Replace("<<tans6>>", tans(5))
  ho = ho.Replace("<<tans7>>", tans(6))
  ho = ho.Replace("<<tans8>>", tans(7))
  ho = ho.Replace("<<tans9>>", tans(8))
  ho = ho.Replace("<<tans10>>", tans(9))
  ho = ho.Replace("<<tans11>>", tans(10))
  ho = ho.Replace("<<tans12>>", tans(11))
  ho = ho.Replace("<<tans13>>", tans(12))
  ho = ho.Replace("<<tans14>>", tans(13))
  ho = ho.Replace("<<tans15>>", tans(14))
  ho = ho.Replace("<<tans16>>", tans(15))
  ho = ho.Replace("<<tans17>>", tans(16))
  ho = ho.Replace("<<tans18>>", tans(17))
  ho = ho.Replace("<<tans19>>", tans(18))
  ho = ho.Replace("<<tans20>>", tans(19))

  ho = ho.Replace("<<tqstyle1>>", tqstyle(0))
  ho = ho.Replace("<<tqstyle2>>", tqstyle(1))
  ho = ho.Replace("<<tqstyle3>>", tqstyle(2))
  ho = ho.Replace("<<tqstyle4>>", tqstyle(3))
  ho = ho.Replace("<<tqstyle5>>", tqstyle(4))
  ho = ho.Replace("<<tqstyle6>>", tqstyle(5))
  ho = ho.Replace("<<tqstyle7>>", tqstyle(6))
  ho = ho.Replace("<<tqstyle8>>", tqstyle(7))
  ho = ho.Replace("<<tqstyle9>>", tqstyle(8))
  ho = ho.Replace("<<tqstyle10>>", tqstyle(9))
  ho = ho.Replace("<<tqstyle11>>", tqstyle(10))
  ho = ho.Replace("<<tqstyle12>>", tqstyle(11))
  ho = ho.Replace("<<tqstyle13>>", tqstyle(12))
  ho = ho.Replace("<<tqstyle14>>", tqstyle(13))
  ho = ho.Replace("<<tqstyle15>>", tqstyle(14))
  ho = ho.Replace("<<tqstyle16>>", tqstyle(15))
  ho = ho.Replace("<<tqstyle17>>", tqstyle(16))
  ho = ho.Replace("<<tqstyle18>>", tqstyle(17))
  ho = ho.Replace("<<tqstyle19>>", tqstyle(18))
  ho = ho.Replace("<<tqstyle20>>", tqstyle(19))

  ho = ho.Replace("<<tdesca1>>", tdesca(0))
  ho = ho.Replace("<<tdesca2>>", tdesca(1))
  ho = ho.Replace("<<tdesca3>>", tdesca(2))
  ho = ho.Replace("<<tdesca4>>", tdesca(3))
  ho = ho.Replace("<<tdesca5>>", tdesca(4))
  ho = ho.Replace("<<tdesca6>>", tdesca(5))
  ho = ho.Replace("<<tdesca7>>", tdesca(6))
  ho = ho.Replace("<<tdesca8>>", tdesca(7))
  ho = ho.Replace("<<tdesca9>>", tdesca(8))
  ho = ho.Replace("<<tdesca10>>", tdesca(9))
  ho = ho.Replace("<<tdesca11>>", tdesca(10))
  ho = ho.Replace("<<tdesca12>>", tdesca(11))
  ho = ho.Replace("<<tdesca13>>", tdesca(12))
  ho = ho.Replace("<<tdesca14>>", tdesca(13))
  ho = ho.Replace("<<tdesca15>>", tdesca(14))
  ho = ho.Replace("<<tdesca16>>", tdesca(15))
  ho = ho.Replace("<<tdesca17>>", tdesca(16))
  ho = ho.Replace("<<tdesca18>>", tdesca(17))
  ho = ho.Replace("<<tdesca19>>", tdesca(18))
  ho = ho.Replace("<<tdesca20>>", tdesca(19))

  ho = ho.Replace("<<tdescb1>>", tdescb(0))
  ho = ho.Replace("<<tdescb2>>", tdescb(1))
  ho = ho.Replace("<<tdescb3>>", tdescb(2))
  ho = ho.Replace("<<tdescb4>>", tdescb(3))
  ho = ho.Replace("<<tdescb5>>", tdescb(4))
  ho = ho.Replace("<<tdescb6>>", tdescb(5))
  ho = ho.Replace("<<tdescb7>>", tdescb(6))
  ho = ho.Replace("<<tdescb8>>", tdescb(7))
  ho = ho.Replace("<<tdescb9>>", tdescb(8))
  ho = ho.Replace("<<tdescb10>>", tdescb(9))
  ho = ho.Replace("<<tdescb11>>", tdescb(10))
  ho = ho.Replace("<<tdescb12>>", tdescb(11))
  ho = ho.Replace("<<tdescb13>>", tdescb(12))
  ho = ho.Replace("<<tdescb14>>", tdescb(13))
  ho = ho.Replace("<<tdescb15>>", tdescb(14))
  ho = ho.Replace("<<tdescb16>>", tdescb(15))
  ho = ho.Replace("<<tdescb17>>", tdescb(16))
  ho = ho.Replace("<<tdescb18>>", tdescb(17))
  ho = ho.Replace("<<tdescb19>>", tdescb(18))
  ho = ho.Replace("<<tdescb20>>", tdescb(19))

  ho = ho.Replace("<<tdescc1>>", tdescc(0))
  ho = ho.Replace("<<tdescc2>>", tdescc(1))
  ho = ho.Replace("<<tdescc3>>", tdescc(2))
  ho = ho.Replace("<<tdescc4>>", tdescc(3))
  ho = ho.Replace("<<tdescc5>>", tdescc(4))
  ho = ho.Replace("<<tdescc6>>", tdescc(5))
  ho = ho.Replace("<<tdescc7>>", tdescc(6))
  ho = ho.Replace("<<tdescc8>>", tdescc(7))
  ho = ho.Replace("<<tdescc9>>", tdescc(8))
  ho = ho.Replace("<<tdescc10>>", tdescc(9))
  ho = ho.Replace("<<tdescc11>>", tdescc(10))
  ho = ho.Replace("<<tdescc12>>", tdescc(11))
  ho = ho.Replace("<<tdescc13>>", tdescc(12))
  ho = ho.Replace("<<tdescc14>>", tdescc(13))
  ho = ho.Replace("<<tdescc15>>", tdescc(14))
  ho = ho.Replace("<<tdescc16>>", tdescc(15))
  ho = ho.Replace("<<tdescc17>>", tdescc(16))
  ho = ho.Replace("<<tdescc18>>", tdescc(17))
  ho = ho.Replace("<<tdescc19>>", tdescc(18))
  ho = ho.Replace("<<tdescc20>>", tdescc(19))

// ' Change the logo <img> depending on COMPANYsfx default is Digital Couch.gif
// 'If COMPANYsfx = "VCS" Then
// '  ho = ho.Replace("Digital Couch.gif", "VCSlogo.jpg")
// '}
// 'If COMPANYsfx = "PON" Then
// '  ho = ho.Replace("Digital Couch.gif", "1grey.jpg")
// '}

  lblStreamOUt.Text = ho
} // End D1Merge
// ''''''''''''''''
D1Px() {
  pw = pw.Replace("s", "l")
  pw = pw.Replace("r", "o")
  pw = pw.Replace("p", "f")
  pw = pw.Replace("k", "g")
} // End D1Px

// ''''''''''''''''
// Sub D2SendEmail_old_do_not_use()
// 'SmtpMail.SmtpServer = "mail.webhost4life.com"
// ''''SmtpMail.SmtpServer = "server143.mysite4now.com"
// SmtpMail.SmtpServer = "mail.asp3147.mysite4now.com"
// SmtpMail.SmtpServer = "server362.mysite4now.com"
// SmtpMail.SmtpServer = "mail.flyredsky.com"

// 'SmtpMail.Send ("jc@logdog.net"   , "bill8@wmis.net", _
// 'SmtpMail.Send ("jc@logdog.net"   , "murray17@iserv.net", _
// 'SmtpMail.Send ("flatbill@netzero.net"   , "edmurray17@comcast.net", _
// 'SmtpMail.Send ("flatbill@netzero.net"   , "edbill17@yahoo.com", _

// 'SmtpMail.Send ("postmaster@mbydesign.com"   , "edbill17@yahoo.com", _


// 'SmtpMail.Send ("postmaster@mysite4now.com"   , "edbill17@yahoo.com", _
// 'SmtpMail.Send("automail@digital-couch.com", "edmurray17@comcast.net", _
// 'SmtpMail.Send("webmaster@flyredsky.com", "webmaster@flyredsky.com", _
// 'SmtpMail.Send("webmaster@flyredsky.com", "edmurray17@comcast.net", _
// SmtpMail.Send("webmaster@flyredsky.com", "flatbill@netzero.net", _
//   FNAME & " " & LNAME & " finished Digital Couch", _
//   "Automatic email message sent from Digital Couch")
// End Sub


// ''''''''''''''''
D2SendEmail2() {
Dim ObjSendMail
ObjSendMail = CreateObject("CDO.Message")
    
// 'This section provides the configuration information for the remote SMTP server.
    
// ObjSendMail.Configuration.Fields.Item ("http://schemas.microsoft.com/cdo/configuration/sendusing") = 2 'Send the message using the network (SMTP over the network).
// ObjSendMail.Configuration.Fields.Item ("http://schemas.microsoft.com/cdo/configuration/smtpserver") ="mail.flyredsky.com"
// ObjSendMail.Configuration.Fields.Item ("http://schemas.microsoft.com/cdo/configuration/smtpserverport") = 25
// ObjSendMail.Configuration.Fields.Item ("http://schemas.microsoft.com/cdo/configuration/smtpusessl") = False 'Use SSL for the connection (True or False)
// ObjSendMail.Configuration.Fields.Item ("http://schemas.microsoft.com/cdo/configuration/smtpconnectiontimeout") = 60
    
// ' If your server requires outgoing authentication uncomment the lines bleow and use a valid email address and password.
// ObjSendMail.Configuration.Fields.Item ("http://schemas.microsoft.com/cdo/configuration/smtpauthenticate") = 1 'basic (clear-text) authentication
// ObjSendMail.Configuration.Fields.Item ("http://schemas.microsoft.com/cdo/configuration/sendusername") ="webmaster@flyredsky.com"
// ObjSendMail.Configuration.Fields.Item ("http://schemas.microsoft.com/cdo/configuration/sendpassword") ="forgot"
    
// ObjSendMail.Configuration.Fields.Update
    
// 'End remote SMTP server configuration section==
    
// 'ObjSendMail.To = "flatbill@netzero.net"   'June2011 experiments
// ObjSendMail.To = "edmurray17@comcast.net"

// ObjSendMail.Subject = FNAME & " " & LNAME & " finished Digital Couch"
// ObjSendMail.From = "aaa@digital-couch.com"
    
// ' we are sending a text email.. simply switch the comments around to send an html email instead
// 'ObjSendMail.HTMLBody = "this is the body"
// ObjSendMail.TextBody = "Automatic email message sent from Digital Couch"
    
// ObjSendMail.Send
    
// ObjSendMail = Nothing 
} // End D2SendEmail2


// ''''''''''''''''
Function pad(ByVal inText) { As String //'convert a string to 4 big
Dim outText As String
outText = "    " & inText
if (inText.length === 1) {
  outText = "   " & inText
}
if (inText.length === 2) {
  outText = "  " & inText
}
if (inText.length === 3) {
  outText = " " & inText
}
if (inText.length === 4) {
  outText = inText
}
return outText
} // End pad
// ''''''''''''''''

//End Class


// ' Here is an example to run in sql-query-analyzer to update all recs setting colum qstyle to s8
// 'UPDATE qx1quest
// 'SET qstyle = 'S8'

// 'UPDATE qx1quest
// 'SET QSTYLE = 'V'
// 'where quest like ('%]%')
