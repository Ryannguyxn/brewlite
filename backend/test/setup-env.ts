// Test-only value: production reads JWT_SECRET from the environment, with no fallback.
process.env.JWT_SECRET = 'brewlite-test-only-secret-at-least-32-bytes';
