const path = require("path");
const { createBrotliDecompress } = require("zlib");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// get to /orders
function listOrders(req, res) {
  res.json({ data: orders });
}

// validation functions for endpoint /orders

// validate whether a property exists
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

// validate whether dishes property is an array and if it es empty or not
function dishesPropertyValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes.length && Array.isArray(dishes)) {
    return next();
  } else {
    next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }
}

// validate qunatity property of the order
function quantityPropertyIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    dishes.forEach((dish, index) => {
    if (
      dish.quantity <= 0 ||
      !dish.quantity ||
      !Number.isInteger(dish.quantity) 
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
    });
    next();
  }

// post order to /orders
function createOrder(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// function that checks if order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  } else {
    next({
      status: 404,
      message: `Order does not exist: ${orderId}.`,
    });
  }
}

// get to /orders/:orderId
function readOrder(req, res, next) {
  res.json({ data: res.locals.order });
}

// validation of whether order.id matches orderId
function orderIdMatches(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id) {
    if (id !== orderId) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
    }
  }
  next();
}

// Validation of status property
function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!validStatus.includes(status)) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

// put request to /orders/:ordersId
function updateOrder(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

// validate status is not equal to pending
function statusNotPending(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

// delete request to enpoint /orders/:orderId
function destroyOrder(req, res) {
  const orderId = req.params.orderId;
  const index = orders.findIndex((order) => order.id === orderId);

  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  listOrders,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesPropertyValid,
    quantityPropertyIsValid,
    createOrder,
  ],
  read: [orderExists, readOrder],
  update: [
    orderExists,
    orderIdMatches,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    statusPropertyIsValid,
    dishesPropertyValid,
    quantityPropertyIsValid,
    updateOrder,
  ],
  delete: [orderExists, statusNotPending, destroyOrder],
};
