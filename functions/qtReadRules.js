
let myFaunaCollection = 'qtRules'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

exports.handler = async (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  const myCust = event.queryStringParameters.cust ;
  const myQid = event.queryStringParameters.qid ;
  console.log('myCust:',myCust)
  console.log('myQid:',myQid)
  console.log('Netlify Function qtReadRules invoked.')
  console.log('here is qtReadRules event:', event)
  // let custAndQid = myCust + myQid
  let myFaunaFetchQuests = 'classes/' + myFaunaCollection + '/'
  return client.query(q.Paginate(q.Match(q.Index('qtRulesX1'), [myCust,myQid] )))
    .then((response) => {
    const qtRulesRefs = response.data
    console.log('qtRules refs', qtRulesRefs)
    console.log(`${qtRulesRefs.length} qtRules found`)
    const getAllqtRulesDataQuery = qtRulesRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtRulesDataQuery).then((ret) => {
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
