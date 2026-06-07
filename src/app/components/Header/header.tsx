"use client";
import { Logo } from "@medplum/react";
import Link from "next/link";
import "./Header.css";
import { useRouter } from "next/navigation";
import { parseClientCookies, clearCookie } from "@/libs/cookies";

import React from "react";

export default function Header(): JSX.Element {
  const router = useRouter();
  const cookies = parseClientCookies();
  const isLoggedIn = !!cookies.medplumAccessToken;

  const handleLogout = () => {
    clearCookie('medplumAccessToken');
    clearCookie('medplumUserInfo');
    clearCookie('medplumUserRole');
    clearCookie('medplumUserEmail');
    clearCookie('medplumPatientId');
    router.push('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Logo size={32} />
        <h3 className="logoText">Proyecto Favaloro</h3>
      </div>
      <div className="navbar-right">
        <Link className="common" href="/">
          Inicio
        </Link>
        {isLoggedIn && (
          <button className="begin" onClick={handleLogout}>
            Cerrar sesión
          </button>
        )}
      </div>
    </nav>
  );
}
