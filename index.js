const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
// const ObjectID = require("mongodb").ObjectId;
const JWT = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
require("dotenv").config();
// middleware
const cors = require("cors");
const { query } = require("express");

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

// middleware to verify token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  JWT.verify(token, process.env.SECRET_TOKEN, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "unauthorized" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const categoriesCollection = client
      .db("BuySell")
      .collection("productCategories");

    const productsCollection = client.db("BuySell").collection("products");
    const usersCollection = client.db("BuySell").collection("users");
    const bookingsCollection = client.db("BuySell").collection("bookeditems");
    const postedProductsCollection = client
      .db("BuySell")
      .collection("sellersproducts");

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
    // post api for booking items
    app.post("/bookeditems", async (req, res) => {
      const bookingitems = req.body;
      const result = await bookingsCollection.insertOne(bookingitems);
      res.send(result);
    });
    // api for sellers posted product
    app.post("/addedproducts", async (req, res) => {
      const postedproduct = req.body;
      const result = await postedProductsCollection.insertOne(postedproduct);
      res.send(result);
    });
    // api to get the posted product by sellers
    app.get("/addedproducts", async (req, res) => {
      const query = {};
      const result = await postedProductsCollection.find(query).toArray();
      res.send(result);
    });

    // api to get the booked item on my orders route on client side
    app.get("/bookeditems", verifyToken, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = JWT.sign({ email }, process.env.SECRET_TOKEN, {
          expiresIn: "15d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "unauthorized access" });
    });
    // api to create registered user data in db
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // api to get users data
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // app.get("/allsellers", async (req, res) => {
    //   const query = {};
    //   const users = await usersCollection.find(query).toArray();
    //   const filtered = users.filter((user) => user.role === "Buyer");
    //   console.log(filtered);
    //   res.send(filtered);
    // });

    // admin to see all sellers and all nuyers route
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    // api to check sellers to access add a products and my products
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "Seller" });
    });

    // api to check buyers to access my orders on dashboard
    app.get("/users/buyers/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.role === "Buyer" });
    });

    // show all sellers users on all sellers route
    app.get("/users/allsellers", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      const allsellers = users.filter((user) => user?.role === "Seller");
      res.send(allsellers);
    });

    // api to show all buyers users on all buyers route
    app.get("/users/allbuyers", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      const allbuyers = users.filter((user) => user?.role === "Buyer");
      res.send(allbuyers);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));
app.listen(port, () => {
  console.log("server is running", port);
});
