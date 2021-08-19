
let myFaunaCollection = 'qtRules'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

exports.handler = async (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  const myCust = event.queryStringParameters.cust 
  const myQid = event.queryStringParameters.qid 
  console.log('myCust:',myCust)
  console.log('myQid:',myQid)
  console.log('Netlify Function qtDeleteAllRules invoked.')
  console.log('here is qtDeleteAllRules event:', event)
// construct batch query from a list of Ids

let refs = await client.query
  (q.Paginate(q.Match(q.Index('qtRulesX1'),[myCust,myQid]))
  )
let listOfIds = refs.data.map((r) => r.id)
 const deleteAllQuery = listOfIds.map((idd) => {
   return q.Delete(q.Ref(`classes/qtRules/${idd}`))
})
  return client.query(deleteAllQuery)
    .then((response) => {
      console.log('running .then of qtDeleteAllRules')
      return {
        statusCode: 200,
        headers: {'Access-Control-Allow-Origin': '*'},
        body: JSON.stringify(response)
      }
    })
   .catch((error) => {
    console.log('error running qtDeleteAllRules', error)
    return {
      statusCode: 400,
      body: JSON.stringify(error)
    }
  })  
}
