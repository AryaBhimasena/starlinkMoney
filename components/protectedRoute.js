// components/ProtectedRoute.js
// Komponen untuk proteksi halaman berdasarkan peran user

"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebaseConfig';

export default function ProtectedRoute({ children, allowedRoles }) {
    const [userRole, setUserRole] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (!user) {
                router.push('/login');
            } else {
                user.getIdTokenResult().then(idTokenResult => {
                    const role = idTokenResult.claims.role;
                    if (!allowedRoles.includes(role)) {
                        router.push('/');
                    } else {
                        setUserRole(role);
                    }
                });
            }
        });
        return () => unsubscribe();
    }, [router, allowedRoles]);

    if (!userRole) return null;
    return children;
}
