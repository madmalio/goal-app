import Sidebar from "../../components/Sidebar";
import BackupAutoPrompt from "../../components/BackupAutoPrompt";
import WelcomeModal from "../../components/WelcomeModal";
import AddStudentModal from "../../components/AddStudentModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <WelcomeModal />
      <BackupAutoPrompt />
      <AddStudentModal />
      <main className="md:ml-64 p-8 print:ml-0 print:p-0 print:w-full">
        {children}
      </main>
    </>
  );
}
