import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";
import { medplum } from "@/libs/medplumClient";
import { parse } from "cookie";
import config from "../../../../../config";

export async function GET(req: NextRequest) {
  const tokenUrl = "https://api.medplum.com/oauth2/token";
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { message: "Client ID o Secret no configurados." },
      { status: 500 }
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const authorizationHeader = `Basic ${basicAuth}`;

  const formData = new URLSearchParams();
  formData.append("grant_type", "client_credentials");
  formData.append("scope", "openid");

  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authorizationHeader,
      },
      body: formData,
    });

    const responseText = await tokenResponse.text();
    if (!tokenResponse.ok) {
      return NextResponse.json(
        { message: "Error al obtener token.", error: responseText },
        { status: tokenResponse.status }
      );
    }

    const tokenData = JSON.parse(responseText);
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("Access token no recibido");
    }

    await medplum.setAccessToken(accessToken);

    const userInfoResponse = await fetch("https://api.medplum.com/oauth2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userInfo = userInfoResponse.ok ? await userInfoResponse.json() : {};

    const cookieHeader = req.headers.get("cookie") || "";
    const parsedCookies = parse(cookieHeader);
    const loginRole = parsedCookies.medplumLoginRole || "professional";
    const loginEmail = decodeURIComponent(parsedCookies.medplumLoginEmail || "");

    const cookieOptions = {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      httpOnly: false,
    };

    if (loginRole === "patient") {
      let patientId: string | undefined;

      try {
        const searchResult = await medplum.search("Patient", {
          telecom: `email|${loginEmail}`,
        });
        const found = searchResult.entry?.[0]?.resource as any;
        if (found?.id) {
          patientId = found.id;
        }
      } catch (_) {
        // search not available; patient dashboard will handle this
      }

      if (!patientId) {
        try {
          const projectId = process.env.MEDPLUM_PROJECT_ID;
          const membersResult = await medplum.get(`admin/projects/${projectId}/members`);
          const members: any[] = membersResult.entry?.map((e: any) => e.resource) ?? [];
          const match = members.find(
            (m) =>
              m.user?.display === loginEmail ||
              m.user?.identifier?.some((id: any) => id.value === loginEmail)
          );
          const ref: string = match?.profile?.reference ?? "";
          if (ref.startsWith("Patient/")) {
            patientId = ref.split("/")[1];
          }
        } catch (_) {
          // admin endpoint not accessible; patient dashboard will show instructions
        }
      }

      const response = NextResponse.redirect(`${config.baseUrl}/paciente/dashboard`);
      response.cookies.set("medplumAccessToken", accessToken, cookieOptions);
      response.cookies.set("medplumUserInfo", JSON.stringify(userInfo), cookieOptions);
      response.cookies.set("medplumUserRole", "patient", cookieOptions);
      response.cookies.set("medplumUserEmail", loginEmail, cookieOptions);
      if (patientId) {
        response.cookies.set("medplumPatientId", patientId, cookieOptions);
      }
      return response;
    }

    // Professional login
    const response = NextResponse.redirect(`${config.baseUrl}/Dashboard`);
    response.cookies.set("medplumAccessToken", accessToken, cookieOptions);
    response.cookies.set("medplumUserInfo", JSON.stringify(userInfo), cookieOptions);
    response.cookies.set("medplumUserRole", "professional", cookieOptions);
    response.cookies.set("medplumUserEmail", loginEmail, cookieOptions);
    return response;
  } catch (error) {
    console.error("Error durante el callback de autenticación:", error);
    return NextResponse.json(
      { message: "Error durante la autenticación.", error },
      { status: 500 }
    );
  }
}
