"use client";

import React from "react";
import MapListContainer from "./MapListContainer";
import CreateMapFormContainer from "./CreateMapFormContainer";
import PageHeader from "./PageHeader";
import { Separator } from "~/components/ui/separator";

export default function MapsPage() {
  return (
    <div className="container py-8">
      <PageHeader title="Maps" description="Create and manage your maps" />
      <MapListContainer />
      <Separator className="my-8" />
      <CreateMapFormContainer />
    </div>
  );
}
