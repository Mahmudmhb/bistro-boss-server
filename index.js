const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken')

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
const usersCollection = client.db('BristoBossDB').collection('users');


// jwt oparation 
// jwt.sign({ foo: 'bar' }, privateKey, { algorithm: 'RS256' }, function(err, token) {
//   console.log(token);
// });

app.post('/jwt', async(req, res) =>{
  const user = req.body;
  const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '1h' }) 
res.send({token})
})


const veryFiyToken =(req,res, next) =>{
  // console.log('inside veryfiy token', req.headers.authorization)
  if(!req.headers.authorization){
return res.status(401).send({message: 'forbidden access'})
  }
  const token = req.headers.authorization.split(' ')[1]
  jwt.verify(token, process.env.SECRET_TOKEN ,(err, decoded) =>{
    if(err) {
      return res.status(401).send({message: 'forbidden access'});
    }
    req.decoded = decoded;
    next();
  })
}

// veryfiy admin 
const veryfiyAdmin = async(req,res, next) =>{
const email = req.decoded.email;
const query = {email: email};
const user = await usersCollection.findOne(query);
const isAdmin = user?.role === 'admin';
if(!isAdmin){
return res.status(403).send({message: 'forbidden access'})
}
next()
}
// get users 
app.get('/users', veryFiyToken, veryfiyAdmin, async(req,res)=>{

  // console.log(req.headers)

  res.send(await usersCollection.find().toArray())
})
app.get('/users/admin/:email', veryFiyToken, veryfiyAdmin, async(req,res) =>{
  const email = req.params.email;
  // console.log('this is email',email)

  // if(email !== req.decoded.email)
  if(email !== req.decoded.email){
    return res.status(403).send({message: 'unathorized access'})
  }  
  const query = {email: email};
  // console.log(query)
  const user = await usersCollection.findOne(query);
  // console.log('user',user.role)
  let admin = false;
  if(user){
    admin = user?.role === 'admin';

  }
  res.send({admin})
  // console.log(admin)
})



// get menus 
app.get('/menus', async(req, res)=>{
    res.send(await menusCollection.find().toArray())
})
// post items 
app.post('/menus',veryFiyToken,veryfiyAdmin, async(req,res)=>{
  const menu = req.body;
  console.log(menu)
  res.send(await menusCollection.insertOne(menu))
})

app.get('/carts',  async(req,res) =>{
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



// add user in the database 

app.post('/users', async(req,res)=>{
  const user = req.body;
  const query = {email: user.email}
  const existingUser = await usersCollection.findOne(query)
  if(existingUser){
    return res.send({message: 'user alreay have', insertId: null})
  }
  res.send(await usersCollection.insertOne(user))
})

// cart deelte 
app.delete('/carts/:id',  async(req, res)=>{
  const id = req.params.id;
  const find = {_id: new ObjectId(id)}
  res.send(await cartsCollection.deleteOne(find))
})
app.delete('/menus/:id',  async(req, res)=>{
  const id = req.params.id;
  const find = {_id: new ObjectId(id)}
  res.send(await menusCollection.deleteOne(find))
})


// update user role 
app.patch('/users/admin/:id', veryFiyToken, veryfiyAdmin, async(req,res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const updateDoc = {
    $set: {
      role : 'admin'
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc)
  res.send(result)
  console.log(result)
})

app.delete('/users/:id', veryFiyToken, veryfiyAdmin, async(req,res)=>{
  const id = req.params.id
  const userDelete = {_id: new ObjectId(id)}
  res.send(await usersCollection.deleteOne(userDelete))

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