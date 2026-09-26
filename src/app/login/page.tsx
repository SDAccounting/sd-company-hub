import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Company Hub</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with your S+D Accounting account.
        </p>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
