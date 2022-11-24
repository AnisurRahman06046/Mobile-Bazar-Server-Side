const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const ObjectID = require("mongodb").ObjectId;
require("dotenv").config();
// middleware
const cors = require("cors");

app.use(cors());
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

    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { id: id };

      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));
app.listen(port, () => {
  console.log("server is running", port);
});
