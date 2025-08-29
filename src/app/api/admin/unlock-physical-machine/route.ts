// src/app/api/admin/unlock-physical-machine/route.ts

import { NextResponse } from 'next/server';

// This is a server-side route handler.
// It securely communicates with the UTEK (machine vendor) API.

const UTEK_API_ENDPOINT = 'https://ttj.mjyun.com/api/v2/cmd';
const UTEK_APP_ID = process.env.NEXT_PUBLIC_UTEK_APP_ID || '684c01f3144cc';
const UTEK_KEY = process.env.UTEK_API_KEY || '684c01f314508';


export async function POST(request: Request) {
    if (!UTEK_APP_ID || !UTEK_KEY) {
        return NextResponse.json({ success: false, message: 'Server is missing critical machine API configuration (APP_ID or KEY).' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { dvid, tok, parm, cmd_type } = body;

        if (!dvid || !tok || !parm || !cmd_type) {
            return NextResponse.json({ success: false, message: 'Invalid request: Missing required parameters.' }, { status: 400 });
        }

        // Construct the URL with query parameters, as per the new method.
        const url = new URL(UTEK_API_ENDPOINT);
        url.searchParams.append('dvid', dvid);
        url.searchParams.append('appid', UTEK_APP_ID);
        url.searchParams.append('key', UTEK_KEY);
        url.searchParams.append('cmd_type', cmd_type);
        url.searchParams.append('parm', parm);
        url.searchParams.append('tok', tok);
        
        // Make the GET request to the vendor's API.
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const responseData = await response.json();
        
        // The success condition from the vendor's documentation is `ret === 0`.
        if (responseData.ret !== 0) {
            // ENHANCED ERROR LOGGING:
            // Instead of just sending the message, we now format it to include the specific error code.
            const detailedErrorMessage = `Machine API Error: ${responseData.msg} (Code: ${responseData.ret})`;
            return NextResponse.json({ success: false, message: detailedErrorMessage }, { status: 400 });
        }

        // The 'data' field from UTEK contains the final command string
        const unlockDataString = responseData.data;

        return NextResponse.json({ success: true, unlockDataString: unlockDataString });

    } catch (error: any) {
        console.error('Error in unlock-physical-machine handler:', error);
        return NextResponse.json({ success: false, message: `An unexpected server error occurred: ${error.message}` }, { status: 500 });
    }
}
