var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();
 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));


app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var mongoURI = "mongodb://localhost/jalopz110";

  if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI);
  } else {
    mongoose.connect(mongoURI)
  }

  var mongooseErrorCheck = mongoose.connection;

  mongooseErrorCheck.on("error", function(err) {
    console.log("Mongoose Error: ", err);
  });

  mongooseErrorCheck.once("open", function() {
    console.log("Mongoose connection successful.");
  });

mongoose.Promise = Promise;

//ROUTES

app.get("/", function(req, res){
    res.render("index")
});
var currentDb;

app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  
  axios.get("https://jalopnik.com/c/jalopnik-reviews").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every div tag, and do the following:
    $("div.storytype--section__item").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children(".headline")
        .text();

      result.link = $(this)
       
        .children("a")
        .attr("href");

      result.img = $(this)
        .children(".image-wrapper lazy-image")
        .children(".img--16x9")
        .children("picture")
        .children(".featured-image lazyautosizes lazyloaded")
        .children("img")
        .attr("src");

          db.Article.create(result)
            .then(function(dbArticle) {
      
            })
            .catch(function(err) {
              return res.json(err);
            });
 
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.redirect("/articles");
  });
});
 
// Route for getting all Articles from the db
// I would like to add something to put the newest articles at the top... but I didn't get that far.
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      var hbsObject = {
        articles: dbArticle
      };
      console.log("hbsObject", hbsObject);
      // If we were able to successfully find Articles, send them back to the client
       res.render("index", hbsObject);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's comment
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the comments associated with it
    .populate("comment")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      console.log("dbArticle", dbArticle);
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Comment
app.post("/articles/:id", function(req, res) {
  // Create a new comment and pass the req.body to the entry
  var comment = req.body.comment;
  db.Comment.create(req.body)
    .then(function(dbComment) {
      // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { comment: dbComment._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client

      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});