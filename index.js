const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
// const ObjectID = require("mongodb").ObjectId;
const JWT = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

const stripe = require("stripe")(process.env.STRIPE_SECRET);
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

    const paymentsCollection = client.db("BuySell").collection("payments");

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
      const result = await productsCollection.insertOne(postedproduct);
      res.send(result);
    });

    app.get("/productbrandname", async (req, res) => {
      const query = {};
      const result = await categoriesCollection

        .find(query)
        .project({ name: 1 })
        .toArray();
      res.send(result);
    });
    // api to get the posted product by sellers
    app.get("/addedproducts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await productsCollection.find(query).toArray();
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

    // api to delete a seller
    app.delete("/seller/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });

    // api to delete a buyer
    app.delete("/buyer/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });
    // api to delete product by seller
    app.delete("/postedproduct/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });

    // make  a seller verified
    app.put("/seller/verify/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          type: "verified",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });
    // payment method implementaion
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const price = booking.resalePrice;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });

      // api to store payment info on db
      app.post("/payments", async (req, res) => {
        const payment = req.body;
        const result = await paymentsCollection.insertOne(payment);
        const id = payment.bookingId;
        const filter = { _id: ObjectId(id) };
        const updatedDoc = {
          $set: {
            paid: true,
            trandactionId: payment.transactionId,
          },
        };
        const updated = await bookingsCollection.updateOne(filter, updatedDoc);

        res.send(result);
      });
    });

    // api to post advertised items
    app.post("/advertisedproducts", async (req, res) => {
      const advertisedProducts = req.body;
      const advertised = await postedProductsCollection.insertOne(
        advertisedProducts
      );
      res.send(advertised);
    });

    // api to show advertised items
    app.get("/advertised", async (req, res) => {
      const query = {};
      const result = await postedProductsCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));
app.listen(port, () => {
  console.log("server is running", port);
});
