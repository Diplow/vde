import { useToast } from "~/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "~/store";
import { api } from "~/commons/trpc/react";
import { useQueryWithCallbacks } from "~/hooks/use-trpc-with-callbacks";
import { addMaps, getAllMaps } from "~/store";
import { useCallback, useReducer } from "react";
import { mapContractToStoreAdapter } from "~/store/adapters/contract-to-store.adapters";
import { MapAPIContract } from "~/commons/api-types/map";

// Define state type
type MapListState = {
  mapsAreLoading: boolean;
  mapsLoadingError: string | null;
};

// Define action types
type MapListAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

// Define reducer function
function mapListReducer(
  state: MapListState,
  action: MapListAction,
): MapListState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, mapsAreLoading: action.payload };
    case "SET_ERROR":
      return { ...state, mapsLoadingError: action.payload };
    default:
      return state;
  }
}

export function useMapListContainerState() {
  const { toast } = useToast();
  const router = useRouter();
  const dispatch = useDispatch();

  // Initialize state with useReducer
  const [state, dispatchLocal] = useReducer(mapListReducer, {
    mapsAreLoading: true,
    mapsLoadingError: null,
  });

  // Get maps from store
  const maps = useSelector(getAllMaps);

  // Fetch maps using tRPC with callbacks
  const query = api.map.getMany.useQuery({ limit: 50 });
  useQueryWithCallbacks(query, {
    onSuccess: (fetchedMaps: MapAPIContract[]) => {
      dispatchLocal({ type: "SET_LOADING", payload: false });
      // Convert API response to store entities using adapter
      const mapEntities = fetchedMaps.map(mapContractToStoreAdapter);
      // Update global store
      dispatch(addMaps(mapEntities));
    },
    onError: (error) => {
      dispatchLocal({ type: "SET_LOADING", payload: false });
      dispatchLocal({ type: "SET_ERROR", payload: error?.message });
      toast({
        title: "Error",
        description: "Failed to fetch maps",
        variant: "destructive",
      });
    },
  });

  const ViewMapClick = useCallback(
    (id: string) => {
      router.push(`/map/${id}`);
    },
    [router],
  );

  const CreateNewClick = useCallback(() => {
    // Scroll to create form
    document.getElementById("create-map-form")?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  return {
    lifeCycle: {
      mapsAreLoading: state.mapsAreLoading,
      mapsLoadingError: state.mapsLoadingError,
    },
    data: {
      maps,
    },
    events: {
      ViewMapClick,
      CreateNewClick,
    },
  };
}
