// functions/index.js
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
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


// --- SERVER-SIDE AUTH FUNCTION (v2 onCall) ---
// This was converted from onRequest to onCall to match the client-side implementation.
exports.exchangeAuthCodeForToken = onCall({ secrets: ["OAUTH_CLIENT_SECRET"] }, async (request) => {
    logger.info("[exchangeAuthCode] Function triggered.");
    const admin = getAdminApp();

    const code = request.data?.code;
    if (!code) {
        logger.error("[exchangeAuthCode] Invalid argument: 'code' is missing from the request data.", { data: request.data });
        throw new HttpsError('invalid-argument', 'The function must be called with an "authorization code".');
    }

    const OAUTH_CLIENT_ID = "458603936715-14i9hj110pmnr1m3mmnrsnrhctun3i9d.apps.googleusercontent.com";
    const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;

    if (!OAUTH_CLIENT_SECRET) {
        logger.error("[exchangeAuthCode] CRITICAL: OAUTH_CLIENT_SECRET is not set in environment.");
        throw new HttpsError('internal', 'Server is missing critical authentication configuration.');
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            OAUTH_CLIENT_ID,
            OAUTH_CLIENT_SECRET,
            'postmessage' 
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
            throw new HttpsError('internal', 'Could not retrieve email from Google profile.');
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
        
        return { success: true, token: customToken };

    } catch (error) {
        logger.error(`[exchangeAuthCode] --- CRITICAL ERROR --- : ${error.message}`, { error });
        throw new HttpsError('internal', `An unexpected server error occurred: ${error.message}`);
    }
});


// --- UNLOCK MACHINE FUNCTION (v2 onCall) ---
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


// --- MAKE ADMIN FUNCTION (v2 onCall) ---
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


// --- STRIPE CHECKOUT FUNCTION (v2 onCall) ---
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


// --- PAYME PAYMENT FUNCTION (v2 onCall) ---
exports.createPaymePayment = onCall({ secrets: ["PAYME_APP_ID", "PAYME_APP_SECRET"] }, async (request) => {
    logger.info("--- createPaymePayment function triggered ---");

    const PAYME_SANDBOX_BASE_URL = 'https://sandbox.api.payme.hsbc.com.hk';
    const PAYME_APP_ID = process.env.PAYME_APP_ID;
    const PAYME_APP_SECRET = process.env.PAYME_APP_SECRET;
    const NOTIFICATION_URI = 'https://us-central1-udry-app-dev.cloudfunctions.net/paymeWebhook';

    if (!PAYME_APP_ID || !PAYME_APP_SECRET) {
        logger.error("Server is missing critical PayMe API configuration (PAYME_APP_ID or PAYME_APP_SECRET).");
        throw new HttpsError('internal', 'Server is missing PayMe API configuration.');
    }

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
                'Api-Version': '1.0', 
            },
            body: JSON.stringify(paymentRequestBody),
        });
        
        const paymentResponseData = await paymentResponse.json();

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


// --- FINALIZE STRIPE PAYMENT (v2 onCall) ---
exports.finalizeStripePayment = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
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

        const userDocRef = db.collection('users').doc(uid); 
        
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


// --- END RENTAL (v2 onCall) ---
exports.endRentalTransaction = onCall(async (request) => {
    const admin = require("firebase-admin");
    const db = getAdminApp().firestore();

    if (!request.auth) {
        logger.error("[Cloud Function] Authentication check failed: No auth context.");
        throw new HttpsError('unauthenticated', 'You must be logged in to end a rental.');
    }
    const userId = request.auth.uid;
    logger.info(`[Cloud Function] Starting endRental for user: ${userId}`);

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
        const returnedStallDocRef = db.collection('stalls').doc(returnedToStallId);
        const returnedStallSnap = await returnedStallDocRef.get();
        if (!returnedStallSnap.exists) {
            logger.error(`[Cloud Function] Stall lookup failed for user ${userId}: Stall ${returnedToStallId} not found.`);
            throw new HttpsError('not-found', 'Return stall not found.');
        }
        const returnedStall = returnedStallSnap.data();
        logger.info(`[Cloud Function] Successfully fetched return stall data for ${returnedStall.name}`);

        const endTime = Date.now();
        const durationHours = (endTime - activeRentalData.startTime) / (1000 * 60 * 60);

        const HOURLY_RATE = 5;
        const DAILY_CAP = 25;
        let calculatedCost = 0;

        if (activeRentalData.isFree === true) { 
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
            throw error;
        }
        throw new HttpsError('internal', 'An unexpected server error occurred while ending the rental.');
    }
});


