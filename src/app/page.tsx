import { redirect } from "next/navigation";

export default function Home() {
  redirect("/train-status");
  return null;
}
