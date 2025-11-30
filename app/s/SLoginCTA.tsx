"use client";

import { useAuth } from "@/lib/contexts/auth";
import { Button } from "@/components/common/Button";
import { useRouter } from "next/navigation";

export default function SLoginCTA() {
	const { signInWithGoogle } = useAuth();
	const router = useRouter();
	return (
		<Button
			variant="primary"
			onClick={async () => {
				await signInWithGoogle();
				router.push("/home");
			}}
		>
			Sign in with Google
		</Button>
	);
}
