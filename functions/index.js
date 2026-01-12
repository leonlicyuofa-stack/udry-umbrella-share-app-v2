// functions/index.js
const functions = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const fetch = require("node-fetch");
const { google } = require("googleapis");

// --- Safe, Global Initialization ---
let adminApp; // Will be initialized lazily
let stripe; // Will be initialized lazily

// Lazy initializer for Firebase Admin SDK
const getAdminApp = () => {
    if (!adminApp) {
        const admin = require("firebase-admin");
        adminApp = admin.initializeApp();
        logger.info("Firebase Admin SDK initialized on first use.");
    }
    return adminApp;
};

// Lazy initializer for Stripe
const getStripe = () => {
    if (!stripe) {
        const Stripe = require("stripe");
        const stripeKey = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '');
        if (!stripeKey) {
            logger.warn("Stripe secret key is not available. Stripe functionality will be disabled.");
            return null;
        }
        stripe = new Stripe(stripeKey);
        logger.info("Stripe SDK initialized on first use.");
    }
    return stripe;
};

// --- MODIFIED SERVER-SIDE AUTH FUNCTION (onRequest with Manual CORS) ---
exports.exchangeAuthCodeForToken = functions.runWith({ secrets: ["OAUTH_CLIENT_SECRET"] }).https.onRequest(async (req, res) => {
    // Manually set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        // Handle preflight request
        res.status(204).send('');
        return;
    }

    logger.info("[exchangeAuthCode - onRequest] Function triggered.");
    const admin = getAdminApp();

    // For onRequest, the data is in req.body.data
    const code = req.body?.data?.code;
    if (!code) {
        logger.error("[exchangeAuthCode] Invalid argument: 'code' is missing from the request body.", { body: req.body });
        res.status(400).send({ error: { message: 'The function must be called with an "authorization code".' } });
        return;
    }

    const OAUTH_CLIENT_ID = "458603936715-14i9hj110pmnr1m3mmnrsnrhctun3i9d.apps.googleusercontent.com";
    const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;

    if (!OAUTH_CLIENT_SECRET) {
        logger.error("[exchangeAuthCode] CRITICAL: OAUTH_CLIENT_SECRET is not set in environment.");
        res.status(500).send({ error: { message: 'Server is missing critical authentication configuration.' } });
        return;
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            OAUTH_CLIENT_ID,
            OAUTH_CLIENT_SECRET,
            'postmessage' // IMPORTANT: This must be 'postmessage' for this flow
        );

        logger.info("[exchangeAuthCode] Step 1: Exchanging auth code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);
        logger.info("[exchangeAuthCode] Step 1 SUCCESS: Received tokens from Google.");
        
        oauth2Client.setCredentials(tokens);
        const people = google.people({ version: 'v1', auth: oauth2Client });
        logger.info("[exchangeAuthCode] Step 2: Fetching user profile from Google People API...");
        const me = await people.people.get({
            resourceName: 'people/me',
            personFields: 'emailAddresses,names,photos',
        });
        logger.info("[exchangeAuthCode] Step 2 SUCCESS: Fetched user profile.");

        const googleUser = me.data;
        const uid = `google:${googleUser.resourceName.split('/')[1]}`;
        const email = googleUser.emailAddresses?.[0]?.value;
        const displayName = googleUser.names?.[0]?.displayName;
        const photoURL = googleUser.photos?.[0]?.url;

        if (!email) {
            res.status(500).send({ error: { message: 'Could not retrieve email from Google profile.' } });
            return;
        }

        logger.info(`[exchangeAuthCode] Step 3: Updating/creating Firebase user for UID: ${uid}`);
        try {
            await admin.auth().updateUser(uid, { email, displayName, photoURL });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                logger.info(`[exchangeAuthCode] User not found, creating new Firebase Auth user for UID: ${uid}`);
                await admin.auth().createUser({ uid, email, displayName, photoURL });
            } else {
                throw error;
            }
        }
        logger.info("[exchangeAuthCode] Step 3 SUCCESS: Firebase Auth user is synced.");

        logger.info(`[exchangeAuthCode] Step 4: Creating custom token for UID: ${uid}`);
        const customToken = await admin.auth().createCustomToken(uid);
        logger.info("[exchangeAuthCode] Step 4 SUCCESS: Custom token created.");
        
        // onRequest requires sending a response back with data nested under a 'data' property
        res.status(200).send({ data: { success: true, token: customToken } });

    } catch (error) {
        logger.error(`[exchangeAuthCode] --- CRITICAL ERROR --- : ${error.message}`, { error });
        res.status(500).send({ error: { message: `An unexpected server error occurred: ${error.message}` } });
    }
});


