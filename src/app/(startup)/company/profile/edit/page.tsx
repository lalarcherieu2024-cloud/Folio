import { redirect } from "next/navigation";

// Editing now happens on the profile page itself, like the student profile.
export default function EditCompanyProfile() {
  redirect("/company/profile");
}
