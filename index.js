const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.SECRET_NAM}:${process.env.SECRET_KEY}@cluster0.gegfn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


const menusCollection = client.db('BristoBossDB').collection('menus');
const cartsCollection = client.db('BristoBossDB').collection('carts');
// get menus 
app.get('/menus', async(req, res)=>{
    res.send(await menusCollection.find().toArray())
})

app.get('/carts', async(req,res) =>{
  const email = req.query.email;
  const query = {email: email}
  res.send(await cartsCollection.find(query).toArray(
  ))
})

// post add to cart 
app.post('/carts', async(req, res)=>{
  const cart = req.body;
  res.send( await cartsCollection.insertOne(cart))
})

// cart deelte 
app.delete('/carts/:id', async(req, res)=>{
  const id = req.params.id;
  const find = {_id: new ObjectId(id)}
  res.send(await cartsCollection.deleteOne(find))
})

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req,res)=>{
    res.send('this is server site')
})
app.listen(port, ()=>{
    console.log('this is express', port);
})