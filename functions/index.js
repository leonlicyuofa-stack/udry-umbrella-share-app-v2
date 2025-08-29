// functions/index.js
const functions = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const fetch = require("node-fetch");

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

// --- NEW UNLOCK MACHINE FUNCTION ---
exports.unlockPhysicalMachine = onCall({ secrets: ["UTEK_API_KEY"], invoker: "public" }, async (request) => {
    logger.info("--- unlockPhysicalMachine function triggered ---");

    const UTEK_API_ENDPOINT = 'https://ttj.mjyun.com/api/v2/cmd';
    const UTEK_APP_ID = process.env.NEXT_PUBLIC_UTEK_APP_ID || '684c01f3144cc';
    const UTEK_KEY = process.env.UTEK_API_KEY;

    if (!UTEK_APP_ID || !UTEK_KEY) {
        logger.error("Server is missing critical machine API configuration (APP_ID or KEY).");
        throw new HttpsError('internal', 'Server is missing critical machine API configuration.');
    }

    const { dvid, tok, parm, cmd_type } = request.data;

    if (!dvid || !tok || !parm || !cmd_type) {
        logger.error("Invalid request: Missing required parameters.", { dvid, tok, parm, cmd_type });
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
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const responseData = await response.json();
        logger.info("Step 3: Received response from vendor API.", { responseData });

        // **MODIFIED LOGIC:** Check for success more flexibly.
        // A successful response might have ret: 0 OR msg: "success" but no ret code.
        const isSuccess = responseData.ret === 0 || (responseData.msg === 'success' && typeof responseData.ret === 'undefined');

        if (!isSuccess) {
            const detailedErrorMessage = `Machine API Error: ${responseData.msg} (Code: ${responseData.ret})`;
            logger.error(`Vendor API returned an error: ${detailedErrorMessage}`);
            throw new HttpsError('internal', detailedErrorMessage);
        }

        const unlockDataString = responseData.data;
        logger.info(`Step 4 SUCCESS: Successfully received unlock data string: "${unlockDataString}"`);
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
    
    const APP_DEEP_LINK_BASE_URL = 'udry://payment/success'; 
    const LIVE_APP_BASE_URL = 'https://udry-app-dev.web.app'; 
    logger.info(`Step 5: Using deep link base URL: ${APP_DEEP_LINK_BASE_URL}`);

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
            success_url: `${APP_DEEP_LINK_BASE_URL}?session_id={CHECKOUT_SESSION_ID}&uid=${userId}`,
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

exports.finalizeStripePayment = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
    logger.info("--- finalizeStripePayment function triggered ---");
    const admin = require("firebase-admin");
    getAdminApp(); // Ensure admin is initialized
    const stripeInstance = getStripe();
    const db = admin.firestore();
    
    if (!stripeInstance) {
        logger.error("Step 1 FAILED: Stripe SDK is not initialized. Check startup logs and ensure STRIPE_SECRET_KEY is set.");
        throw new HttpsError('internal', 'The server is missing critical payment processing configuration.');
    }
    logger.info("Step 1 SUCCESS: Services appear to be initialized.");

    try {
        logger.info("Step 2: Checking authentication...");
        if (!request.auth) {
            logger.warn("Step 2 FAILED: User is not authenticated.");
            throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
        }
        logger.info(`Step 2 SUCCESS: Authentication check passed for user UID: ${request.auth.uid}`);
        
        const { sessionId, uid } = request.data; // Now expecting uid as well
        const callerUserId = request.auth.uid;

        logger.info("Step 3: Validating sessionId and uid input...");
        if (!sessionId || typeof sessionId !== 'string') {
            logger.error(`Step 3 FAILED: Request from user ${callerUserId} has a missing or invalid sessionId.`);
            throw new HttpsError('invalid-argument', 'The function must be called with a valid "sessionId".');
        }
        if (!uid || typeof uid !== 'string') {
            logger.error(`Step 3 FAILED: Request from user ${callerUserId} has a missing or invalid uid.`);
            throw new HttpsError('invalid-argument', 'The function must be called with a valid "uid".');
        }
        if (callerUserId !== uid) {
            logger.error(`CRITICAL SECURITY CHECK FAILED: Caller UID (${callerUserId}) does not match deep link UID (${uid}).`);
            throw new HttpsError('permission-denied', 'Caller ID does not match the user ID from the payment link.');
        }

        logger.info(`Step 3 SUCCESS: Session ID received: ${sessionId} for user ${uid}`);

        logger.info("Step 4: Checking for prior processing of this payment...");
        const paymentRef = db.collection('processed_stripe_payments').doc(sessionId);
        const paymentDoc = await paymentRef.get();
        if (paymentDoc.exists) {
            logger.info(`Step 4 SUCCESS: Idempotency check passed. Payment for session ${sessionId} has already been processed.`);
            return { success: true, message: "Payment already processed." };
        }
        logger.info(`Step 4 SUCCESS: This is a new payment session.`);

        let session;
        try {
            logger.info(`Step 5: Attempting to retrieve session '${sessionId}' from Stripe...`);
            session = await stripeInstance.checkout.sessions.retrieve(sessionId);
            logger.info(`Step 5 SUCCESS: Successfully retrieved session from Stripe.`);
        } catch (stripeError) {
            logger.error(`Step 5 FAILED: Error retrieving session from Stripe: ${stripeError.message}`);
            if (stripeError.type === 'StripeInvalidRequestError') {
                throw new HttpsError('not-found', 'Stripe session not found.');
            }
            throw new HttpsError('internal', `A Stripe error occurred: ${stripeError.message}`);
        }
        
        logger.info("Step 6: Validating retrieved session data...");
        const { userId: metadataUserId, paymentType, amount } = session.metadata;
        const amountNum = parseFloat(amount);
        
        if (session.payment_status !== 'paid') {
            throw new HttpsError('failed-precondition', 'Stripe session not paid.');
        }
        if (metadataUserId !== callerUserId) {
            logger.error(`CRITICAL SECURITY CHECK FAILED: Caller UID (${callerUserId}) does not match Stripe metadata UID (${metadataUserId}).`);
            throw new HttpsError('permission-denied', 'User ID does not match session metadata.');
        }
        if (!paymentType || !['deposit', 'balance'].includes(paymentType)) {
            throw new HttpsError('invalid-argument', 'Invalid paymentType in session metadata.');
        }
        if (isNaN(amountNum) || amountNum <= 0) {
            throw new HttpsError('invalid-argument', 'Invalid amount in session metadata.');
        }
        logger.info(`Step 6 SUCCESS: Session data validated.`);

        const userDocRef = db.collection('users').doc(callerUserId);
        
        logger.info(`Step 7: Starting Firestore transaction to update user balance...`);
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
                transaction.update(userDocRef, { deposit: admin.firestore.FieldValue.increment(amountNum) });
            } else if (paymentType === 'balance') {
                transaction.update(userDocRef, { balance: admin.firestore.FieldValue.increment(amountNum) });
            }
            
            transaction.set(paymentRef, {
                userId: callerUserId,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                amount: amountNum,
                paymentType: paymentType,
            });
        });

        logger.info(`Step 7 SUCCESS: Firestore transaction completed for user ${callerUserId}.`);
        logger.info("--- finalizeStripePayment function finished successfully ---");
        return { success: true, message: `Successfully updated ${paymentType} for user ${callerUserId}.` };

    } catch (error) {
        logger.error(`--- CRITICAL ERROR in finalizeStripePayment --- : ${error.message}`);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `An unexpected error occurred: ${error.message}`);
    }
});


exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
     logger.info('[WEBHOOK] Received a request.');
     res.status(200).send({ received: true });
});
