"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function TestPage() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [browserSupport, setBrowserSupport] = useState<{
    supported: boolean;
    userAgent: string;
    checks: {
      viewTransitionName: boolean;
      startViewTransition: boolean;
      viewTransitionAtRule: boolean;
    };
  } | null>(null);

  const items = [
    { id: "item-1", title: "First Item", color: "bg-blue-500" },
    { id: "item-2", title: "Second Item", color: "bg-green-500" },
    { id: "item-3", title: "Third Item", color: "bg-purple-500" },
    { id: "item-4", title: "Fourth Item", color: "bg-red-500" },
  ];

  useEffect(() => {
    // Check browser support for View Transitions
    const checkBrowserSupport = () => {
      const checks = {
        viewTransitionName: CSS.supports("view-transition-name", "test"),
        startViewTransition: "startViewTransition" in document,
        viewTransitionAtRule: CSS.supports(
          "@view-transition { navigation: auto; }",
        ),
      };

      const supported = checks.viewTransitionName && checks.startViewTransition;

      setBrowserSupport({
        supported,
        userAgent: navigator.userAgent,
        checks,
      });
    };

    checkBrowserSupport();
  }, []);

  const handleItemClick = (itemId: string) => {
    setActiveItem(activeItem === itemId ? null : itemId);
  };

  const handleTestTransition = () => {
    if (!document.startViewTransition) {
      alert("Your browser does not support the View Transitions API");
      return;
    }

    document.startViewTransition(() => {
      setActiveItem(activeItem ? null : "item-1");
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div
          className="mb-8 text-center"
          style={{ viewTransitionName: "test-header" }}
        >
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            View Transition Test
          </h1>
          <p className="text-lg text-muted-foreground">
            Testing view transitions with interactive elements
          </p>
        </div>

        {/* Browser Support Status */}
        {browserSupport && (
          <div
            className={`mb-8 rounded-lg p-6 ${
              browserSupport.supported
                ? "border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                : "border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
            }`}
          >
            <h2
              className={`mb-3 text-xl font-semibold ${
                browserSupport.supported
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              Browser Compatibility:{" "}
              {browserSupport.supported ? "✅ Supported" : "❌ Not Supported"}
            </h2>

            <div className="mb-4 space-y-2 text-sm">
              <div
                className={`flex items-center space-x-2 ${
                  browserSupport.checks.viewTransitionName
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                <span>
                  {browserSupport.checks.viewTransitionName ? "✅" : "❌"}
                </span>
                <span>CSS view-transition-name property</span>
              </div>

              <div
                className={`flex items-center space-x-2 ${
                  browserSupport.checks.startViewTransition
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                <span>
                  {browserSupport.checks.startViewTransition ? "✅" : "❌"}
                </span>
                <span>JavaScript document.startViewTransition() method</span>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs dark:bg-blue-900">
                  Same-document
                </span>
              </div>

              <div
                className={`flex items-center space-x-2 ${
                  browserSupport.checks.viewTransitionAtRule
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                <span>
                  {browserSupport.checks.viewTransitionAtRule ? "✅" : "❌"}
                </span>
                <span>CSS @view-transition at-rule</span>
                <span className="rounded bg-purple-100 px-2 py-1 text-xs dark:bg-purple-900">
                  Cross-document
                </span>
              </div>
            </div>

            {/* Explanation of what works with current support level */}
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <h3 className="mb-2 font-semibold text-blue-800 dark:text-blue-200">
                What works with your current support:
              </h3>

              {browserSupport.checks.startViewTransition ? (
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <div>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ✅ Same-document transitions work:
                    </span>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• Clicking items on this page</li>
                      <li>• "Test JS Transition" button</li>
                      <li>• State changes within single pages</li>
                      <li>• SPA-style transitions</li>
                    </ul>
                  </div>

                  {!browserSupport.checks.viewTransitionAtRule && (
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        ❌ Cross-document transitions don't work:
                      </span>
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• Navigation between /test and /test/second</li>
                        <li>• Page-to-page animations</li>
                        <li>• @view-transition CSS rules</li>
                        <li>• Automatic navigation transitions</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">
                    ❌ No view transitions supported
                  </span>
                  <p className="mt-1">
                    You'll see regular CSS transitions instead of view
                    transitions.
                  </p>
                </div>
              )}
            </div>

            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer font-medium">
                View Browser Details
              </summary>
              <p className="mt-2 font-mono text-xs">
                {browserSupport.userAgent}
              </p>
            </details>

            {!browserSupport.supported && (
              <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Browser Version Requirements:
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  <li>
                    • <strong>Same-document transitions:</strong> Chrome 111+,
                    Safari 18+, Firefox 141+
                  </li>
                  <li>
                    • <strong>Cross-document transitions:</strong> Chrome 126+,
                    Safari 18+, Firefox 141+
                  </li>
                </ul>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  View transitions will fall back to regular CSS transitions in
                  unsupported browsers.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mb-8 flex justify-center space-x-4">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/test/second">
            <Button variant="outline">Second Test Page (SPA)</Button>
          </Link>
          <Button
            onClick={() => setActiveItem(null)}
            variant={activeItem ? "default" : "secondary"}
          >
            Reset View
          </Button>
          <Button
            onClick={handleTestTransition}
            variant="outline"
            className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800"
          >
            Test JS Transition
          </Button>
        </div>

        {/* Cross-document navigation test */}
        <div className="mb-8 rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-950">
          <h3 className="mb-3 text-lg font-semibold text-orange-800 dark:text-orange-200">
            🔄 Test Real Cross-Document Transitions
          </h3>
          <p className="mb-4 text-sm text-orange-700 dark:text-orange-300">
            Next.js uses client-side routing (SPA), which doesn't trigger
            cross-document view transitions. To test real cross-document
            transitions like the{" "}
            <a
              href="https://mdn.github.io/dom-examples/view-transitions/mpa/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              MDN demo
            </a>
            , try these methods that force actual page navigation:
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="/test/second" className="inline-block">
              <Button
                variant="outline"
                className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800"
              >
                Force Navigation (href)
              </Button>
            </a>

            <Button
              variant="outline"
              className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800"
              onClick={() => (window.location.href = "/test/second")}
            >
              Force Reload Navigation
            </Button>

            <Button
              variant="outline"
              className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload Current Page
            </Button>
          </div>

          <div className="mt-4 text-xs text-orange-600 dark:text-orange-400">
            <strong>Note:</strong> These buttons bypass Next.js routing and
            force real page navigation, which should trigger cross-document view
            transitions if your browser supports them.
          </div>
        </div>

        {/* Grid of items with transitions */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`cursor-pointer rounded-lg p-6 text-white transition-all duration-300 hover:scale-105 ${item.color} ${activeItem === item.id ? "scale-110 shadow-2xl ring-4 ring-white/50" : "shadow-lg"} `}
              style={{
                viewTransitionName: `test-item-${item.id}`,
              }}
              onClick={() => handleItemClick(item.id)}
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm opacity-90">
                Click to {activeItem === item.id ? "deselect" : "select"}
              </p>
            </div>
          ))}
        </div>

        {/* Detail section that appears when an item is selected */}
        {activeItem && (
          <div
            className="mt-8 rounded-lg bg-card p-8 shadow-xl"
            style={{ viewTransitionName: "test-detail" }}
          >
            <h2 className="mb-4 text-2xl font-bold text-card-foreground">
              Selected: {items.find((item) => item.id === activeItem)?.title}
            </h2>
            <p className="text-muted-foreground">
              This detail section demonstrates how view transitions can work
              with dynamic content. The transition name ensures smooth
              animations when content appears and disappears.
            </p>
            <div className="mt-6 flex space-x-4">
              <Button onClick={() => setActiveItem(null)}>Close Details</Button>
              <Button variant="outline">More Actions</Button>
            </div>
          </div>
        )}

        {/* Additional test elements */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            className="rounded-lg bg-primary p-6 text-primary-foreground"
            style={{ viewTransitionName: "test-card-1" }}
          >
            <h3 className="mb-2 text-xl font-semibold">Transition Card 1</h3>
            <p>
              This card has a unique transition name and will animate smoothly
              during navigation.
            </p>
          </div>

          <div
            className="rounded-lg bg-secondary p-6 text-secondary-foreground"
            style={{ viewTransitionName: "test-card-2" }}
          >
            <h3 className="mb-2 text-xl font-semibold">Transition Card 2</h3>
            <p>
              Each element with a viewTransitionName will maintain its identity
              across page changes.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 rounded-lg bg-muted p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            How to Test Transitions:
          </h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Check the browser compatibility status above</li>
            <li>• Click on the colored items above to see state transitions</li>
            <li>
              • Try the "Test JS Transition" button for programmatic transitions
            </li>
            <li>• Navigate back to home and return to see page transitions</li>
            <li>
              • Each element with a viewTransitionName should animate smoothly
            </li>
            <li>• Open browser DevTools to inspect transition names</li>
          </ul>

          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
              Debugging Tips:
            </h4>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <li>
                • Open DevTools → Console to see any view transition errors
              </li>
              <li>
                • Check DevTools → Elements → Styles for viewTransitionName
                values
              </li>
              <li>
                • Enable "Animations" tab in DevTools to see transition timeline
              </li>
              <li>• Try different browsers to compare support levels</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
