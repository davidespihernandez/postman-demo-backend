const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const customers = new Map();

function normalizeNewCustomer(payload) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";

  if (!name || !email || !phone) {
    return {
      error: "name, email, and phone are required and must be non-empty strings.",
    };
  }

  return {
    customer: {
      id: uuidv4(),
      name,
      email,
      phone,
    },
  };
}

app.get("/customers", (_req, res) => {
  res.json(Array.from(customers.values()));
});

app.get("/customers/:id", (req, res) => {
  const customer = customers.get(req.params.id);

  if (!customer) {
    return res.status(404).json({ error: "Customer not found." });
  }

  return res.json(customer);
});

app.post("/customers", (req, res) => {
  const { customer, error } = normalizeNewCustomer(req.body || {});

  if (error) {
    return res.status(400).json({ error });
  }

  customers.set(customer.id, customer);
  return res.status(201).json(customer);
});

app.patch("/customers/:id", (req, res) => {
  const { id } = req.params;
  const existing = customers.get(id);

  if (!existing) {
    return res.status(404).json({ error: "Customer not found." });
  }

  const updates = req.body || {};
  const allowedFields = ["name", "email", "phone"];
  const providedFields = Object.keys(updates);

  if (providedFields.length === 0) {
    return res.status(400).json({ error: "Provide at least one field to update." });
  }

  const hasInvalidField = providedFields.some((field) => !allowedFields.includes(field));
  if (hasInvalidField) {
    return res
      .status(400)
      .json({ error: "Only name, email, and phone can be updated." });
  }

  const nextCustomer = { ...existing };

  for (const field of providedFields) {
    if (typeof updates[field] !== "string" || updates[field].trim() === "") {
      return res
        .status(400)
        .json({ error: `${field} must be a non-empty string when provided.` });
    }
    nextCustomer[field] = updates[field].trim();
  }

  customers.set(id, nextCustomer);
  return res.json(nextCustomer);
});

app.get("/", (_req, res) => {
  res.json({
    service: "postman-demo-backend",
    message: "Use /customers endpoints to manage in-memory customers.",
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
