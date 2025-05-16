import React from "react";

interface FormErrorProps {
  error: string | null;
}

const FormError: React.FC<FormErrorProps> = ({ error }) => {
  if (!error) return null;

  return <div className="px-6 pb-4 text-sm text-red-500">{error}</div>;
};

export default FormError;
