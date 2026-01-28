/**
 * Postmonger configuration for Marketing Cloud Journey Builder Custom Activity
 * This handles communication between the custom activity UI and Journey Builder
 */

// Use CDN version of Postmonger - include this in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/postmonger@2.0.0/postmonger.min.js"></script>

let connection = null;
let payload = {};

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
  // Setup UI event handlers first (works even without Postmonger)
  setupUI();

  // Initialize Postmonger only if available (inside Journey Builder)
  try {
    if (typeof Postmonger !== 'undefined') {
      connection = new Postmonger.Session();
      
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
    } else {
      console.log("Running in standalone mode (outside Journey Builder)");
    }
  } catch (e) {
    console.log("Postmonger not available - running in standalone mode");
  }
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
  
  if (!payload.metaData) {
    payload.metaData = {};
  }
  payload.metaData.isConfigured = true;

  console.log("Saving configuration:", payload);

  // Notify Journey Builder to save (only if connected)
  if (connection) {
    connection.trigger("updateActivity", payload);
  } else {
    console.log("Would save:", payload);
    alert("Configuración guardada (modo standalone)");
  }
}

/**
 * Called when user clicks Back in Journey Builder
 */
function onClickedBack() {
  if (connection) {
    connection.trigger("prevStep");
  }
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

  // Send button - calls the execute endpoint
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

    // Call the execute endpoint
    sendMessage(message);
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

/**
 * Send message to the execute endpoint
 */
function sendMessage(message) {
  fetch("/mc/activity/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inArguments: [
        {
          texto: message,
        },
      ],
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Mensaje enviado exitosamente:", data);
      alert("Mensaje enviado correctamente!");

      // Clear the textarea after successful send
      document.getElementById("message").value = "";
      updateCharCounter();
    })
    .catch((error) => {
      console.error("Error al enviar mensaje:", error);
      alert("Error al enviar el mensaje. Por favor, intenta de nuevo.");
    });
}
