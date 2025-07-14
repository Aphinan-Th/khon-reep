import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
	title: "Khon Reep",
};

// export const viewport = {
// 	width: "device-width",
// 	initialScale: 1,
// 	maximumScale: 1,
// 	minimumScale: 1,
// 	userScalable: false,
// };

const geistSans = Geist({
	variable: "--font-geist-sans",
	display: "swap",
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.className} antialiased flex justify-center items-center align-middle bg-[#2196f3] bg-fixed overscroll-none`}
			>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
