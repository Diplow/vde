"use client";

import React from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function SecondTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-8 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="mx-auto max-w-4xl">
        {/* Header with same transition name as first test page */}
        <div
          className="mb-8 text-center"
          style={{ viewTransitionName: "test-header" }}
        >
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Second Test Page
          </h1>
          <p className="text-lg text-muted-foreground">
            This page shares transition names with the first test page
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex justify-center space-x-4">
          <Link href="/test">
            <Button variant="outline">Back to First Test</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>

        {/* Same transition names as first page to test cross-page transitions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            className="rounded-lg bg-purple-500 p-8 text-white"
            style={{ viewTransitionName: "test-card-1" }}
          >
            <h3 className="mb-4 text-2xl font-semibold">Shared Card 1</h3>
            <p className="mb-4">
              This card has the same transition name as a card on the first test
              page. When you navigate between pages, this element should
              smoothly transform.
            </p>
            <div className="text-sm opacity-75">
              viewTransitionName: "test-card-1"
            </div>
          </div>

          <div
            className="rounded-lg bg-indigo-500 p-8 text-white"
            style={{ viewTransitionName: "test-card-2" }}
          >
            <h3 className="mb-4 text-2xl font-semibold">Shared Card 2</h3>
            <p className="mb-4">
              This card also shares a transition name. Notice how the content,
              color, and position might be different, but the transition creates
              a visual connection.
            </p>
            <div className="text-sm opacity-75">
              viewTransitionName: "test-card-2"
            </div>
          </div>
        </div>

        {/* Unique elements for this page */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className="rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 p-6 text-white shadow-lg"
              style={{ viewTransitionName: `second-page-item-${num}` }}
            >
              <div className="text-center">
                <div className="mb-2 text-2xl font-bold">{num}</div>
                <div className="text-sm opacity-90">Item {num}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions specific to this page */}
        <div className="mt-12 rounded-lg bg-white/10 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Cross-Page Transition Test:
          </h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Navigate between this page and the first test page</li>
            <li>• Watch how elements with shared transition names transform</li>
            <li>• The header and two cards should animate smoothly</li>
            <li>• Elements unique to each page will fade in/out</li>
            <li>• Notice the different background gradients transitioning</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/test">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Test Cross-Page Transition
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
