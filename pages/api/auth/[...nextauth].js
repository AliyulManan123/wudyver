// pages/api/[...nextauth].js
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Sesuaikan path jika Anda menempatkannya di tempat lain

export default NextAuth(authOptions);