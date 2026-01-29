define(["postmonger"], function (Postmonger) {
  const connection = new Postmonger.Session();
  let authTokens = {};
  let payload = {};

  // DOM element references
  const elements = {
    messageBody: null,
    messageBodyError: null,
    personalize: null,
    prefix: null,
  };

  // Postmonger events subscription
  connection.on("initActivity", initialize);
  connection.on("requestedTokens", onGetTokens);
  connection.on("requestedEndpoints", onGetEndpoints);
  connection.on("requestedInteraction", onRequestedInteraction);
  connection.on(
    "requestedTriggerEventDefinition",
    onRequestedTriggerEventDefinition,
  );
  connection.on("requestedDataSources", onRequestedDataSources);
  connection.on("clickedNext", save);

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onRender);
  } else {
    onRender();
  }

  function onRender() {
    // Cache DOM elements
    elements.messageBody = document.getElementById("message-body");
    elements.messageBodyError = document.getElementById("message-body-error");
    elements.personalize = document.getElementById("personalize");
    elements.prefix = document.getElementById("prefix");

    // JB will respond the first time 'ready' is called with 'initActivity'
    connection.trigger("ready");
    connection.trigger("requestTokens");
    connection.trigger("requestEndpoints");
    connection.trigger("requestInteraction");
    connection.trigger("requestTriggerEventDefinition");
    connection.trigger("requestDataSources");
  }

  function onRequestedDataSources(dataSources) {
    console.log("*** requestedDataSources ***");
    console.log(dataSources);
  }

  function onRequestedInteraction(interaction) {
    console.log("*** requestedInteraction ***");
    console.log(interaction);
  }

  function onRequestedTriggerEventDefinition(eventDefinitionModel) {
    console.log("*** requestedTriggerEventDefinition ***");
    console.log(eventDefinitionModel);

    if (elements.personalize) {
      elements.personalize.style.display = "block";
    }

    if (elements.prefix) {
      elements.prefix.textContent = `{{Event.${eventDefinitionModel.eventDefinitionKey}.DEColumnName}}`;
    }
  }

  // This function is called when the custom activity is opened by the user.
  function initialize(data) {
    console.log(data);
    if (data) {
      payload = data;
    }

    // This logic checks if you had previously configured your activity.
    const hasInArguments = Boolean(
      payload.arguments?.execute?.inArguments?.length > 0,
    );

    const inArguments = hasInArguments
      ? payload.arguments.execute.inArguments
      : {};

    console.log(inArguments);

    // For each inArgument, you can pre-populate the fields configured by the user!
    if (hasInArguments) {
      const inArgument = inArguments[0];
      if (elements.messageBody && inArgument.message) {
        elements.messageBody.value = inArgument.message;
      }
    }

    connection.trigger("updateButton", {
      button: "next",
      text: "done",
      visible: true,
    });
  }

  // Gets tokens for authentication with the SFMC API, keep in mind these tokens have an expiration of 20 minutes and are to be used within the custom activity.
  function onGetTokens(tokens) {
    console.log(tokens);
    authTokens = tokens;
  }

  function onGetEndpoints(endpoints) {
    console.log(endpoints);
  }

  function save() {
    // Here's is where you can validate your attributes before saving the activity
    const messageBodyValue = elements.messageBody?.value?.trim() || "";

    if (messageBodyValue === "") {
      if (elements.messageBodyError) {
        elements.messageBodyError.style.display = "block";
      }
      connection.trigger("ready");
    } else {
      // Hide error message if shown
      if (elements.messageBodyError) {
        elements.messageBodyError.style.display = "none";
      }

      const arg = {
        message: messageBodyValue,
      };

      // This is how you save execute arguments in the activity.
      payload.arguments.execute.inArguments = [arg];
      payload.metaData.isConfigured = true;

      connection.trigger("updateActivity", payload);
    }
  }
});
