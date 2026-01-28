// JOURNEY BUILDER CUSTOM ACTIVITY - SMS Middleware
// ````````````````````````````````````````````````````````````
// This custom activity sends SMS messages via BitMessage middleware
//
// Journey Builder's Postmonger Events Reference can be found here:
// https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-app-development.meta/mc-app-development/using-postmonger.htm

// Custom activities load inside an iframe. We'll use postmonger to manage
// the cross-document messaging between Journey Builder and the activity

// Create a new connection for this session.
// We use this connection to talk to Journey Builder.
const connection = new Postmonger.Session();

// we'll store the activity on this variable when we receive it
let activity = null;

// Wait for the document to load before we doing anything
document.addEventListener('DOMContentLoaded', function main() {
    
    // Setup a test harness so we can interact with our custom activity
    // outside of journey builder using window functions & browser devtools.
    setupExampleTestHarness();

    // setup our ui event handlers
    setupEventHandlers();

    // Bind the initActivity event...
    // Journey Builder will respond with "initActivity" after it receives the "ready" signal
    connection.on('initActivity', onInitActivity);
    
    // Listen to Journey Builder's Done/Cancel button clicks
    connection.on('clickedNext', save);
    connection.on('clickedBack', cancel);

    // We're all set! let's signal Journey Builder
    // that we're ready to receive the activity payload...

    // Tell the parent iFrame that we are ready.
    connection.trigger('ready');
    
    console.log('Custom Activity Ready');
});

// this function is triggered by Journey Builder via Postmonger.
// Journey Builder will send us a copy of the activity here
function onInitActivity(payload) {
    
    // set the activity object from this payload. We'll refer to this object as we
    // modify it before saving.
    activity = payload;

    const hasInArguments = Boolean(
        activity.arguments &&
        activity.arguments.execute &&
        activity.arguments.execute.inArguments &&
        activity.arguments.execute.inArguments.length > 0
    );

    const inArguments = hasInArguments ? activity.arguments.execute.inArguments : [];

    console.log('-------- triggered:onInitActivity({obj}) --------');
    console.log('activity:\n ', JSON.stringify(activity, null, 4));
    console.log('Has In Arguments: ', hasInArguments);
    console.log('inArguments', inArguments);
    console.log('-------------------------------------------------');

    // check if this activity has an incoming texto argument
    const messageArgument = inArguments.find((arg) => arg.texto);

    console.log('Message Argument', messageArgument);

    // if a texto argument was set, populate the textarea
    if (messageArgument && messageArgument.texto) {
        document.getElementById('message').value = messageArgument.texto;
        updateCharCounter();
    }
}

function save() {
    const message = document.getElementById('message').value.trim();

    if (!message || message.length === 0) {
        alert('Por favor, escribe un mensaje antes de continuar.');
        return;
    }

    if (message.length > 160) {
        alert('El mensaje no puede tener más de 160 caracteres.');
        return;
    }

    // we must set metaData.isConfigured in order to tell JB that
    // this activity is ready for activation
    activity.metaData.isConfigured = true;

    // save the user's message and the telefono placeholder to inArguments
    activity.arguments.execute.inArguments = [{
        telefono: '{{Contact.Attribute.EntrySource.Telefono}}',
        texto: message
    }];

    // you can set the name that appears below the activity with the name property
    const truncatedMessage = message.length > 30 ? message.substring(0, 30) + '...' : message;
    activity.name = `SMS: ${truncatedMessage}`;

    console.log('------------ triggering:updateActivity({obj}) ----------------');
    console.log('Sending message back to updateActivity');
    console.log('saving\n', JSON.stringify(activity, null, 4));
    console.log('--------------------------------------------------------------');

    connection.trigger('updateActivity', activity);
}

function cancel() {
    // tell Journey Builder that this activity has no changes.
    // we wont be prompted to save changes when the inspector closes
    connection.trigger('setActivityDirtyState', false);

    // now request that Journey Builder closes the inspector/drawer
    connection.trigger('requestInspectorClose');
}

function onMessageChange() {
    updateCharCounter();
    
    // let journey builder know the activity has changes
    connection.trigger('setActivityDirtyState', true);
}

function updateCharCounter() {
    const messageTextarea = document.getElementById('message');
    const charCounter = document.getElementById('charCounter');

    if (!messageTextarea || !charCounter) return;

    const currentLength = messageTextarea.value.length;
    const maxLength = 160;

    charCounter.textContent = `${currentLength} / ${maxLength}`;

    // Visual feedback
    charCounter.classList.remove('warning', 'error');
    if (currentLength >= maxLength) {
        charCounter.classList.add('error');
    } else if (currentLength >= 128) {
        charCounter.classList.add('warning');
    }
}

function setupEventHandlers() {
    // Listen to events on the form
    const messageTextarea = document.getElementById('message');
    
    if (messageTextarea) {
        messageTextarea.addEventListener('input', onMessageChange);
    }
    
    // Initialize counter
    updateCharCounter();
}

// this function is for example purposes only. it sets ups a Postmonger
// session that emulates how Journey Builder works. You can call jb.ready()
// from the console to kick off the initActivity event with a mock activity object
function setupExampleTestHarness() {

    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isLocalhost) {
        // don't load the test harness functions when running in Journey Builder
        return;
    }

    const jbSession = new Postmonger.Session();
    const jb = {};
    window.jb = jb;

    jbSession.on('setActivityDirtyState', function(value) {
        console.log('[echo] setActivityDirtyState -> ', value);
    });

    jbSession.on('requestInspectorClose', function() {
        console.log('[echo] requestInspectorClose');
    });

    jbSession.on('updateActivity', function(activity) {
        console.log('[echo] updateActivity -> ', JSON.stringify(activity, null, 4));
    });

    jbSession.on('ready', function() {
        console.log('[echo] ready');
        console.log('\tuse jb.ready() from the console to initialize your activity')
    });

    // fire the ready signal with an example activity
    jb.ready = function() {
        jbSession.trigger('initActivity', {
            name: 'SMS Activity',
            key: 'SMS-ACTIVITY-1',
            metaData: {},
            configurationArguments: {},
            arguments: {
                executionMode: "{{Context.ExecutionMode}}",
                definitionId: "{{Context.DefinitionId}}",
                activityId: "{{Activity.Id}}",
                contactKey: "{{Context.ContactKey}}",
                execute: {
                    inArguments: [
                        {
                            telefono: '{{Contact.Attribute.EntrySource.Telefono}}',
                            texto: 'Test message'
                        }
                    ],
                    outArguments: []
                },
                startActivityKey: "{{Context.StartActivityKey}}",
                definitionInstanceId: "{{Context.DefinitionInstanceId}}",
                requestObjectId: "{{Context.RequestObjectId}}"
            }
        });
    };
}
