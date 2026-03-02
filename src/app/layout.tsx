import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "LÖSEV PSİ — Psikolojik Destek Platformu",
	description:
		"LÖSEV'in kanser hastası çocuklar ve aileleri için psikolojik destek platformu. Ruh sağlığı, terapi seansları ve aile desteği.",
	keywords: ["LÖSEV", "psikoloji", "kanser", "destek", "terapi"],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="tr">
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
			>
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
