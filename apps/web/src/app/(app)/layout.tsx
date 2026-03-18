import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="pt-16" style={{ backgroundColor: "#FDFAF6" }}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </>
  );
}
