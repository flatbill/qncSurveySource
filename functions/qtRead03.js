
// read one question by fauna ref from qtQuestions collection.
let myFaunaCollection = 'qtQuestions'
/* Import faunaDB sdk */
const faunadb = require('faunadb')
const q = faunadb.query

exports.handler = (event, context) => {
  /* configure faunaDB Client with our secret */
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET2
  }) 
  const id = getIdInline(event.path)

  console.log(`Netlify Function 'qtRead03' invoked. Read id: ${id}`)
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  //let params1 = (new URL(document.location)).searchParams;
  //let faunaRefQueryStringIn = params1.get("ref");
  // let myFaunaDbName = 'alaska6'  // not needed cuz FAUNADB_SERVER_SECRET2 is tied to database alaska6.
  // let myFaunaCollection = 'qtQuestions'
 // let myFaunaRef =  '276380634185728512'
  //let myFaunaRef =  '276403382834430483'
  let myFaunaRef =  id

  
  //if (faunaRefQueryStringIn.length > 0 ) {myFaunaRef = faunaRefQueryStringIn}
  let myFaunaFetchRef = 'classes/' + myFaunaCollection + '/'+ myFaunaRef
//https://stupefied-elion-621b07.netlify.app/
  
  return client.query(q.Get(q.Ref(myFaunaFetchRef)))
    .then((response) => {
      console.log('success myFaunaFetchRef ', response)
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
      console.log('error myFaunaFetchRef:', error)
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(error)
      }
    })
}
function getIdInline(urlPath) {
  console.log(`Running getIdInline from Netlify Function 'qtRead03' . urlPath: ${urlPath}`)

  return urlPath.match(/([^\/]*)\/*$/)[0]
}