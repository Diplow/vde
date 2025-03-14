"use client";

import React, { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { type Content } from "~/server/db/schema";

interface YouTubeViewerProps {
  contentId: number;
  showRelations?: boolean;
  autoIncrement?: boolean;
}

export function YouTubeViewer({
  contentId,
  showRelations = false,
  autoIncrement = true,
}: YouTubeViewerProps) {
  const [shouldIncrementView, setShouldIncrementView] = useState(autoIncrement);

  // Fetch content data
  const {
    data: content,
    isLoading,
    error,
  } = api.content.getContent.useQuery(
    { id: contentId },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  );

  // Fetch related data if showRelations is true
  const { data: relatedEvents } = api.content.getRelatedEvents.useQuery(
    { id: contentId },
    {
      enabled: showRelations && !!content,
      refetchOnWindowFocus: false,
    },
  );

  const { data: relatedResources } = api.content.getRelatedResources.useQuery(
    { id: contentId },
    {
      enabled: showRelations && !!content,
      refetchOnWindowFocus: false,
    },
  );

  // Increment view count mutation
  const incrementViewMutation = api.content.incrementViewCount.useMutation();

  useEffect(() => {
    // Increment view count once when the component mounts
    if (shouldIncrementView && content) {
      incrementViewMutation.mutate({ id: contentId });
      setShouldIncrementView(false);
    }
  }, [shouldIncrementView, content, incrementViewMutation, contentId]);

  if (isLoading) {
    return <ContentSkeleton />;
  }

  if (error || !content) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading content. {error?.message || "Content not found."}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>{content.data.title}</CardTitle>
        <CardDescription>
          By {content.authorName || "Unknown"} •
          {content.data.viewCount !== null
            ? ` ${content.data.viewCount} views • `
            : " "}
          Added on {format(new Date(content.data.createdAt), "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="aspect-video w-full overflow-hidden rounded-md">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${content.data.youtubeVideoId}`}
            title={content.data.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="border-0"
          ></iframe>
        </div>

        {content.data.description && (
          <div className="text-muted-foreground mt-4 text-sm">
            {content.data.description}
          </div>
        )}

        {showRelations && (
          <div className="mt-6 space-y-4">
            {relatedEvents && relatedEvents.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-semibold">Related Events</h3>
                <div className="space-y-2">
                  {relatedEvents.map((event) => (
                    <div
                      key={event.data.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div>
                        <p className="font-medium">{event.data.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {format(new Date(event.data.date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/events/${event.data.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedResources && relatedResources.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-semibold">
                  Related Resources
                </h3>
                <div className="space-y-2">
                  {relatedResources.map((resource) => (
                    <div
                      key={resource.data.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div>
                        <p className="font-medium">{resource.data.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {resource.data.type}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/resources/${resource.data.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContentSkeleton() {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full rounded-md" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </CardContent>
    </Card>
  );
}
