import { redirect } from "next/navigation";

/**
 * Home page — redirects to the generation dashboard.
 *
 * Authenticated users will see the generate form.
 * Unauthenticated users will see the login prompt inside the generate page.
 */
export default function HomePage() {
  redirect("/generate");
}
