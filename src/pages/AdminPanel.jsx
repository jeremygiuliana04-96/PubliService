import { useState } from "react";
import { supabase } from "../lib/supabase";

function AdminPanel({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleInvite = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Veuillez entrer une adresse e-mail.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke("invite-admin", {
          body: {
            email: cleanEmail,
          },
        });

      if (functionError) {
        throw functionError;
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "Impossible d’envoyer l’invitation.",
        );
      }

      setMessage(data.message || "Invitation envoyée avec succès.");
      setEmail("");
    } catch (inviteError) {
      console.error(inviteError);

      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Une erreur est survenue.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-panel">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Retour
      </button>

      <div className="page-header">
        <p className="page-kicker">Accès administrateur</p>
        <h1>Administration</h1>
        <p>
          Invitez un nouvel administrateur par adresse e-mail.
        </p>
      </div>

      <form
        className="admin-invite-form"
        onSubmit={handleInvite}
      >
        <label htmlFor="admin-email">
          Adresse e-mail
        </label>

        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="exemple@adresse.be"
          autoComplete="email"
          disabled={loading}
        />

        <button
          type="submit"
          className="primary-button"
          disabled={loading}
        >
          {loading ? "Envoi en cours..." : "Envoyer l’invitation"}
        </button>
      </form>

      {message && (
        <p className="form-message form-message-success">
          {message}
        </p>
      )}

      {error && (
        <p className="form-message form-message-error">
          {error}
        </p>
      )}
    </section>
  );
}

export default AdminPanel;