import type { Metadata } from "next";
import "../styles/globals.css";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "Where's Lunch?",
  description:
    "A web application designed to help you and your friends decide on where to eat for lunch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-purple-200">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
