import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Import Calculator — Japan to Mauritius",
  description:
    "Estimate the total landed cost of importing a car from Japan to Mauritius: CIF conversion, excise duty, VAT, registration, road tax and all clearance charges.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
