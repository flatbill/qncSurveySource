/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

/* export our lambda function as named "handler" export */
exports.handler = async (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  })  
  let myCust = "1"   
  let myQid = "1"   
  let myGroupNbr = '1'   

  /* parse the string body input into a useable JS object */
  const data = JSON.parse(event.body)
  console.log('Function qtUpdateQuestion invoked. data: ', data)
  myCust       = data.cust
  myQid        = data.qid
  myGroupNbr   = data.groupNbr
  let queryResult1 = await client.query
  (q.Get(q.Match(q.Index('qtGroupsX2'),[myCust,myQid,myGroupNbr])))
  console.log('pgm change 10/10/2021 7:41')
  console.log('queryResult1.ref: ')
  console.log(queryResult1.ref)

   const groupAdelic = {
     data: data 
   }
  
  /* construct the fauna query */
  return client.query(q.Update(q.Ref(queryResult1.ref),groupAdelic))
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
