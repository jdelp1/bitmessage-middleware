/**
 * Postmonger configuration for Marketing Cloud Journey Builder Custom Activity
 * This handles communication between the custom activity UI and Journey Builder
 */

// Use CDN version of Postmonger - include this in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/postmonger@2.0.0/postmonger.min.js"></script>

let connection = new Postmonger.Session();
let payload = {};

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
  // Setup UI event handlers
  setupUI();

  // Listen for Journey Builder events
  connection.on("initActivity", onInitActivity);
  connection.on("requestedTokens", onGetTokens);
  connection.on("requestedEndpoints", onGetEndpoints);
  connection.on("clickedNext", onClickedNext);
  connection.on("clickedBack", onClickedBack);
  connection.on("gotoStep", onGotoStep);

  // Signal to Journey Builder that we're ready
  connection.trigger("ready");
  connection.trigger("requestTokens");
  connection.trigger("requestEndpoints");
});

/**
 * Called when Journey Builder initializes the activity
 */
function onInitActivity(data) {
  if (data) {
    payload = data;
    console.log("Activity initialized:", payload);

    const message = payload?.inArguments?.[0]?.texto || "";
    if (message) {
      document.getElementById("message").value = message;
      updateCharCounter();
    }
  }
}

/**
 * Called when tokens are returned from Journey Builder
 */
function onGetTokens(tokens) {
  console.log("Tokens received:", tokens);
}

/**
 * Called when endpoints are returned from Journey Builder
 */
function onGetEndpoints(endpoints) {
  console.log("Endpoints received:", endpoints);
}

/**
 * Called when user clicks Next in Journey Builder
 */
function onClickedNext() {
  const message = document.getElementById("message").value.trim();

  if (!message || message.length === 0) {
    alert("Por favor, escribe un mensaje antes de continuar.");
    return;
  }

  if (message.length > 100) {
    alert("El mensaje no puede tener más de 100 caracteres.");
    return;
  }

  // Update payload with the message
  payload.inArguments = [{ texto: message }];
  payload.metaData.isConfigured = true;

  console.log("Saving configuration:", payload);

  // Notify Journey Builder to save
  connection.trigger("updateActivity", payload);
}

/**
 * Called when user clicks Back in Journey Builder
 */
function onClickedBack() {
  connection.trigger("prevStep");
}

/**
 * Called when user navigates to a specific step
 */
function onGotoStep(step) {
  console.log("Go to step:", step);
}

/**
 * Setup UI interactions
 */
function setupUI() {
  const messageTextarea = document.getElementById("message");
  const sendButton = document.getElementById("sendButton");
  const charCounter = document.getElementById("charCounter");

  if (!messageTextarea || !sendButton || !charCounter) {
    console.error("UI elements not found");
    return;
  }

  // Character counter functionality
  messageTextarea.addEventListener("input", updateCharCounter);

  // Send button for testing (outside Journey Builder)
  sendButton.addEventListener("click", function () {
    const message = messageTextarea.value.trim();

    if (!message || message.length === 0) {
      alert("Por favor, escribe un mensaje antes de enviar.");
      return;
    }

    if (message.length > 100) {
      alert("El mensaje no puede tener más de 100 caracteres.");
      return;
    }

    console.log("Test mode - Mensaje:", message);
    alert("Modo de prueba. En Journey Builder, usa el botón 'Done'.");
  });

  // Initialize counter
  updateCharCounter();
}

/**
 * Update character counter
 */
function updateCharCounter() {
  const messageTextarea = document.getElementById("message");
  const charCounter = document.getElementById("charCounter");
  const sendButton = document.getElementById("sendButton");

  const currentLength = messageTextarea.value.length;
  const maxLength = 100;

  charCounter.textContent = `${currentLength} / ${maxLength}`;

  // Visual feedback
  charCounter.classList.remove("warning", "error");
  if (currentLength >= maxLength) {
    charCounter.classList.add("error");
  } else if (currentLength >= 80) {
    charCounter.classList.add("warning");
  }

  // Enable/disable button
  sendButton.disabled = currentLength === 0;
}
