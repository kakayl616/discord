import "./globals.css";

export const metadata = {
  title: "Discord Case Appeal",
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
        {/* Put any global <title>, <meta> etc. here, or in `metadata` above */}
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}