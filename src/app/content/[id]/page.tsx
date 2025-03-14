import { Metadata } from "next";
import { notFound } from "next/navigation";
import { YouTubeViewer } from "~/components/content/youtube-viewer";
import { api } from "~/trpc/server";

interface ContentPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return {
      title: "Invalid Content",
    };
  }

  try {
    const content = await api.content.getContent.query({ id });
    return {
      title: content.data.title,
      description: content.data.description || undefined,
    };
  } catch (error) {
    return {
      title: "Content Not Found",
    };
  }
}

export default async function ContentPage({ params }: ContentPageProps) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    notFound();
  }

  return (
    <main className="container py-6">
      <div className="mx-auto max-w-4xl">
        <YouTubeViewer contentId={id} showRelations={true} />
      </div>
    </main>
  );
}
