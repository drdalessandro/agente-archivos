"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/Header/header";
import { medplum } from "@/libs/medplumClient";
import { parseClientCookies } from "@/libs/cookies";
import "./dashboard.css";
import UploadDropZone from "../components/UploadDropZone/uploaddropzone";
import ResourceSheet from "../components/ResourceSheet/resourcesheet";
import VoiceRecorder from "../components/VoiceRecorder/voicerecorder";
import { Patient } from "@/libs/types";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState<boolean>(false);
  const [switchToResourceTab, setSwitchToResourceTab] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      const cookies = parseClientCookies();
      const accessToken = cookies.medplumAccessToken;

      if (!accessToken) {
        router.push("/login/profesional");
        return;
      }

      if (cookies.medplumUserRole === "patient") {
        router.push("/paciente/dashboard");
        return;
      }

      medplum.setAccessToken(accessToken);
      await fetchPatients();
    };
    initializeDashboard();
  }, [router]);

  const fetchPatients = async () => {
    try {
      const searchResponse = await medplum.search("Patient");
      if (searchResponse.entry) {
        const fetchedPatients = searchResponse.entry.map((entry: any) => entry.resource);
        setPatients(fetchedPatients);
      }
    } catch (error) {
      console.error("Error al buscar pacientes:", error);
    }
  };

  const handleRecordingComplete = () => {
    setTriggerRefetch((prev) => !prev);
  };

  const handleUploadSuccess = () => {
    setTriggerRefetch((prev) => !prev);
  };

  return (
    <>
      <Header />
      <div className="dashboard">
        <ResourceSheet
          patients={patients}
          selectedPatient={selectedPatient}
          setSelectedPatient={setSelectedPatient}
          triggerRefetch={triggerRefetch}
          switchToResourceTab={switchToResourceTab}
        />
        <div className="box pdfLoader">
          <UploadDropZone selectedPatient={selectedPatient} onUploadSuccess={handleUploadSuccess} />
        </div>
        <VoiceRecorder selectedPatient={selectedPatient} onRecordingComplete={handleRecordingComplete} />
      </div>
    </>
  );
};

export default Dashboard;
