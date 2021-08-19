
let myFaunaCollection = 'qtInvitations'
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

  console.log('Netlify Function qtReadInvitations invoked.')
  console.log(myCust,myQid)
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  
  let myFaunaFetchInvitations = 'classes/' + myFaunaCollection + '/'
  //return client.query(q.Paginate(q.Match(q.Ref('indexes/qtInvitationsX1'))))
  return client.query(q.Paginate(q.Match(q.Index('qtInvitationsX1'),[myCust,myQid]),{ size: 5 }))
    .then((response) => {
    const qtInvitationsRefs = response.data
    console.log('qtInvitations refs', qtInvitationsRefs)
    console.log(`${qtInvitationsRefs.length} qtInvitations found`)
    const getAllqtInvitationsDataQuery = qtInvitationsRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtInvitationsDataQuery).then((ret) => {
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