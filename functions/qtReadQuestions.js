
let myFaunaCollection = 'qtQuestions'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

exports.handler = (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  //const id = getIdInline(event.path)
  const myCust = event.queryStringParameters.cust ;
  const myQid = event.queryStringParameters.qid ;

  console.log('Netlify Function qtReadQuestions invoked.')
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  
  let myFaunaFetchQuests = 'classes/' + myFaunaCollection + '/'
  //return client.query(q.Paginate(q.Match(q.Ref('indexes/qtQuestionsX1'))))
  return client.query(q.Paginate(q.Match(q.Index('qtQuestionsX1'),[myCust,myQid]),{ size: 500 }))
    .then((response) => {
    const qtQuestionsRefs = response.data
    console.log('qtQuestions refs', qtQuestionsRefs)
    console.log(`${qtQuestionsRefs.length} qtQuestions found`)
    const getAllqtQuestionsDataQuery = qtQuestionsRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtQuestionsDataQuery).then((ret) => {
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
function getIdInline(urlPath) {
  console.log(`Running getIdInline from Netlify Function 'qtRead03' . urlPath: ${urlPath}`)

  return urlPath.match(/([^\/]*)\/*$/)[0]
}