// --- CORRECTED UNLOCK MACHINE FUNCTION ---
exports.unlockPhysicalMachine = onCall({ secrets: ["UTEK_API_KEY"] }, async (request) => {
    logger.info("--- unlockPhysicalMachine function triggered ---");

    const UTEK_API_ENDPOINT = 'https://ttj.mjyun.com/api/v2/cmd';
    const UTEK_APP_ID = '684c01f3144cc'; // Hardcoded as per original logic
    const UTEK_KEY = process.env.UTEK_API_KEY;

    if (!UTEK_KEY) {
        logger.error("Server is missing critical machine API configuration (UTEK_API_KEY).");
        throw new HttpsError('internal', 'Server is missing critical machine API configuration.');
    }

    const { dvid, tok, parm } = request.data;
    // The cmd_type is always '1' for both rent and return operations per your instruction.
    const cmd_type = '1';

    if (!dvid || !tok || !parm) {
        logger.error("Invalid request: Missing required parameters.", { dvid, tok, parm });
        throw new HttpsError('invalid-argument', 'Invalid request: Missing required parameters.');
    }
    logger.info(`Step 1: Received data - DVID: ${dvid}, Token: ${tok}, Param: ${parm}, CmdType: ${cmd_type}`);

    try {
        const url = new URL(UTEK_API_ENDPOINT);
        url.searchParams.append('dvid', dvid);
        url.searchParams.append('appid', UTEK_APP_ID);
        url.searchParams.append('key', UTEK_KEY);
        url.searchParams.append('cmd_type', cmd_type);
        url.searchParams.append('parm', parm);
        url.searchParams.append('tok', tok);

        logger.info(`Step 2: Sending request to vendor API: ${url.toString()}`);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        
        const responseData = await response.json();
        logger.info("Step 3: Received response from vendor API.", { responseData });

        const isSuccess = responseData.ret === 0 || (responseData.msg === 'success' && typeof responseData.ret === 'undefined');

        if (!isSuccess) {
            const detailedErrorMessage = `Machine API Error: ${responseData.msg} (Code: ${responseData.ret})`;
            logger.error(`Vendor API returned an error: ${detailedErrorMessage}`);
            throw new HttpsError('internal', detailedErrorMessage);
        }

        const unlockDataString = responseData.data;
        logger.info(`Step 4 SUCCESS: Successfully received command string: "${unlockDataString}"`);
        return { success: true, unlockDataString: unlockDataString };

    } catch (error) {
        logger.error(`--- CRITICAL ERROR in unlockPhysicalMachine --- : ${error.message}`);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `An unexpected server error occurred: ${error.message}`);
    }
});


