"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Form validation schema
const formSchema = z.object({
  title: z
    .string()
    .min(3, {
      message: "Title must be at least 3 characters",
    })
    .max(100, {
      message: "Title must not exceed 100 characters",
    }),
  description: z
    .string()
    .max(1000, {
      message: "Description must not exceed 1000 characters",
    })
    .nullable(),
  youtubeVideoId: z
    .string()
    .min(11, {
      message: "YouTube video ID must be valid",
    })
    .max(12, {
      message: "YouTube video ID must be valid",
    }),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewContentPage() {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Setup react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      youtubeVideoId: "",
    },
  });

  // Watch the YouTube ID field for changes
  const youtubeVideoId = form.watch("youtubeVideoId");

  // Create content mutation
  const createContentMutation = api.content.createContent.useMutation({
    onSuccess: (data) => {
      toast.success("Content added successfully!");
      router.push(`/content/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add content");
    },
  });

  // Handle form submission
  function onSubmit(data: FormValues) {
    createContentMutation.mutate({
      title: data.title,
      description: data.description,
      youtubeVideoId: data.youtubeVideoId,
    });
  }

  // Update preview when YouTube ID changes
  function updatePreview() {
    if (youtubeVideoId && youtubeVideoId.length >= 11) {
      setPreviewUrl(`https://www.youtube.com/embed/${youtubeVideoId}`);
    }
  }

  return (
    <main className="container py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Add New Content</h1>
          <p className="text-muted-foreground">
            Share a YouTube video with the community
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a descriptive title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear title helps users understand what the video is
                    about.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a brief description of the video (optional)"
                      className="min-h-[120px] resize-y"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what users will learn from this video.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtubeVideoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Video ID</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g. dQw4w9WgXcQ" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={updatePreview}
                    >
                      Preview
                    </Button>
                  </div>
                  <FormDescription>
                    The ID is found in the YouTube URL after "v=" (e.g.,
                    youtube.com/watch?v=dQw4w9WgXcQ)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewUrl && (
              <div className="bg-card rounded-lg border p-4">
                <h3 className="mb-2 font-medium">Video Preview</h3>
                <div className="aspect-video w-full overflow-hidden rounded">
                  <iframe
                    width="100%"
                    height="100%"
                    src={previewUrl}
                    title="YouTube video preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="border-0"
                  ></iframe>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/content")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createContentMutation.isPending}>
                {createContentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Content
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
