"use client";
import React from "react";
import Header from "../../components/Header/header";
import MedplumSignIn from "../../components/MedplumSignIn/medplumsignin";

export default function LoginPaciente(): JSX.Element {
  return (
    <main className="container">
      <Header />
      <MedplumSignIn titulo="Acceso Pacientes" expectedRole="patient" />
    </main>
  );
}
