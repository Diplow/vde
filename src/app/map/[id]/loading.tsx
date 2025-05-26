export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>

        <h1 className="mb-4 text-center text-xl font-semibold text-gray-800">
          Loading Map...
        </h1>

        <p className="mb-4 text-center text-gray-600">
          Please wait while we prepare your interactive map.
        </p>

        <noscript>
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  JavaScript Required
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    This interactive map requires JavaScript to function
                    properly. Please enable JavaScript in your browser to
                    continue.
                  </p>
                  <p className="mt-2">
                    Without JavaScript, you will remain on this page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </noscript>
      </div>
    </div>
  );
}