exports.makeAdmin = onCall(async (request) => {
    const admin = require("firebase-admin");
    getAdminApp(); // Ensure admin is initialized

    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to call this function.');
    }
    
    if (request.auth.token.email !== 'admin@u-dry.com') {
        throw new HttpsError('permission-denied', 'Only the primary admin user can call this function.');
    }

    const adminUid = request.auth.uid;
    const db = admin.firestore();
    const adminRef = db.collection('admins').doc(adminUid);

    try {
        await adminRef.set({
            email: request.auth.token.email,
            addedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.info(`Successfully added ${adminUid} to the admins collection.`);
        return { success: true, message: `User ${adminUid} is now an administrator. Please sign out and sign back in.` };
    } catch (error) {
        logger.error(`Error adding admin record for UID ${adminUid}:`, error);
        throw new HttpsError('internal', `An error occurred while setting admin permissions: ${error.message}`);
    }
});


exports.createStripeCheckoutSession = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
    logger.info("--- createStripeCheckoutSession function triggered ---");
    const stripeInstance = getStripe();

    if (!stripeInstance) {
        logger.error("STEP 1 FAILED: Stripe SDK could not be initialized. Ensure STRIPE_SECRET_KEY is set and valid.");
        throw new HttpsError('internal', 'The server is missing critical payment processing configuration.');
    }
    logger.info("Step 1 SUCCESS: Stripe SDK appears to be initialized.");

    if (!request.auth) {
        logger.warn("STEP 2 FAILED: User is not authenticated.");
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    logger.info(`Step 2 SUCCESS: Authentication check passed for user UID: ${request.auth.uid}`);

    const { amount, paymentType } = request.data;
    const userId = request.auth.uid;
    logger.info(`Step 3: Received data - UserID: ${userId}, Amount: ${amount}, PaymentType: ${paymentType}`);

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        logger.error(`STEP 4 FAILED: Invalid amount provided: ${amount}`);
        throw new HttpsError('invalid-argument', 'A valid amount must be provided.');
    }
    if (!paymentType || !['deposit', 'balance'].includes(paymentType)) {
        logger.error(`STEP 4 FAILED: Invalid paymentType provided: ${paymentType}`);
        throw new HttpsError('invalid-argument', 'A valid paymentType must be provided.');
    }
    logger.info("Step 4 SUCCESS: Input data validation passed.");
    
    const LIVE_APP_BASE_URL = 'https://udry-app-dev.web.app'; 
    logger.info(`Step 5: Using web app base URL: ${LIVE_APP_BASE_URL}`);

    try {
        logger.info("Step 6: Attempting to create Stripe checkout session...");
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'hkd',
                    product_data: {
                        name: paymentType === 'deposit' ? 'Security Deposit' : 'Add Balance',
                        description: paymentType === 'deposit'
                            ? 'Refundable one-time deposit for renting umbrellas.'
                            : `Top up your U-Dry account balance.`,
                    },
                    unit_amount: amount * 100, // Amount in cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${LIVE_APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&uid=${userId}`,
            cancel_url: `${LIVE_APP_BASE_URL}/payment/cancel`,
            metadata: {
                userId: userId,
                paymentType: paymentType,
                amount: amount,
            }
        });

        logger.info(`Step 7 SUCCESS: Successfully created Stripe session ${session.id} for user ${userId}.`);
        logger.info("--- createStripeCheckoutSession function finished successfully ---");
        return { success: true, id: session.id };

    } catch (error) {
        logger.error(`--- CRITICAL ERROR in createStripeCheckoutSession at Step 6/7 ---`);
        logger.error(`Error message: ${error.message}`);
        logger.error(`Error stack: ${error.stack}`);
        throw new HttpsError('internal', `An error occurred while creating the payment session: ${error.message}`);
    }
});


