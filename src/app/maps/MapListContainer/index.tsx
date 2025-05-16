"use client";

import MapList from "../ui/MapList";
import EmptyMapList from "../ui/EmptyMapList";
import LoadingState from "../ui/LoadingState";
import ErrorDisplay from "../ui/ErrorDisplay";
import { useMapListContainerState } from "./state";

const MapListContainer: React.FC = () => {
  const { lifeCycle, data, events } = useMapListContainerState();

  if (lifeCycle.mapsAreLoading) {
    return <LoadingState message="Loading maps..." />;
  }

  if (lifeCycle.mapsLoadingError) {
    return <ErrorDisplay message={lifeCycle.mapsLoadingError} />;
  }

  if (data.maps.length === 0) {
    return <EmptyMapList onCreateNew={events.CreateNewClick} />;
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">My Maps</h2>
      <MapList maps={data.maps} onViewMap={events.ViewMapClick} />
    </div>
  );
};

export default MapListContainer;
