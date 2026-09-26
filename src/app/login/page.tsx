import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Company Hub</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with your S+D Accounting account.
        </p>
        {error === "auth_callback_failed" && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            That invite/reset link didn&apos;t work — it may have expired.
            Ask an admin to send a fresh one.
          </p>
        )}
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
