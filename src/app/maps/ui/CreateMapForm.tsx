import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { CardContent, CardFooter } from "~/components/ui/card";

interface CreateMapFormProps {
  onSubmit: (name: string, description: string | null) => void;
  isSubmitting: boolean;
}

const CreateMapForm: React.FC<CreateMapFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setNameError("Map name is required");
      return;
    }

    setNameError("");
    onSubmit(name, description || null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Map Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="Enter map name"
            disabled={isSubmitting}
            className={nameError ? "border-destructive" : ""}
          />
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter map description"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Map"}
        </Button>
      </CardFooter>
    </form>
  );
};

export default CreateMapForm;
