import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthLayout } from "../components/AuthLayout";

export function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) return setError("Please enter your full name.");
    if (!form.email.includes("@")) return setError("Please enter a valid email.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm)
      return setError("Passwords do not match.");

    try {
      setStatus("submitting");
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName },
        },
      });
      if (error) throw error;
      console.log("New user created:", data.user);

      setStatus("success");
      navigate("/login", { replace: true, state: { emailPrefill: form.email } });
    } catch (err) {
      console.error(err);
      setError(err.message || "Sign-up failed. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join AuctionSwift to start managing your listings"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="fullName"
          type="text"
          placeholder="Full name"
          className="border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={form.fullName}
          onChange={onChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={form.email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password (min 8 chars)"
          className="border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={form.password}
          onChange={onChange}
          required
        />
        <input
          name="confirm"
          type="password"
          placeholder="Confirm password"
          className="border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={form.confirm}
          onChange={onChange}
          required
        />

        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {status === "submitting" ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-indigo-600 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