// --- DEPOSIT REFUND (v2 onCall) ---
exports.requestDepositRefund = onCall({ secrets: ["STRIPE_SECRET_KEY"] }, async (request) => {
    logger.info("--- requestDepositRefund function triggered ---");
    const admin = require("firebase-admin");
    const db = getAdminApp().firestore();
    const stripeInstance = getStripe();

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
        
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new HttpsError('not-found', 'User data not found.');
            }
            const userData = userDoc.data();
            logger.info(`[requestDepositRefund] Fetched user data inside transaction.`, { balance: userData.balance });
            
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

            logger.info(`[requestDepositRefund] Attempting to refund Stripe Payment Intent: ${userData.depositPaymentIntentId}`);
            await stripeInstance.refunds.create({
                payment_intent: userData.depositPaymentIntentId,
            });
            logger.info(`[requestDepositRefund] Stripe refund successful.`);

            transaction.update(userDocRef, {
                deposit: 0,
                depositPaymentIntentId: null 
            });

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


// --- WEBHOOKS (v2 onRequest) ---
exports.stripeWebhook = onRequest(async (req, res) => {
     logger.info('[WEBHOOK] Received a Stripe request.');
     res.status(200).send({ received: true });
});

exports.paymeWebhook = onRequest(async (req, res) => {
    logger.info('[WEBHOOK] Received a PayMe request.', { body: req.body });
    const admin = require("firebase-admin");
    const db = getAdminApp().firestore();

    res.status(200).send({ success: true });

    try {
        const { merchantReference, totalAmount, paymentStatus } = req.body;
        logger.info(`[PayMe Webhook] Processing notification for ${merchantReference}`);

        if (paymentStatus !== 'PAYMENT_SUCCESS') {
            logger.warn(`[PayMe Webhook] Non-success status received: ${paymentStatus} for ${merchantReference}. No action taken.`);
            return;
        }

        const paymentRef = db.collection('processed_payme_payments').doc(merchantReference);
        const paymentDoc = await paymentRef.get();
        if (paymentDoc.exists) {
            logger.info(`[PayMe Webhook] Idempotency check passed. Payment for ${merchantReference} has already been processed.`);
            return;
        }
        logger.info(`[PayMe Webhook] New payment notification for ${merchantReference}.`);

        const parts = merchantReference.split('-');
        if (parts.length < 4 || parts[0] !== 'UDRY') {
            logger.error(`[PayMe Webhook] Invalid merchantReference format: ${merchantReference}`);
            return;
        }
        const paymentType = parts[1];
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
                 return;
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

// --- AI SUPPORT CHATBOT (v2 onCall) ---
// Requires: GOOGLE_AI_API_KEY set as a Firebase secret
// Set with: firebase functions:secrets:set GOOGLE_AI_API_KEY
const UDRY_KNOWLEDGE_BASE = `
**Account & Wallet**
- App available on Apple App Store and Google Play Store.
- Sign up with email. HK$100 deposit required to begin renting.
- Use "Request Deposit" in Account Wallet to refund deposit.
- If balance doesn't update, restart the app.

**Finding & Renting**
- Use the map to find nearby stations.
- Tap "Scan & Rent" and scan the QR code on the machine.
- If QR won't scan, close and reopen the app.
- Select the correct machine code (e.g., "CDKJ") in the pop-up.
- IMPORTANT: Never pull the umbrella downwards. Slide it sideways along the rail to the exit opening.
- If the machine times out, retry the rental process in the app.

**Pricing**
- HK$5 per hour, capped at HK$25 per 24-hour period.
- Must return within 72 hours or HK$100 deposit is forfeited.
- Track usage with the Active Rental timer in the app.

**Returning**
- Return to any U-Dry station with an available empty slot.
- Scan QR code → select machine code → slide umbrella fully into rail → confirm "Return Confirmed."
- If timer keeps running: check umbrella is fully slotted, restart app, then contact support.
- We will investigate any timer discrepancies and only charge the correct amount.

**Q&A**
- Cost: HK$5/hr, max HK$25/day
- Deposit: HK$100, refundable via Account Wallet
- To remove umbrella: slide sideways along rail, never pull down
- Machine timeout: retry rental in app
- Balance not updated: restart app
- QR won't scan: close and reopen app
- Return to different station: yes, any available U-Dry station
- Time limit: 72 hours before deposit forfeited
- Android: yes, available on Google Play Store
`;

exports.askSupport = onCall({ secrets: ["GOOGLE_AI_API_KEY"] }, async (request) => {
    logger.info("[askSupport] Function triggered.");

    const { question, language } = request.data;

    if (!question || typeof question !== 'string' || question.trim() === '') {
        throw new HttpsError('invalid-argument', 'A valid question is required.');
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        logger.error("[askSupport] GOOGLE_AI_API_KEY is not set.");
        throw new HttpsError('internal', 'AI service is not configured.');
    }

    const lang = language || 'en';
    const languageInstruction = lang === 'zh-HK'
        ? 'You MUST reply in Traditional Chinese (繁體中文).'
        : 'Reply in English.';

    const prompt = `You are a helpful and friendly customer support chatbot for 'U-Dry', a smart umbrella sharing app in Hong Kong. Answer questions concisely and accurately using only the knowledge base below.

U-DRY KNOWLEDGE BASE:
${UDRY_KNOWLEDGE_BASE}

Important Rules:
1. Always briefly acknowledge the user's problem with empathy before giving a solution.
2. For technical glitches (frozen app, timer not updating), always suggest closing and reopening the app first.
3. ${languageInstruction}
4. If the question is unrelated to U-Dry, politely say you can only answer U-Dry questions.

User's Question: ${question}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 500, temperature: 0.4 },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            logger.error("[askSupport] Gemini API error:", errText);
            throw new HttpsError('internal', 'AI service returned an error.');
        }

        const data = await response.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!answer) {
            throw new HttpsError('internal', 'Empty response from AI service.');
        }

        logger.info("[askSupport] Successfully generated answer.");
        return { answer };

    } catch (err) {
        if (err instanceof HttpsError) throw err;
        logger.error("[askSupport] Unexpected error:", err);
        throw new HttpsError('internal', 'An unexpected error occurred.');
    }
});

// --- WATCHDOG: Monitor user document changes ---
exports.userWalletMonitor = onDocumentWritten(
  "users/{userId}",
  async (event) => {
    const db = getAdminApp().firestore();
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();
    const userId = event.params.userId;

    // SCENARIO 1: NEW USER SIGNUP
    if (!beforeData && afterData) {
      logger.info(`[Watchdog] New user signed up: ${userId}`);
      await db.collection('mail').add({
        to: ["leonlicyuofa@gmail.com", "udryhk@gmail.com"],
        message: {
          subject: `👋 New U-Dry User Signed Up`,
          text: `A new user just signed up!\n\nUID: ${userId}\nEmail: ${afterData.email || 'unknown'}\nName: ${afterData.displayName || 'unknown'}\nTime: ${new Date().toISOString()}`,
        }
      });
      return;
    }

    // SCENARIO 2: DOCUMENT COMPLETELY DELETED
    if (beforeData && !afterData) {
      logger.error(`[Watchdog] CRITICAL: User document DELETED for ${userId}`);
      await db.collection('mail').add({
        to: ["leonlicyuofa@gmail.com", "udryhk@gmail.com"],
        message: {
          subject: `🚨 CRITICAL: User Document Deleted - ${userId}`,
          text: `A user document was completely deleted!\n\nUID: ${userId}\nEmail: ${beforeData.email || 'unknown'}\nPrevious deposit: HK$${beforeData.deposit || 0}\nPrevious balance: HK$${beforeData.balance || 0}\nTime: ${new Date().toISOString()}\n\nImmediate action required!`,
        }
      });
      return;
    }
    
    // SCENARIO 3: BOTH BALANCE AND DEPOSIT HIT 0 SIMULTANEOUSLY
    if (beforeData && afterData) {
        const depositWasPositive = (beforeData.deposit || 0) > 0;
        const balanceWasPositive = (beforeData.balance || 0) > 0;
        const depositNowZero = (afterData.deposit || 0) === 0;
        const balanceNowZero = (afterData.balance || 0) === 0;

        if (depositWasPositive && balanceWasPositive && depositNowZero && balanceNowZero) {
          logger.error(`[Watchdog] CRITICAL: Both balance and deposit zeroed for user ${userId}`);
          await db.collection('mail').add({
            to: ["leonlicyuofa@gmail.com", "udryhk@gmail.com"],
            message: {
              subject: `🚨 CRITICAL: User Wallet Wiped - ${afterData.email || userId}`,
              text: `URGENT: A user's wallet was zeroed out suspiciously!\n\nUID: ${userId}\nEmail: ${afterData.email || 'unknown'}\nName: ${afterData.displayName || 'unknown'}\n\nBEFORE:\nDeposit: HK$${beforeData.deposit || 0}\nBalance: HK$${beforeData.balance || 0}\n\nAFTER:\nDeposit: HK$${afterData.deposit || 0}\nBalance: HK$${afterData.balance || 0}\n\nTime: ${new Date().toISOString()}\n\nThis matches the Rocky incident pattern. Check immediately!`,
            }
          });
        }
    }
  }
);
