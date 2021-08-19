
let myFaunaCollection = 'qtSubsets'
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
  console.log('Netlify Function qtReadSubsets invoked.')
  console.log('here is qtReadSubsets event:', event)
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  
  let myFaunaFetchQuests = 'classes/' + myFaunaCollection + '/'
  return client.query(q.Paginate(q.Match(q.Index('qtSubsetsX1'), [myCust,myQid] )))
    .then((response) => {
    const qtSubsetsRefs = response.data
    console.log('qtSubsets refs', qtSubsetsRefs)
    console.log(`${qtSubsetsRefs.length} qtSubsets found`)
    const getAllqtSubsetsDataQuery = qtSubsetsRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtSubsetsDataQuery).then((ret) => {
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