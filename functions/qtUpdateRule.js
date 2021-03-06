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
  let mySubset = 'main'   
  let myAccum = 'accum01'   

  /* parse the string body input into a useable JS object */
  const data = JSON.parse(event.body)
  console.log('Function qtUpdateQuestion invoked. data: ', data)
  myCust     = data.cust
  myQid      = data.qid
  myRuleNbr  = data.ruleNbr
  // mySubset   = data.subset
  // myAccum    = data.accum
  let queryResult1 = await client.query
 // (q.Get(q.Match(q.Index('qtRulesX2'),[myCust,myQid,mySubset,myAccum])))
  (q.Get(q.Match(q.Index('qtRulesX2'),[myCust,myQid,myRuleNbr])))
  console.log('pgm change 10/6/2021 7:31')
  console.log('queryResult1.ref: ')
  console.log(queryResult1.ref)

   const ruleAdelic = {
     data: data 
   }
  
  /* construct the fauna query */
  return client.query(q.Update(q.Ref(queryResult1.ref),ruleAdelic))
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
