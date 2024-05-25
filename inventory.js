
 const express = require("express");
const app = express();

app.use(express.json());

const inventory = [];

// HTTP METHODS
// GET - Retrieve Data
app.get("/", (request, response) => {
  response.send("Welcome to home!");
});

app.get("/inventory", (request, response) => {
  if (inventory.length === 0) {
    response.status(404).send("No inventory items found!");
    return;
  }
  response.status(200).send(inventory);
});

// POST - Create data
app.post("/inventory", (request, response) => {
  const { name, type, category, barcode, quantity } = request.body;

  // Validate required fields
  if (!name || !type || !category || quantity == null) {
    response.status(400).send("Name, type, category, and quantity are required");
    return;
  }

  // Check if item already exists in inventory
  const existingItem = inventory.find((item) => item.name === name && item.barcode === barcode);
  if (existingItem) {
    response.status(400).send("Item already exists in inventory");
    return;
  }

  // Add item to inventory
  const newItem = {
    name,
    type,
    category,
    barcode,
    quantity: parseInt(quantity, 10) // Ensure quantity is an integer
  };
  inventory.push(newItem);
  response.status(201).send("Inventory item added successfully");
});

// DELETE - Remove data
app.delete('/inventory/:name', (request, response) => {
    const { name } = request.params;
    const index = inventory.findIndex(item => item.name === name);
    if (index === -1) {
      response.status(404).send("Inventory item not found");
      return;
    }
    inventory.splice(index, 1);
    response.status(200).send("Inventory item deleted successfully");
});

// GET - Calculate total quantities
app.get("/inventory/quantities", (request, response) => {
  if (inventory.length === 0) {
    response.status(404).send("No inventory items found!");
    return;
  }

  const quantities = inventory.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = 0;
    }
    acc[item.type] += item.quantity;
    return acc;
  }, {});

  response.status(200).send(quantities);
});

// GET - Search for an item
app.get("/inventory/search", (request, response) => {
  const { name } = request.query;

  if (!name) {
    response.status(400).send("Name query parameter is required");
    return;
  }

  const results = inventory.filter(item => item.name.toLowerCase().includes(name.toLowerCase()));

  if (results.length === 0) {
    response.status(404).send("No matching inventory items found");
    return;
  }

  response.status(200).send(results);
});

app.listen(3000, () => {
  console.log("Started on port 3000");
});
