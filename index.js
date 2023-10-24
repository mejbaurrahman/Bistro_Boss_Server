const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');


app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvker.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = (req, res, next) => {
  const header = req.headers.authorization;
  if(!header) return res.status(401).send({error: true, message: 'unauthorized access'});

  const token = header.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ error: true, message: 'unauthorized access' });
    req.decoded = decoded;
    next();
  });
}

//  

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("bistroBossDB");
    const menus = database.collection("menu");
    const cartCollection = database.collection("carts");
    const userCollection = database.collection("users");

    // jwt sign in 
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token })
    })
    // const verifyAdmin = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   const query = { email: email }
    //   const user = await usersCollection.findOne(query);
    //   if (user?.role !== 'admin') {
    //     return res.status(403).send({ error: true, message: 'forbidden message' });
    //   }
    //   next();
    // }

    // user related api

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.get('/menu', async(req, res)=>{
        const result = await menus.find().toArray();
        res.send(result);
    })

   
     // cart collection apis
     app.get('/carts', verifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      console.log(req.decoded.currentUser.email);
      if (!email) {
        res.send([]);
      }
      if(email!= req.decoded.currentUser.email) {
        return res.status(401).send({error:true, message:'unauthorized'})
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/carts', async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })
    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log('Example app listening on port 3000!');
});