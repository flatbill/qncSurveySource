/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

/* export our lambda function as named "handler" export */
exports.handler = async (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  })  
  // let myCust = event.queryStringParameters.cust 
  // let myQid = event.queryStringParameters.qid 
  // let myUser = event.queryStringParameters.user

  /* parse the string body input into a useable JS object */
  const data = JSON.parse(event.body)
  let myCust = data.cust 
  let myQid = data.qid 
  let myUser = data.userId

  console.log('Function qtUpdateUser invoked. data: ', data)
  let queryResult1 = await client.query
  (q.Get(q.Match(q.Index('qtUsersX2'),[myCust,myQid,myUser])))
  console.log('queryResult1.ref: ')
  console.log(queryResult1.ref)

   const userAdelic = {
     data: data 
   }
  
  /* construct the fauna query */
  return client.query(q.Update(q.Ref(queryResult1.ref),userAdelic))
    .then((response) => {
      console.log('success', response)
      /* Success! return the response with statusCode 200 */
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*' 
        //  'Access-Control-Allow-Origin': 'http://localhost:4200' 
        // netlify allows only one allow-origin.  
        // this wrecks the query string fetch.
        // so, I set this to '*' which is hopefully temp,
        // until I can figure it out.
        },
        body: JSON.stringify(response)
      }
    }).catch((error) => {
      console.log('error', error)
      /* Error! return the error with statusCode 400 */
      return {
        statusCode: 400,
        body: JSON.stringify(error)
      }
    })
}
