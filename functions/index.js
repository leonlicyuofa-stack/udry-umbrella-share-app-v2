// functions/index.js
const functions = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

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
    
    const APP_CALLBACK_URL = 'udryapp';
    logger.info(`Step 5: Using universal app callback URL: ${APP_CALLBACK_URL}`);

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
            success_url: `${APP_CALLBACK_URL}://payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_CALLBACK_URL}://payment/cancel`,
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
        
        const { sessionId } = request.data;
        const userId = request.auth.uid;

        logger.info("Step 3: Validating sessionId input...");
        if (!sessionId || typeof sessionId !== 'string') {
            logger.error(`Step 3 FAILED: Request from user ${userId} has a missing or invalid sessionId.`);
            throw new HttpsError('invalid-argument', 'The function must be called with a valid "sessionId".');
        }
        logger.info(`Step 3 SUCCESS: Session ID received: ${sessionId}`);

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
        if (metadataUserId !== userId) {
            throw new HttpsError('permission-denied', 'User ID does not match session metadata.');
        }
        if (!paymentType || !['deposit', 'balance'].includes(paymentType)) {
            throw new HttpsError('invalid-argument', 'Invalid paymentType in session metadata.');
        }
        if (isNaN(amountNum) || amountNum <= 0) {
            throw new HttpsError('invalid-argument', 'Invalid amount in session metadata.');
        }
        logger.info(`Step 6 SUCCESS: Session data validated.`);

        const userDocRef = db.collection('users').doc(userId);
        
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
                userId: userId,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                amount: amountNum,
                paymentType: paymentType,
            });
        });

        logger.info(`Step 7 SUCCESS: Firestore transaction completed for user ${userId}.`);
        logger.info("--- finalizeStripePayment function finished successfully ---");
        return { success: true, message: `Successfully updated ${paymentType} for user ${userId}.` };

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

    