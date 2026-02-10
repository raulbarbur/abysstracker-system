import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET no está definida en variables de entorno.",
  );
}

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

const publicRoutes = ["/login"];

const publicApiRoutes: string[] = [];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isApiRoute = path.startsWith("/api");
  const isPublicRoute =
    publicRoutes.includes(path) ||
    publicApiRoutes.some((r) => path.startsWith(r));
  const isStaticFile =
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path.includes("favicon.ico") ||
    /\.(png|jpg|jpeg|gif|svg|webp|css|js)$/.test(path);

  if (isPublicRoute || isStaticFile) {
    return NextResponse.next();
  }

  const session = req.cookies.get("session")?.value;

  const unauthorizedResponse = () => {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session");
    return response;
  };

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { payload } = await jwtVerify(session, SECRET_KEY, {
      algorithms: ["HS256"],
    });

    if (!isApiRoute) {
      const role = payload.role as string | undefined;

      if (role === "STAFF") {
        if (path === "/") {
          return NextResponse.redirect(new URL("/pos", req.url));
        }

        const allowedPrefixes = ["/pos", "/agenda", "/pets"];
        const isAllowed = allowedPrefixes.some((prefix) =>
          path.startsWith(prefix),
        );

        if (!isAllowed) {
          return NextResponse.redirect(new URL("/pos", req.url));
        }
      }
    }
    return NextResponse.next();
  } catch (error) {
    return unauthorizedResponse();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
