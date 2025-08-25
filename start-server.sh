#!/bin/bash
# Start Firebase emulators in the background.
firebase emulators:start --only auth,firestore --project=udry-app-dev --import=./firebase-export --export-on-exit=./firebase-export &

# Wait for a few seconds to give the emulators time to initialize.
sleep 5

# Start the Next.js server in the foreground.
npm run start:next
