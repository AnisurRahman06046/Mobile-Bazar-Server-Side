const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
// const ObjectID = require("mongodb").ObjectId;
require("dotenv").config();
// middleware
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("api is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bmqqztp.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const categoriesCollection = client
      .db("BuySell")
      .collection("productCategories");

    const productsCollection = client.db("BuySell").collection("products");
    const usersCollection = client.db("BuySell").collection("users");

    // to show the category
    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    });
    // to show the data id based
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { id: id };

      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // api to create registered user data in db
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));
app.listen(port, () => {
  console.log("server is running", port);
});
