import { redirect } from "next/navigation";

/**
 * Root page that redirects to the home page
 * This maintains a clean URL structure while organizing code
 */
export default function RootPage() {
  redirect("/home");
}