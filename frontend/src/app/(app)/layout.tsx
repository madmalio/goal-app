import Sidebar from "../../components/Sidebar";
import BackupAutoPrompt from "../../components/BackupAutoPrompt";
import WelcomeModal from "../../components/WelcomeModal"; // <--- Import

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <WelcomeModal /> {/* <--- Runs first on fresh install */}
      <BackupAutoPrompt /> {/* <--- Runs if old install + no backup */}
      <main className="md:ml-64 p-8 print:ml-0 print:p-0 print:w-full">
        {children}
      </main>
    </>
  );
}
