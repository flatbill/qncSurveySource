
let myFaunaCollection = 'qtAnswers'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

exports.handler = async (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  const myCust = '1' //event.queryStringParameters.cust 
  const myQid = '1' //event.queryStringParameters.qid 
  console.log('myCust:',myCust)
  console.log('myQid:',myQid)
  console.log('Netlify Function qtMassDeleteQuestions invoked.')
  console.log('here is qtMassDeleteQuestions event:', event)
  //
// construct batch query from a list of Ids

let refs = await client.query
(q.Paginate(q.Match(q.Index('qtQuestionsX1'),[myCust,myQid]))  )
console.log('ready to build list Of Ids...')
let listOfIds = refs.data.map((r) => r.id)
console.log('list of Ids length: ', listOfIds.length)
const deleteAllQuery = listOfIds.map((idd) => {
   return q.Delete(q.Ref(`classes/qtQuestions/${idd}`))
})
  return client.query(deleteAllQuery)
    .then((response) => {
      console.log('running .then of qtMassDeleteQuestions')
      return {
        statusCode: 200,
        headers: {'Access-Control-Allow-Origin': '*'},
        body: JSON.stringify(response)
      }
    })
   .catch((error) => {
    console.log('error running qtDeleteAllAnswers', error)
    return {
      statusCode: 400,
      body: JSON.stringify(error)
    }
  })  
}
