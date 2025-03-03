import "./globals.css";

export const metadata = {
  title: "Discord Ban Appeal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#5865f2" />
        <link rel="icon" href="/img/discord.png" />
        {/* Global <title>, <meta> etc. can go here or in metadata */}
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
