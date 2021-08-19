
let myFaunaCollection = 'qtAnswers'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

exports.handler = (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  const myCust = event.queryStringParameters.cust 
  const myQid = event.queryStringParameters.qid 
  const myUserId = event.queryStringParameters.userId 
  //const myUserDateTime = event.queryStringParameters.userDateTime 

  console.log('Netlify Function qtReadAnswers invoked.')
  console.log(myCust,myQid,myUserId)
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  
  let myFaunaFetchAnswers = 'classes/' + myFaunaCollection + '/'
  //return client.query(q.Paginate(q.Match(q.Ref('indexes/qtAnswersX1'))))
  return client.query(q.Paginate(q.Match(q.Index('qtAnswersX2'),[myCust,myQid,myUserId]),{ size: 500 }))
    .then((response) => {
    const qtAnswersRefs = response.data
    console.log('qtAnswers refs', qtAnswersRefs)
    console.log(`${qtAnswersRefs.length} qtAnswers found`)
    const getAllqtAnswersDataQuery = qtAnswersRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtAnswersDataQuery).then((ret) => {
      return {
        statusCode: 200,
        headers: {'Access-Control-Allow-Origin': '*'},
        body: JSON.stringify(ret)
      }
    })
  }).catch((error) => {
    console.log('error', error)
    return {
      statusCode: 400,
      body: JSON.stringify(error)
    }
  })  
}

// function getIdInline(urlPath) {
//   console.log(`Running getIdInline from Netlify Function 'qtRead03' . urlPath: ${urlPath}`)
//   return urlPath.match(/([^\/]*)\/*$/)[0]
// }