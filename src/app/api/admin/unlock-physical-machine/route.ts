// src/app/api/admin/unlock-physical-machine/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';

// This is a server-side route handler.
// It securely communicates with the UTEK (machine vendor) API.

// Ensure these are set in your .env.local file
const PARTNER_ID = process.env.NEXT_PUBLIC_UTEK_API_PARTNER_ID;
const API_SECRET_KEY = process.env.UTEK_API_SECRET_KEY;
const UTEK_API_ENDPOINT = 'http://api.utek.com.cn:8000/api/v2/unlock';

function generateSign(partnerId: string, secretKey: string, timestamp: string): string {
    const stringToSign = `${partnerId}${timestamp}${secretKey}`;
    return crypto.createHash('md5').update(stringToSign).digest('hex');
}

export async function POST(request: Request) {
    if (!PARTNER_ID || !API_SECRET_KEY) {
        return NextResponse.json({ success: false, message: 'Server is missing critical machine API configuration.' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { dvid, tok, parm, cmd_type } = body;

        if (!dvid || !tok || !parm || !cmd_type) {
            return NextResponse.json({ success: false, message: 'Invalid request: Missing required parameters.' }, { status: 400 });
        }

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const sign = generateSign(PARTNER_ID, API_SECRET_KEY, timestamp);

        const apiRequestBody = {
            partner_id: PARTNER_ID,
            dvid: dvid,
            tok: tok,
            parm: parm,
            cmd_type: cmd_type,
            ts: timestamp,
            sign: sign,
        };

        const response = await fetch(UTEK_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiRequestBody),
        });

        const responseData = await response.json();

        if (responseData.ret !== 0) {
            // Forward the error message from the UTEK API
            return NextResponse.json({ success: false, message: `Machine API Error: ${responseData.msg} (Code: ${responseData.ret})` }, { status: 400 });
        }

        // The 'data' field from UTEK contains the final command string
        const unlockDataString = responseData.data;

        return NextResponse.json({ success: true, unlockDataString: unlockDataString });

    } catch (error: any) {
        console.error('Error in unlock-physical-machine handler:', error);
        return NextResponse.json({ success: false, message: `An unexpected server error occurred: ${error.message}` }, { status: 500 });
    }
}
