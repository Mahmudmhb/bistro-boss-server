const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken')

const stripe = require('stripe')(process.env.SECRET_STRIPE_KEY)

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
const paymentCollection = client.db('BristoBossDB').collection('payments');


app.post('/jwt', async(req, res) =>{
  const user = req.body;
  const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '1h' }) 
res.send({token})
})





// jankar vai code 



const verifyToken = (req, res, next) => {
  // console.log('inside verify token', req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

// use verify admin after verifyToken
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await usersCollection.findOne(query);
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}

// users related api
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
  const result = await usersCollection.find().toArray();
  res.send(result);
});

app.get('/users/admin/:email', verifyToken, async (req, res) => {
  const email = req.params.email;

  if (email !== req.decoded.email) {
    return res.status(403).send({ message: 'forbidden access' })
  }

  const query = { email: email };
  const user = await usersCollection.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === 'admin';
  }
  res.send({ admin });
})

// veryfiy admin 
// const veryfiyAdmin = async(req,res, next) =>{
// const email = req.decoded.email;
// const query = {email: email};
// const user = await usersCollection.findOne(query);
// const isAdmin = user?.role === 'admin';
// if(!isAdmin){
// return res.status(403).send({message: 'forbidden access'})
// }
// next()
// }
// // get users 
// app.get('/users', veryFiyToken, veryfiyAdmin, async(req,res)=>{
//   // console.log(req.headers)
//   res.send(await usersCollection.find().toArray())
// })
// app.get('/users/admin/:email', veryFiyToken, async(req,res) =>{
//   const email = req.params.email;
  
//   if(email !== req.decoded.email)
//   {
//     return res.status(403).send({message: 'forbidden access'})
//   }  
//   const query = {email: email};
//   // console.log(query)
//   const user = await usersCollection.findOne(query);
//   // console.log('user',user.role)
//   let admin = false;
//   if(user){
//     admin = user?.role === 'admin';

//   }
//   res.send({admin})
//   // console.log(admin)
// })



// get menus 
app.get('/menus', async(req, res)=>{
    res.send(await menusCollection.find().toArray())
})
// post items 
app.post('/menus',verifyToken,verifyAdmin, async(req,res)=>{
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

app.get('/menus/:id', async(req,res) =>{
  const id = req.params.id;
  const find = {_id: new ObjectId(id)}
  const result = await menusCollection.findOne(find)
 
  res.send(result)
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
app.patch('/users/admin/:id',verifyToken, verifyAdmin, async(req,res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)}
  const updateDoc = {
    $set: {
      role : 'admin'
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc)
  res.send(result)
  // console.log(result)
})



app.post('/payments', async(req, res)=>{
  const payment = req.body;
  const result = await paymentCollection.insertOne(payment)
  res.send(result)
  

})

app.patch('/menus/:id', async(req,res) =>{
  const id = req.params.id
  // console.log(id)
  const menu = req.body;
  console.log(menu)
  const filter = {_id: new ObjectId(id)}
  const updateDoc = {
    $set: {
      name: menu.name,
      image: menu.image,
      price: menu.price,
      category: menu.category,
      recipe: menu.recipe,
    },
    
  };
  const result = await menusCollection.updateOne(filter, updateDoc);
res.send(result)})

app.delete('/users/:id', verifyToken,verifyAdmin, async(req,res)=>{
  const id = req.params.id
  const userDelete = {_id: new ObjectId(id)}
  res.send(await usersCollection.deleteOne(userDelete))

})


// payment intrigation 

app.post('/create-payment-intent', async(req, res)=>{
  const {price} = req.body;
  const amount = parseInt(price * 100)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types:
     ["card"],
  })
// console.log(paymentIntent)
  res.send({clientSecret: paymentIntent.client_secret})
})




app.post('/payments', async(req, res)=>{
  const payment = req.body;
  const result = await paymentCollection.insertOne(payment);
  res.send(result)

  
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