exports.createPaymePayment = onCall({ secrets: ["PAYME_APP_ID", "PAYME_APP_SECRET"], invoker: "public", cors: true }, async (request) => {
    logger.info("--- createPaymePayment function triggered ---");

    const PAYME_SANDBOX_BASE_URL = 'https://sandbox.api.payme.hsbc.com.hk';
    const PAYME_APP_ID = process.env.PAYME_APP_ID;
    const PAYME_APP_SECRET = process.env.PAYME_APP_SECRET;
    const NOTIFICATION_URI = 'https://us-central1-udry-app-dev.cloudfunctions.net/paymeWebhook';

    // Step 1: Validate Secrets
    if (!PAYME_APP_ID || !PAYME_APP_SECRET) {
        logger.error("Server is missing critical PayMe API configuration (PAYME_APP_ID or PAYME_APP_SECRET).");
        throw new HttpsError('internal', 'Server is missing PayMe API configuration.');
    }

    // Step 2: Validate Request Data
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { amount, paymentType } = request.data;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new HttpsError('invalid-argument', 'A valid amount must be provided.');
    }
     if (!paymentType || !['deposit', 'balance'].includes(paymentType)) {
        throw new HttpsError('invalid-argument', 'A valid paymentType must be provided.');
    }
    logger.info("PayMe Step 1: Received and validated data.", { amount, paymentType, userId: request.auth.uid });

    try {
        // --- STEP 1: GET ACCESS TOKEN ---
        logger.info("PayMe Step 2: Requesting access token...");
        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', PAYME_APP_ID);
        tokenParams.append('client_secret', PAYME_APP_SECRET);

        const tokenResponse = await fetch(`${PAYME_SANDBOX_BASE_URL}/v2/oauth2/token`, {
            method: 'POST',
            body: tokenParams,
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
            logger.error('Failed to get PayMe access token.', { status: tokenResponse.status, body: tokenData });
            throw new HttpsError('internal', `Could not authenticate with PayMe. Error: ${tokenData.error_description || 'Unknown error'}`);
        }
        const accessToken = tokenData.access_token;
        logger.info("PayMe Step 3: Successfully obtained access token.");

        // --- STEP 2: CREATE PAYMENT REQUEST ---
        const merchantReference = `UDRY-${paymentType}-${request.auth.uid}-${Date.now()}`;
        const paymentRequestBody = {
            totalAmount: amount.toFixed(2),
            currencyCode: 'HKD',
            merchantReference: merchantReference,
            notificationUri: NOTIFICATION_URI,
        };
        logger.info(`PayMe Step 4: Sending payment creation request for ${merchantReference}.`);
        
        const paymentResponse = await fetch(`${PAYME_SANDBOX_BASE_URL}/v2/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'Api-Version': '1.0', // As per documentation, it's good practice to include version
            },
            body: JSON.stringify(paymentRequestBody),
        });
        
        const paymentResponseData = await paymentResponse.json();

        // Step 5: Handle PayMe Response
        if (!paymentResponse.ok || !paymentResponseData.paymeLink) {
            const errorMessage = `PayMe API Error: ${paymentResponseData.message || 'Unknown error'} (Code: ${paymentResponseData.code})`;
            logger.error(errorMessage, { responseData: paymentResponseData });
            throw new HttpsError('internal', errorMessage);
        }

        logger.info(`PayMe Step 5 SUCCESS: Received paymeLink for ${merchantReference}.`);
        
        return { success: true, paymeLink: paymentResponseData.paymeLink };

    } catch (error) {
        logger.error(`--- CRITICAL ERROR in createPaymePayment --- : ${error.message}`);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `An unexpected server error occurred: ${error.message}`);
    }
});


exports.finalizeStripePayment = onCall({ secrets: ["STRIPE_SECRET_KEY"], invoker: "public", cors: true }, async (request) => {
    logger.info("--- finalizeStripePayment function triggered ---");
    const admin = require("firebase-admin");
    getAdminApp();
    const stripeInstance = getStripe();
    const db = admin.firestore();

    if (!stripeInstance) {
        logger.error("Step 1 FAILED: Stripe SDK is not initialized.");
        throw new HttpsError('internal', 'The server is missing critical payment processing configuration.');
    }
    logger.info("Step 1 SUCCESS: Services appear to be initialized.");

    try {
        const { sessionId, uid } = request.data;
        logger.info(`Step 2: Received data - SessionID: ${sessionId}, UID: ${uid}`);

        if (!sessionId || !uid) {
            logger.error(`Step 2 FAILED: Missing sessionId or uid.`);
            throw new HttpsError('invalid-argument', 'The function must be called with a "sessionId" and "uid".');
        }

        logger.info("Step 3: Checking for prior processing of this payment...");
        const paymentRef = db.collection('processed_stripe_payments').doc(sessionId);
        const paymentDoc = await paymentRef.get();
        if (paymentDoc.exists) {
            logger.info(`Step 3 SUCCESS: Idempotency check passed. Payment for session ${sessionId} has already been processed.`);
            return { success: true, message: "Payment already processed." };
        }
        logger.info(`Step 3 SUCCESS: This is a new payment session.`);

        let session;
        try {
            logger.info(`Step 4: Attempting to retrieve session '${sessionId}' from Stripe...`);
            session = await stripeInstance.checkout.sessions.retrieve(sessionId);
            logger.info(`Step 4 SUCCESS: Successfully retrieved session from Stripe.`);
        } catch (stripeError) {
            if (stripeError.type === 'StripeInvalidRequestError') {
                logger.error(`Step 4 FAILED: Stripe session not found: ${stripeError.message}`);
                throw new HttpsError('not-found', 'Stripe session not found.');
            }
            logger.error(`Step 4 FAILED: A Stripe error occurred: ${stripeError.message}`);
            throw new HttpsError('internal', `A Stripe error occurred: ${stripeError.message}`);
        }
        
        logger.info("Step 5: Validating retrieved session data and performing security check...");
        const { userId: metadataUserId, paymentType, amount } = session.metadata;
        const amountNum = parseFloat(amount);
        
        if (session.payment_status !== 'paid') {
            throw new HttpsError('failed-precondition', 'Stripe session not paid.');
        }

        if (metadataUserId !== uid) {
            logger.error(`CRITICAL SECURITY CHECK FAILED: URL UID (${uid}) does not match Stripe metadata UID (${metadataUserId}).`);
            throw new HttpsError('permission-denied', 'User ID does not match session metadata.');
        }
        
        if (!paymentType || !['deposit', 'balance'].includes(paymentType)) {
            throw new HttpsError('invalid-argument', 'Invalid paymentType in session metadata.');
        }
        if (isNaN(amountNum) || amountNum <= 0) {
            throw new HttpsError('invalid-argument', 'Invalid amount in session metadata.');
        }
        logger.info(`Step 5 SUCCESS: Session data and security check passed.`);

        const userDocRef = db.collection('users').doc(uid); // Use uid from URL
        
        logger.info(`Step 6: Starting Firestore transaction to update user balance...`);
        await db.runTransaction(async (transaction) => {
            const freshPaymentDoc = await transaction.get(paymentRef);
            if (freshPaymentDoc.exists) {
                logger.warn("Transaction check: Payment already processed inside transaction.");
                return;
            }
            
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'User document not found.');
            }

            if (paymentType === 'deposit') {
                if (!session.payment_intent) {
                    throw new HttpsError('internal', 'Payment Intent ID is missing from the successful Stripe session.');
                }
                logger.info(`Recording Payment Intent ID: ${session.payment_intent} for deposit.`);
                transaction.update(userDocRef, { 
                    deposit: admin.firestore.FieldValue.increment(amountNum),
                    depositPaymentIntentId: session.payment_intent 
                });
            } else if (paymentType === 'balance') {
                transaction.update(userDocRef, { 
                    balance: admin.firestore.FieldValue.increment(amountNum) 
                });
            }
            
            transaction.set(paymentRef, {
                userId: uid,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                amount: amountNum,
                paymentType: paymentType,
            });
        });

        logger.info(`Step 6 SUCCESS: Firestore transaction completed for user ${uid}.`);
        logger.info("--- finalizeStripePayment function finished successfully ---");
        return { success: true, message: `Successfully updated ${paymentType} for user ${uid}.` };

    } catch (error) {
        logger.error(`--- CRITICAL ERROR in finalizeStripePayment --- : ${error.message}`);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `An unexpected server error occurred: ${error.message}`);
    }
});


exports.endRentalTransaction = onCall(async (request) => {
    const admin = require("firebase-admin");
    const db = getAdminApp().firestore();

    // Step 1: Authentication Check
    if (!request.auth) {
        logger.error("[Cloud Function] Authentication check failed: No auth context.");
        throw new HttpsError('unauthenticated', 'You must be logged in to end a rental.');
    }
    const userId = request.auth.uid;
    logger.info(`[Cloud Function] Starting endRental for user: ${userId}`);

    // Step 2: Input Validation
    const { returnedToStallId, activeRentalData } = request.data;
    logger.info("[Cloud Function] Received data:", { returnedToStallId, hasActiveRental: !!activeRentalData });

    if (!returnedToStallId) {
        logger.error(`[Cloud Function] Validation failed for user ${userId}: returnedToStallId is missing.`);
        throw new HttpsError('invalid-argument', 'Missing returnedToStallId.');
    }
    if (!activeRentalData || typeof activeRentalData !== 'object') {
        logger.error(`[Cloud Function] Validation failed for user ${userId}: activeRentalData is missing or not an object.`);
        throw new HttpsError('invalid-argument', 'Missing or invalid activeRentalData.');
    }
    if (typeof activeRentalData.startTime !== 'number' || typeof activeRentalData.stallId !== 'string') {
        logger.error(`[Cloud Function] Validation failed for user ${userId}: activeRentalData is malformed.`);
        throw new HttpsError('invalid-argument', 'Malformed activeRentalData.');
    }
    
    try {
        // Step 3: Fetch Stall Information
        const returnedStallDocRef = db.collection('stalls').doc(returnedToStallId);
        const returnedStallSnap = await returnedStallDocRef.get();
        if (!returnedStallSnap.exists) {
            logger.error(`[Cloud Function] Stall lookup failed for user ${userId}: Stall ${returnedToStallId} not found.`);
            throw new HttpsError('not-found', 'Return stall not found.');
        }
        const returnedStall = returnedStallSnap.data();
        logger.info(`[Cloud Function] Successfully fetched return stall data for ${returnedStall.name}`);

        // Step 4: Cost Calculation
        const endTime = Date.now();
        const durationHours = (endTime - activeRentalData.startTime) / (1000 * 60 * 60);

        const HOURLY_RATE = 5;
        const DAILY_CAP = 25;
        let calculatedCost = 0;

        if (activeRentalData.isFree === true) { // Explicitly check for true
            calculatedCost = 0;
        } else if (durationHours > 72) {
            calculatedCost = 100; // Forfeit deposit
        } else {
            const fullDays = Math.floor(durationHours / 24);
            const remainingHours = durationHours % 24;
            const cappedRemainingCost = Math.min(Math.ceil(remainingHours) * HOURLY_RATE, DAILY_CAP);
            calculatedCost = (fullDays * DAILY_CAP) + cappedRemainingCost;
        }
        const finalCost = Math.min(calculatedCost, 100);
        logger.info(`[Cloud Function] Calculated final cost for user ${userId}: ${finalCost} (Duration: ${durationHours.toFixed(2)} hours)`);

        // Step 5: Prepare Database Documents
        const userDocRef = db.collection('users').doc(userId);
        const newRentalHistoryDocRef = db.collection('rentals').doc();
        
        const rentalHistory = {
            rentalId: newRentalHistoryDocRef.id,
            userId: userId,
            stallId: activeRentalData.stallId,
            stallName: activeRentalData.stallName || 'Unknown',
            startTime: activeRentalData.startTime,
            isFree: activeRentalData.isFree || false,
            endTime,
            durationHours,
            finalCost,
            returnedToStallId,
            returnedToStallName: returnedStall.name,
            logs: activeRentalData.logs || [],
        };
        
        // Step 6: Execute Atomic Batch Write
        logger.info(`[Cloud Function] Preparing to commit batch write for user ${userId}.`);
        const batch = db.batch();
        batch.set(newRentalHistoryDocRef, rentalHistory);
        batch.update(userDocRef, { 
            activeRental: null, 
            balance: admin.firestore.FieldValue.increment(-finalCost) 
        });
        batch.update(returnedStallDocRef, { 
            availableUmbrellas: admin.firestore.FieldValue.increment(1),
            nextActionSlot: admin.firestore.FieldValue.increment(1) 
        });

        await batch.commit();

        logger.info(`[Cloud Function] SUCCESS: Batch write completed. Rental ended for user ${userId}. Cost: ${finalCost}`);
        return { success: true, message: 'Rental ended successfully.' };

    } catch (error) {
        logger.error(`[Cloud Function] CRITICAL ERROR in endRentalTransaction for user ${userId}:`, error);
        if (error instanceof HttpsError) {
            throw error; // Re-throw HttpsError directly
        }
        // For unexpected errors, wrap them in a generic internal error
        throw new HttpsError('internal', 'An unexpected server error occurred while ending the rental.');
    }
});


exports.requestDepositRefund = onCall({ secrets: ["STRIPE_SECRET_KEY"], invoker: "public", cors: true }, async (request) => {
    logger.info("--- requestDepositRefund function triggered ---");
    const admin = require("firebase-admin");
    const db = getAdminApp().firestore();
    const stripeInstance = getStripe();

    // Step 1: Authentication & Service Check
    if (!request.auth) {
        logger.error("[requestDepositRefund] Auth check failed: No auth context.");
        throw new HttpsError('unauthenticated', 'You must be logged in to request a refund.');
    }
    if (!stripeInstance) {
        logger.error("[requestDepositRefund] Stripe SDK is not initialized.");
        throw new HttpsError('internal', 'The server is missing critical payment processing configuration.');
    }
    const userId = request.auth.uid;
    logger.info(`[requestDepositRefund] User ${userId} initiated refund request.`);

    try {
        const userDocRef = db.collection('users').doc(userId);
        const refundRecordRef = db.collection('refunds').doc();
        
        // Step 2: Use a transaction for safety
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'User data not found.');
            }
            const userData = userDoc.data();
            logger.info(`[requestDepositRefund] Fetched user data inside transaction.`, { balance: userData.balance });
            
            // Step 3: Critical Business Logic Checks
            if (userData.activeRental) {
                throw new HttpsError('failed-precondition', 'Cannot refund deposit with an active rental.');
            }
            if (userData.balance < 0) {
                const message = `Refund denied. You must clear your negative balance of HK$${Math.abs(userData.balance).toFixed(2)} before requesting a deposit refund.`;
                throw new HttpsError('failed-precondition', message);
            }
            if (!userData.deposit || userData.deposit <= 0) {
                throw new HttpsError('failed-precondition', 'No deposit found to refund.');
            }
            if (!userData.depositPaymentIntentId) {
                throw new HttpsError('failed-precondition', 'Original deposit transaction ID not found. Please contact support.');
            }

            logger.info(`[requestDepositRefund] All pre-flight checks passed for user ${userId}.`);

            // Step 4: Perform Stripe Refund
            logger.info(`[requestDepositRefund] Attempting to refund Stripe Payment Intent: ${userData.depositPaymentIntentId}`);
            await stripeInstance.refunds.create({
                payment_intent: userData.depositPaymentIntentId,
            });
            logger.info(`[requestDepositRefund] Stripe refund successful.`);

            // Step 5: Update Firestore database
            transaction.update(userDocRef, {
                deposit: 0,
                depositPaymentIntentId: null 
            });

            // Step 6: Create an audit record
            transaction.set(refundRecordRef, {
                userId: userId,
                refundedAt: admin.firestore.FieldValue.serverTimestamp(),
                amount: userData.deposit,
                originalPaymentIntentId: userData.depositPaymentIntentId,
                status: 'succeeded'
            });
            logger.info(`[requestDepositRefund] Firestore updated and audit record created.`);
        });

        logger.info(`[requestDepositRefund] Transaction completed successfully for user ${userId}.`);
        return { success: true, message: "Your deposit has been successfully refunded. It may take 5-10 business days to appear on your statement." };

    } catch (error) {
        logger.error(`[requestDepositRefund] CRITICAL ERROR for user ${userId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `An unexpected error occurred while processing your refund request.`);
    }
});


exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
     logger.info('[WEBHOOK] Received a Stripe request.');
     res.status(200).send({ received: true });
});

