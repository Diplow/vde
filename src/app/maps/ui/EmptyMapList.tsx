import React from "react";
import { Button } from "~/components/ui/button";

interface EmptyMapListProps {
  onCreateNew: () => void;
}

const EmptyMapList: React.FC<EmptyMapListProps> = ({ onCreateNew }) => {
  return (
    <div className="rounded-md border bg-muted/20 py-16 text-center">
      <h3 className="mb-2 text-lg font-medium">No maps found</h3>
      <p className="mb-6 text-muted-foreground">
        Create your first map to get started
      </p>
      <Button onClick={onCreateNew}>Create New Map</Button>
    </div>
  );
};

export default EmptyMapList;
