"use client";

import React from "react";
import "./Hero.css";
import doctor from "../../images/archivos.jpg";
import stetho from "../../images/stetho.png"
import Image from "next/image";
import { useRouter } from "next/navigation";


export default function Hero(): JSX.Element {
  const router = useRouter();

  return (
    <section className="heroSection">
      <div className="heroContent">
        <h1>Bienvenida a Proyecto Archivos</h1>
        <p>Seleccioná cómo querés ingresar</p>
        <Image className="stethoImage" src={stetho} alt="estetoscopio"></Image>
        <div className="roleButtons">
          <button onClick={() => router.push('/login/paciente')} className="roleBtn patientBtn">
            Soy Paciente
          </button>
          <button onClick={() => router.push('/login/profesional')} className="roleBtn professionalBtn">
            Soy Profesional
          </button>
        </div>
      </div>
      <div className="heroImage">
        <Image src={doctor} alt="Profesional de salud" />
      </div>
    </section>
  );
}
