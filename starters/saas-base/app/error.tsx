'use client';

import { useEffect } from 'react';

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[App Error]', error);
        // If you use Sentry: Sentry.captureException(error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">
                An unexpected error occurred. Please try again.
            </p>
            <button
                onClick={reset}
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
                Try again
            </button>
        </div>
    );
}
