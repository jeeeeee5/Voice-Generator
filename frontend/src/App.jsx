import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#222226] text-white overflow-hidden">
      <Sidebar />

      <main className="flex-1">
         <Home />
      </main>

      <Footer />
    </div>
  );
}

export default App;
