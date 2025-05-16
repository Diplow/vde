import React from "react";
import MapCard from "./MapCard";

interface Map {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | string;
  owner?: {
    id: string;
    name?: string;
  };
}

interface MapListProps {
  maps: Map[];
  onViewMap: (id: string) => void;
}

const MapList: React.FC<MapListProps> = ({ maps, onViewMap }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {maps.map((map) => (
        <MapCard
          key={map.id}
          id={map.id}
          name={map.name}
          description={map.description}
          createdAt={new Date(map.createdAt)}
          onView={onViewMap}
        />
      ))}
    </div>
  );
};

export default React.memo(MapList);
