import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-zinc-950 px-4">
            {/* Absolute background effects if desired */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            <div className="relative z-10 w-full flex justify-center">
                <LoginForm />
            </div>
        </div>
    );
}
