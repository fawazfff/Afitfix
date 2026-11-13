"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton(){
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 async function signOut(){
  setBusy(true);
  const {error}=await createClient().auth.signOut();
  if(error){setBusy(false);return;}
  router.replace("/");router.refresh();
 }
 return <button className="signout-button" onClick={signOut} disabled={busy} aria-label="Sign out">{busy?<LoaderCircle className="spin" size={16}/>:<LogOut size={16}/>}<span>Sign out</span></button>;
}