"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/ui-kit/DashboardLayout";
import { apiClient } from "@/lib/api/client";

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    emailVerified?: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            const result = await apiClient.getCurrentUser();

            if (result.error || !result.data) {
                // If getting user fails, we redirect to login, but only once we are sure
                // We might want to handle this better, but for now this matches existing logic
                router.push("/login");
                return;
            }

            const userData = (result.data as { user: User }).user;

            if (!userData.emailVerified) {
                router.push("/login?unverified=1");
                return;
            }

            setUser(userData);
            setLoading(false);
        }

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <DashboardLayout user={user}>
            {children}
        </DashboardLayout>
    );
}