exports.paymeWebhook = functions.https.onRequest(async (req, res) => {
    logger.info('[WEBHOOK] Received a PayMe request.', { body: req.body });
    const admin = require("firebase-admin");
    const db = getAdminApp().firestore();

    // Respond to PayMe immediately to acknowledge receipt.
    res.status(200).send({ success: true });

    try {
        const { merchantReference, totalAmount, paymentStatus } = req.body;
        logger.info(`[PayMe Webhook] Processing notification for ${merchantReference}`);

        if (paymentStatus !== 'PAYMENT_SUCCESS') {
            logger.warn(`[PayMe Webhook] Non-success status received: ${paymentStatus} for ${merchantReference}. No action taken.`);
            return;
        }

        // Use merchantReference for idempotency check
        const paymentRef = db.collection('processed_payme_payments').doc(merchantReference);
        const paymentDoc = await paymentRef.get();
        if (paymentDoc.exists) {
            logger.info(`[PayMe Webhook] Idempotency check passed. Payment for ${merchantReference} has already been processed.`);
            return;
        }
        logger.info(`[PayMe Webhook] New payment notification for ${merchantReference}.`);

        // Parse merchantReference to get user UID and payment type
        const parts = merchantReference.split('-');
        if (parts.length < 4 || parts[0] !== 'UDRY') {
            logger.error(`[PayMe Webhook] Invalid merchantReference format: ${merchantReference}`);
            return;
        }
        const paymentType = parts[1]; // 'deposit' or 'balance'
        const userId = parts[2];
        const amountNum = parseFloat(totalAmount);

        if (!['deposit', 'balance'].includes(paymentType) || !userId || isNaN(amountNum)) {
             logger.error(`[PayMe Webhook] Could not parse valid data from merchantReference: ${merchantReference}`);
             return;
        }

        const userDocRef = db.collection('users').doc(userId);
        
        await db.runTransaction(async (transaction) => {
            const freshPaymentDoc = await transaction.get(paymentRef);
            if (freshPaymentDoc.exists) {
                logger.warn("[PayMe Webhook] Transaction check: Payment already processed inside transaction.");
                return;
            }

            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                 logger.error(`[PayMe Webhook] User document not found for UID: ${userId}`);
                 return; // Do not throw error, just log and exit
            }

            if (paymentType === 'deposit') {
                transaction.update(userDocRef, { 
                    deposit: admin.firestore.FieldValue.increment(amountNum)
                });
            } else if (paymentType === 'balance') {
                transaction.update(userDocRef, { 
                    balance: admin.firestore.FieldValue.increment(amountNum) 
                });
            }

            // Mark this transaction as processed
            transaction.set(paymentRef, {
                userId: userId,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                amount: amountNum,
                paymentType: paymentType,
                status: paymentStatus,
            });
        });
        
        logger.info(`[PayMe Webhook] Successfully processed payment for user ${userId}. Amount: ${amountNum}, Type: ${paymentType}`);

    } catch (error) {
        logger.error('[PayMe Webhook] CRITICAL ERROR while processing notification:', error);
    }
});
    
    

    













    


