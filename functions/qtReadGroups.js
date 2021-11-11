
let myFaunaCollection = 'qtGroups'
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
  console.log('Netlify Function qtReadGroups invoked.')
  console.log('here is qtReadGroups event:', event)
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  
  let myFaunaFetchQuests = 'classes/' + myFaunaCollection + '/'
  return client.query(q.Paginate(q.Match(q.Index('qtGroupsX1'), [myCust,myQid] )))
    .then((response) => {
    const qtGroupsRefs = response.data
    console.log('qtGroups refs', qtGroupsRefs)
    console.log(`${qtGroupsRefs.length} qtGroups found`)
    const getAllqtGroupsDataQuery = qtGroupsRefs.map((ref) => {
      return q.Get(ref)
    })
    // then query the refs
    return client.query(getAllqtGroupsDataQuery).then((ret) => {
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
