import { PagePlaceholder } from "@/components/common/PagePlaceholder";

export default function SignUpPage() {
  return (
    <div className="route-stage mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PagePlaceholder
        titleKey="public.signUp"
        owner="Hamza"
        branch="feature/student-auth-ui"
        design="Shared_Pages/sign_up"
      />
    </div>
  );
}
