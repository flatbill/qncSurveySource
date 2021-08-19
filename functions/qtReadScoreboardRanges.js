
let myFaunaCollection = 'qtScoreboardRanges'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

exports.handler = async (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  const myQid = event.queryStringParameters.qid 
  const myCust = event.queryStringParameters.cust 
  console.log('myQid:',myQid)
  console.log('myQid:',myCust)
  console.log('Netlify Function qtReadScoreboardRanges invoked.')
  console.log('here is qtReadScoreboardRanges event:', event)
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  
  let myFaunaFetchQuests = 'classes/' + myFaunaCollection + '/'
  return client.query(q.Paginate(q.Match(q.Index('qtScoreboardRangesX1'), [myCust,myQid] )))
    .then((response) => {
    const qtScoreboardRangesRefs = response.data
    console.log('qtScoreboardRanges refs', qtScoreboardRangesRefs)
    console.log(`${qtScoreboardRangesRefs.length} qtScoreboardRanges found`)
    const getAllqtScoreboardRangesDataQuery = qtScoreboardRangesRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtScoreboardRangesDataQuery).then((ret) => {
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
//   console.log(`Running getIdInline from Netlify Function . urlPath: ${urlPath}`)

//   return urlPath.match(/([^\/]*)\/*$/)[0]
// }