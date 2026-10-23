import type { Metadata } from "next";
import "./globals.css";
import "./poker-theme.css";

export const metadata: Metadata = {
  title: "Poker Coach",
  description: "Treino de decisões de poker com feedback e painel de desvios.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
