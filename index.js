const express = require('express');
require('dotenv').config()
const cors = require ('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000
const app = express()

const corsOptions = {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      "https://darling-bonbon-9ab53a.netlify.app",
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wcqculy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
     const foodsCollection = client.db('GreenChilli').collection('foods')
     const purchaseCollection = client.db('GreenChilli').collection('purchase')

    //  JWT generate
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      // console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'strict'
      })
          .send({ success: true });
  })

      // Clear token on logout
      app.get('/logout', (req, res) => {
        const user = req.body
        console.log(user)
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 0,
          })
          .send({ success: true })
      })

    //  All foods data
    app.get('/foods', async(req,res) =>{
      const filter = req.query;
      console.log(filter);
      // const query = {
      //   food_name : {
      //     $regex: filter.search,
      //     $options: 'i'}
      // }
      //    console.log(query)
      const result = await foodsCollection.find().toArray()
      // console.log(result)
      res.send(result)
    })
    // single food data
    app.get('/food/:id', async (req,res)=>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await foodsCollection.findOne(query)
        res.send(result)
    })

    // Save purchases foods
    app.post('/purchase', async(req,res) =>{
      const purchaseData = req.body
      const result = await purchaseCollection.insertOne(purchaseData)
      res.send(result)
    })
    // Save a added food item
    app.post('/food', async(req,res) =>{
      const addedFoodData = req.body
      const result = await foodsCollection.insertOne(addedFoodData)
      res.send(result)
    })
    
    // get all foods posted by a user
    app.get('/foods/:email', async(req, res) =>{
      const email = req.params.email
      const query = { email}
      console.log('tok tok token', req.cookies.token)
      const result = await foodsCollection.find(query).toArray()
      res.send(result)
    })

    // search
    // app.get('/foods', async(req,res) =>{
    //   const filter = req.query;
    //   console.log(filter)
    //   const query = {
    //     food_name :{$regex : filter.search}
    //   }
    // })

    // update a food item
    app.put('/food/:id', async(req,res) =>{
      const id = req.params.id
      const updateFood = req.body
      const query ={_id : new ObjectId(id)}
      const options = {upsert : true}
      const updateDoc ={
        $set :{
          ...updateFood,
        }
      }
      const result = await foodsCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })

    // get all foods posted by a user
    app.get('/orderFood/:email', async(req, res) =>{
      const email = req.params.email
      const query = { email}
      const result = await purchaseCollection.find(query).toArray()
      res.send(result)
    })
    
    // delete a food from database
    app.delete('/food/:id', async(req,res) =>{
      const id = req.params.id
      console.log(id)
      const query= {_id: new ObjectId (id)}
      const result = await purchaseCollection.deleteOne(query)
      res.send(result)
    })
  

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello from Server....')
  })
  
  app.listen(port, () => console.log(`Server running on port ${port}`))