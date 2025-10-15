"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const token = cookies().get("sessionToken")?.value;

  if (token) {
    redirect("/dashboard");
  }

  redirect("/login");
}
