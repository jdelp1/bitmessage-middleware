// Deps
import Path from 'path';
import axios from 'axios';
import JWT from '../lib/jwtDecoder.js';

/*
 * POST Handler for /execute/ route of Activity.
 */
export async function execute(req, res) {
    // Prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
        // example on how to decode JWT
        JWT(req.body, process.env.jwtSecret, async (err, decoded) => {

            console.log(`Jwt: ${req.body.toString('utf8')}`);

            // verification error -> unauthorized request
            if (err) {
                console.error(err);
                return res.status(401).end();
            }

            if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
                
                // decoded in arguments
                var decodedArgs = decoded.inArguments[0];

                // Below is an example of calling a third party service, you can modify the URL of the requestBin in the environment variables
                if (process.env.requestBin) {
                    const response = await axios.post(process.env.requestBin,decodedArgs,
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                }

                // This is how you would return a branch result in a RESTDECISION activity type: see config.json file for potential outcomes
                return res.status(200).json({ branchResult: "sent" });
            } else {
                console.error('inArguments invalid.');
                return res.status(200).json({ branchResult: "notsent" });
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(200).json({ branchResult: "notsent" });
    }
};


/*
 * POST Handler for /publish/ route of Activity.
 */
export async function publish(req, res) {
    // Prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    console.log(`Publish Event: ${req.body.toString('utf8')}`);
    res.send(200, 'Publish');
};

/*
 * POST Handler for /validate/ route of Activity.
 */
export async function validate(req, res) {
    // Prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    console.log(`Validate Event: ${req.body.toString('utf8')}`);
    res.send(200, 'Validate');
};


/*
 * POST Handler for / route of Activity (this is the edit route).
 */
export async function edit(req, res) {
    // Prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    console.log(`Edit Event: ${req.body.toString('utf8')}`);
    res.send(200, 'Edit');
};

/*
 * POST Handler for /save/ route of Activity.
 */
export async function save(req, res) {
    // Prevent caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    console.log(`Save Event: ${req.body.toString('utf8')}`);
    res.send(200, 'Save');
};
