import "dotenv/config";
import axios from "axios";
import jwt from "jsonwebtoken";

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Test payload for scheduled SMS - minimal required data
const payload = {
  inArguments: [
    {
      telefono: "644614672",
      texto: "Mensaje programado de prueba desde Journey Builder",
    },
    {
      telefono: "644614672",
      texto: "Mensaje programado de prueba desde Journey Builder",
    },
  ],
};

// Generate JWT token
const token = jwt.sign(payload, process.env.jwtSecret, { algorithm: "HS256" });

console.log("Testing Scheduled SMS Execute endpoint...");
console.log(`Phone: ${payload.inArguments[0].telefono}`);
console.log(`Message: ${payload.inArguments[0].texto}`);
console.log(`Scheduled for: ${payload.inArguments[0].fechaEnvio}`);
console.log("\nSending request...\n");

// Send request to execute endpoint
try {
  const response = await axios.post(
    `${BASE_URL}/scheduled-sms/execute`,
    token,
    {
      headers: {
        "Content-Type": "application/jwt",
      },
    },
  );

  console.log("✅ Success!");
  console.log("Status:", response.status);
  console.log("Response:", response.data);
} catch (error) {
  console.error("❌ Error:");
  console.error(error.response?.data || error.message);
}
