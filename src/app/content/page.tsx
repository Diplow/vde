import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";
import { format } from "date-fns";
import { EyeIcon, CalendarIcon, UserIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Content Library",
  description: "Browse our collection of educational YouTube videos",
};

export default async function ContentLibraryPage() {
  const contents = await api.content.getAllContents.query({});

  return (
    <main className="container py-6">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Library</h1>
          <p className="text-muted-foreground">
            Browse our collection of educational YouTube videos
          </p>
        </div>
        <Button asChild>
          <Link href="/content/new">Add New Content</Link>
        </Button>
      </div>

      {contents.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="mt-4 text-xl font-semibold">No content yet</h2>
          <p className="text-muted-foreground mb-4 mt-2 text-sm">
            Get started by adding your first video content.
          </p>
          <Button asChild>
            <Link href="/content/new">Add New Content</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => (
            <Card key={content.data.id} className="overflow-hidden">
              <div className="bg-muted aspect-video w-full overflow-hidden">
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
              <CardHeader className="p-4">
                <CardTitle className="line-clamp-1">
                  {content.data.title}
                </CardTitle>
                <CardDescription className="line-clamp-1">
                  By {content.authorName || "Unknown"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-4 pt-0">
                {content.data.description && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {content.data.description}
                  </p>
                )}

                <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="h-3 w-3" />
                    <span>{content.data.viewCount ?? 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      {format(new Date(content.data.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    <span>{content.authorName || "Unknown"}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button asChild variant="secondary" className="w-full">
                  <Link href={`/content/${content.data.id}`}>Watch Video</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
