import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminData } from "@/app/actions/admin";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 未ログインはログインページへ
  if (!user) redirect("/login");

  // 管理者以外はトップへ
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) redirect("/map");

  const { places, hooks, wikiEdits } = await getAdminData();

  return (
    <AdminClient
      places={places as any}
      hooks={hooks as any}
      wikiEdits={wikiEdits as any}
    />
  );
}
