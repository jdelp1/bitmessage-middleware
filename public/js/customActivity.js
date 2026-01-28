define(['postmonger',], function (
    Postmonger
) {
   
    var connection = new Postmonger.Session();
    var authTokens = {};
    var payload = {};
    $(window).ready(onRender);

    // Postmonger events subscription
    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);
    connection.on('requestedInteraction', onRequestedInteraction);
    connection.on('requestedTriggerEventDefinition', onRequestedTriggerEventDefinition);
    connection.on('requestedDataSources', onRequestedDataSources);

    connection.on('clickedNext', save);
   
    function onRender() {
        // JB will respond the first time 'ready' is called with 'initActivity'
        connection.trigger('ready');

        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
        connection.trigger('requestInteraction');
        connection.trigger('requestTriggerEventDefinition');
        connection.trigger('requestDataSources');  

    }

    function onRequestedDataSources(dataSources){
        console.log('*** requestedDataSources ***');
        console.log(dataSources);
    }

    function onRequestedInteraction (interaction) {    
        console.log('*** requestedInteraction ***');
        console.log(interaction);
     }

     function onRequestedTriggerEventDefinition(eventDefinitionModel) {
        console.log('*** requestedTriggerEventDefinition ***');
        console.log(eventDefinitionModel);
        $('#personalize').show();
        $('#prefix').text(`{{Event.${eventDefinitionModel.eventDefinitionKey}.DEColumnName}}`);
    }

    // This function is called when the custom activity is opened by the user.
    function initialize(data) {
        console.log(data);
        if (data) {
            payload = data;
        }
        
        // This logic checks if you had previously configured your activity.
        var hasInArguments = Boolean(
            payload['arguments'] &&
            payload['arguments'].execute &&
            payload['arguments'].execute.inArguments &&
            payload['arguments'].execute.inArguments.length > 0
        );

        var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};

        console.log(inArguments);

        // For each inArgument, you can pre-populate the fields configured by the user!
        if(hasInArguments){
            var inArgument = inArguments[0];
            $('#message-body').val(inArgument.message);
        }

        connection.trigger('updateButton', {
            button: 'next',
            text: 'done',
            visible: true
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
        if($('#message-body').val()=="") {
            $('#message-body-error').show();
            connection.trigger('ready');
        }
        else {
            var inArgs = [];
			var arg = {};

            arg.message = $('#message-body').val();

            inArgs.push(arg);

            // This is how you save execute arguments in the activity.
            payload['arguments'].execute.inArguments = inArgs

            payload['metaData'].isConfigured = true;

            connection.trigger('updateActivity', payload);
        }
    }
});
