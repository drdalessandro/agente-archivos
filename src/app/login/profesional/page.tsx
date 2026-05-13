"use client";
import React from "react";
import Header from "../../components/Header/header";
import LoginForm from "../../components/LoginForm/loginform";

export default function LoginProfesional(): JSX.Element {
  return (
    <main className="container">
      <Header />
      <LoginForm role="professional" titulo="Acceso Profesionales" />
    </main>
  );
}
