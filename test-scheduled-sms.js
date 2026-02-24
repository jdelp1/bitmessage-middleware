import axios from "axios";

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Test data - array of SMS objects
// Format: fechaEnvio(dd/MM/yyyy)|horaEnvio(HH:mm)|telefono|texto
const testData = [
  {
    telefono: "676265730",
    texto: "Hola este es un mensaje de prueba 1",
    fechaEnvio: "2026-02-19T09:02:00",
  },
  {
    telefono: "644614672",
    texto: "Hola este es un mensaje de prueba 2",
    fechaEnvio: "2026-02-19T09:02:00",
  },
];

console.log("Testing Scheduled SMS endpoint...");
console.log(`Sending ${testData.length} SMS records`);
console.log("\nTest data:");
console.log(JSON.stringify(testData, null, 2));
console.log("\n" + "=".repeat(60) + "\n");

try {
  const response = await axios.post(
    `${BASE_URL}/scheduled-sms/receive-json-file?campanya=PRE-IBSALUT`,
    testData,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  console.log("✅ Success!");
  console.log("Status:", response.status);
  console.log("\nResponse:");
  console.log(JSON.stringify(response.data, null, 2));

  if (response.data.response?.url) {
    console.log("\n📄 Generated file available at:");
    console.log(`${BASE_URL}${response.data.response.url}`);
  }
} catch (error) {
  console.error("❌ Error:");
  console.error("Status:", error.response?.status);
  console.error("Error:", error.response?.data || error.message);
}
