
let myFaunaCollection = 'qtUser'
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
  const myUser = event.queryStringParameters.user

  console.log('Netlify Function qtReadUser invoked.')
  console.log(myCust,myQid,myUser)
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  
  let myFaunaFetchUser = 'classes/' + myFaunaCollection + '/'
  //return client.query(q.Paginate(q.Match(q.Ref('indexes/qtAnswersX1'))))
  return client.query(q.Paginate(q.Match(q.Index('qtUsersX2'),[myCust,myQid,myUser]),{ size: 10 }))
    .then((response) => {
    const qtUserRefs = response.data
    console.log('qtUser refs', qtUserRefs)
    console.log(`${qtUserRefs.length} qtUser found`)
    const getAllqtUserDataQuery = qtUserRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtUserDataQuery).then((ret) => {
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