import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const redirectWithCookies = (destination: URL) => {
    const redirectResponse = NextResponse.redirect(destination);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  };

  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === "/admin/login";
  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/report") ||
    pathname.startsWith("/notifications") ||
    (pathname.startsWith("/admin") && !isAdminLogin);

  if (!url || !key) {
    if (requiresAuth) {
      const loginUrl = new URL(isAdminLogin ? "/admin/login" : "/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return redirectWithCookies(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (requiresAuth && !user) {
    const loginUrl = new URL(pathname.startsWith("/admin") ? "/admin/login" : "/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(loginUrl);
  }

  if (pathname.startsWith("/admin") && !isAdminLogin && user) {
    const { data: profile, error } = await supabase
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (error || profile?.role !== "admin") {
      return redirectWithCookies(new URL("/dashboard", request.url));
    }
  }

  if (isAdminLogin && user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "admin") return redirectWithCookies(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
