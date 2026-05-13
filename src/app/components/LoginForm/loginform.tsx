import React, { useState } from "react";
import "./loginform.css";
import { useRouter } from "next/navigation";
import { medplum } from "@/libs/medplumClient";

interface LoginFormProps {
  role: "patient" | "professional";
  titulo: string;
}

const LoginForm = ({ role, titulo }: LoginFormProps): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      document.cookie = `medplumLoginEmail=${encodeURIComponent(email)}; path=/; samesite=strict`;
      document.cookie = `medplumLoginRole=${role}; path=/; samesite=strict`;

      const loginResponse = await medplum.startLogin({ email, password });

      if (loginResponse.code) {
        router.push(`/api/auth/callback`);
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setError("Email o contraseña incorrectos");
    }
  }

  return (
    <section className="loginSection">
      <form className="loginForm" onSubmit={handleSubmit}>
        <h2 className="loginTitle">{titulo}</h2>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          placeholder="Dirección de email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Contraseña:</label>
        <input
          type="password"
          value={password}
          placeholder="Contraseña"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="loginError">{error}</p>}
        <button type="submit">Ingresar</button>
      </form>
    </section>
  );
};

export default LoginForm;
