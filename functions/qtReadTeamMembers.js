
let myFaunaCollection = 'qtTeamMembers'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

exports.handler = (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  const myTeamMember = event.queryStringParameters.teamMember

  console.log('Netlify Function qtReadTeamMembers invoked.')
  console.log(myTeamMember)
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  
  let myFaunaFetchteamMembers = 'classes/' + myFaunaCollection + '/'
  //return client.query(q.Paginate(q.Match(q.Ref('indexes/qtTeamMembersX1'))))
  return client.query(q.Paginate(q.Match(q.Index('qtTeamMembersX1'),[myTeamMember]),{ size: 1 }))
    .then((response) => {
    const qtTeamMembersRefs = response.data
    console.log('qtteamMembers refs', qtTeamMembersRefs)
    console.log(`${qtTeamMembersRefs.length} qtteamMembers found`)
    const getAllqtTeamMembersDataQuery = qtTeamMembersRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtTeamMembersDataQuery).then((ret) => {
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
  console.log(`Running getIdInline from Netlify Function 'qtReadTeamMembers' . urlPath: ${urlPath}`)

  return urlPath.match(/([^\/]*)\/*$/)[0]
}