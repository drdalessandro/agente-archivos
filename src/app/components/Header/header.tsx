"use client";
import logo from "../../images/logo.png";
import Image from "next/image";
import Link from "next/link";
import "./Header.css";
import { useRouter } from "next/navigation";
import { parseClientCookies, clearCookie } from "@/libs/cookies";

import React from "react";

export default function Header(): JSX.Element {
  const router = useRouter();
  const cookies = parseClientCookies();
  const isLoggedIn = cookies.medplumAccessToken || cookies.medplumUserInfo;

  const handleInviteClick = () => {
    router.push("/Invite");
  };

  const handleLogout = () => {
    clearCookie('medplumAccessToken');
    clearCookie('medplumUserInfo');
    router.push('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Image className="logo" src={logo} alt="Agente-Archivos Logo"></Image>
        <h3 className="logoText">Agente-Archivos</h3>
      </div>
      <div className="navbar-right">
        <Link className="common" href="/">
          Home
        </Link>
        {!isLoggedIn && (
          <Link href="/Login" className="common">
            Login
          </Link>
        )}
        {isLoggedIn ? (
          <button className="begin" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="begin" onClick={handleInviteClick}>
            Begin
          </button>
        )}
      </div>
    </nav>
  );
}
