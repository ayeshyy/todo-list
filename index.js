const express = require("express");
const { redirect } = require("express/lib/response");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");
let PORT = process.env.PORT || 3000;

require("dotenv").config();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose
  .connect(process.env.CONNECTION_URL, {
    useNewUrlParser: true,
  })
  .then(() =>
    app.listen(PORT, () => console.log(`Server is started on ${PORT}`))
  )
  .catch((error) => console.log(error));

const listItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: 1,
  },
});

const listNameSchema = new mongoose.Schema({
  name: String,
  items: [listItemSchema],
});

const Item = mongoose.model("Item", listItemSchema);
const List = mongoose.model("List", listNameSchema);

const item1 = new Item({
  name: "Take Breakfast",
});

const item2 = new Item({
  name: "Excercise",
});

const item3 = new Item({
  name: "Drink tea",
});

const defaultArray = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultArray, function (err) {
        if (!err) {
          console.log("Success");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { kindOfList: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:listName", function (req, res) {
  let paramName = _.capitalize(req.params.listName);
  List.findOne({ name: paramName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Creating a list if it does not exist;
        const list = new List({
          name: paramName,
          items: defaultArray,
        });
        list.save();
        res.redirect("/" + paramName);
      } else {
        // Sending the list data to the ejs file;
        res.render("list", {
          kindOfList: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const todoName = req.body.listItem;
  const listName = req.body.button;

  const newItem = new Item({
    name: todoName,
  });
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundItem) {
      foundItem.items.push(newItem);
      foundItem.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.check;
  const listsName = req.body.listsName;
  if (listsName === "Today") {
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listsName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundItem) {
        if (!err) {
          res.redirect("/" + listsName);
        }
      }
    );
  }
});
