import { useState, useCallback } from "react";
import { api } from "~/commons/trpc/react";
import { useToast } from "~/hooks/use-toast";
import { useMutationWithCallbacks } from "~/hooks/use-trpc-with-callbacks";
import { useDispatch, addMap } from "~/store";
import { mapContractToStoreAdapter } from "~/store/adapters/contract-to-store.adapters";
export function useCreateMapFormState() {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  const [formSubmissionError, setFormSubmissionError] = useState<string | null>(
    null,
  );

  // Create map mutation with callbacks
  const mutation = api.map.create.useMutation();
  const createMapMutation = useMutationWithCallbacks(mutation, {
    onSuccess: (newMap) => {
      // Convert API response to store entity using adapter
      const mapEntity = mapContractToStoreAdapter(newMap);
      // Add the new map to the store
      dispatch(addMap(mapEntity));

      toast({
        title: "Success!",
        description: "HexMap created successfully",
      });
      setFormIsSubmitting(false);
      setFormSubmissionError(null);
      // Could add logic to navigate to the new map
    },
    onError: (error) => {
      toast({
        title: "Error creating map",
        description: error.message,
        variant: "destructive",
      });
      setFormIsSubmitting(false);
      setFormSubmissionError(error.message);
    },
  });

  const SubmitMapForm = useCallback(
    (name: string, description: string | null) => {
      setFormIsSubmitting(true);
      setFormSubmissionError(null);
      createMapMutation.mutate({
        name,
        description,
      });
    },
    [createMapMutation],
  );

  return {
    lifeCycle: {
      formIsSubmitting,
      formSubmissionError,
    },
    data: {
      // No specific data entities to expose in this component
    },
    events: {
      SubmitMapForm,
    },
  };
}
