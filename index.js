const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
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

    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));
app.listen(port, () => {
  console.log("server is running", port);
});
