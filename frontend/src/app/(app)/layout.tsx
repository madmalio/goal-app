import Sidebar from "../../components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="md:ml-64 p-8 print:ml-0 print:p-0 print:w-full">
        {children}
      </main>
    </>
  );
}
