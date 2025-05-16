"use client";

import React from "react";
import CreateMapForm from "../ui/CreateMapForm";
import FormError from "../ui/FormError";
import { useCreateMapFormState } from "./state";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";

const CreateMapFormContainer: React.FC = () => {
  const { lifeCycle, events } = useCreateMapFormState();

  return (
    <Card id="create-map-form">
      <CardHeader>
        <CardTitle>Create New HexMap</CardTitle>
        <CardDescription>
          Fill in the details to create a new map
        </CardDescription>
      </CardHeader>
      <CreateMapForm
        onSubmit={events.SubmitMapForm}
        isSubmitting={lifeCycle.formIsSubmitting}
      />
      <FormError error={lifeCycle.formSubmissionError} />
    </Card>
  );
};

export default CreateMapFormContainer;
