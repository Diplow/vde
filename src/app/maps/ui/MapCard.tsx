import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";

interface MapCardProps {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  onView: (id: string) => void;
}

const MapCard: React.FC<MapCardProps> = ({
  id,
  name,
  description,
  createdAt,
  onView,
}) => {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="truncate">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {description || "No description provided"}
        </p>
        <p className="text-xs text-muted-foreground">
          Created: {createdAt.toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => onView(id)}>
          View Map
        </Button>
      </CardFooter>
    </Card>
  );
};

export default React.memo(MapCard);
