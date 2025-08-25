"use client"; // Error components must be Client Components

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError Boundary Caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '20px', border: '2px solid red', color: 'red', margin: '10px' }}>
          <h2>Something went wrong! (Global Error Boundary Active)</h2>
          <p>{error?.message}</p>
          {error?.digest && <p>Digest: {error.digest}</p>}
          <button onClick={() => reset()} style={{ padding: '5px 10px', marginRight: '10px' }}>Try again</button>
          <a href="/">Go to Homepage</a>
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <pre style={{ whiteSpace: 'pre-wrap', border: '1px solid #ccc', padding: '10px', marginTop: '20px', color: 'initial' }}>
              {error.stack}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
