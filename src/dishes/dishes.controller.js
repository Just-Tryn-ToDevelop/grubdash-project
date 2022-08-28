const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// get to /dishes
function getDishesList(req, res) {
  res.json({ data: dishes });
}

// Validation functions for post to /dishes
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

// post to /dishes
function createDish(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// function to make sure dish exists
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  } else {
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}.`,
    });
  }
}

// get to /dishes/:dishId
function getPerDishId(req, res) {
  res.json({ data: res.locals.dish });
}

// validate whether dish id matches dishId paramater
function dishIdMatches(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id) {
    if (id !== dishId) {
      return next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
  }
  next();
}

// put to /dishes/:dishId
function updateDish(req, res, next) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  getDishesList,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    createDish,
  ],
  read: [dishExists, getPerDishId],
  update: [
    dishExists,
    dishIdMatches,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    updateDish,
  ],
};
