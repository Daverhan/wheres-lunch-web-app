import type { Metadata } from "next";
import "../styles/globals.css";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "What's Lunch?",
  description:
    "A web application designed to help you and your friends decide on what to eat for lunch today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
