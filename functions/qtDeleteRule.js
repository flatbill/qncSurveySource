/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

/* export our lambda function as named "handler" export */
exports.handler = async (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  })  
  let myCust = "1" //event.queryStringParameters.cust 
  let myQid = "1" //event.queryStringParameters.qid 
  let mySubset = 'iqFollowOn'   
  let myAccum = 'iqAccum'   

  /* parse the string body input into a useable JS object */
  const dataIn = JSON.parse(event.body)
  console.log('Function qtDeleteRule invoked. dataIn: ', dataIn)
  myCust     = dataIn.cust
  myQid      = dataIn.qid
  myRuleNbr  = dataIn.ruleNbr
  // mySubset   = dataIn.subset
  // myAccum    = dataIn.accum
  //(q.Match(q.Index('qtQuestionsX2'),[myCust,myQid,myQuestNbr]))
  let queryResult1 = await client.query
  //(q.Get(q.Match(q.Index('qtRulesX2'),[myCust,myQid,mySubset,myAccum])))
  (q.Get(q.Match(q.Index('qtRulesX2'),[myCust,myQid,myRuleNbr])))
  console.log('pgm change 10/6/2021 07:54')
  console.log('queryResult1.ref: ')
  console.log(queryResult1.ref)

  // const questionAdelic = {
  //   data: data //not used for this function
  // }
  
  /* construct the fauna query */
  return client.query(q.Delete(q.Ref(queryResult1.ref)))
    .then((response) => {
      console.log('success', response)
      /* Success! return the response with statusCode 200 */
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*' 
        //  'Access-Control-Allow-Origin': 'http://localhost:4200' 
        // netlify allows only one allow-origin.  
        // this wrecks the query string fetch.
        // so, I set this to '*' which is hopefully temp,
        // until I can figure it out.
        },
        body: JSON.stringify(response)
      }
    }).catch((error) => {
      console.log('error', error)
      /* Error! return the error with statusCode 400 */
      return {
        statusCode: 400,
        body: JSON.stringify(error)
      }
    })
}
