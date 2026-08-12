import Home from "./pages/Home";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#222226] text-white overflow-hidden">
      <main className="flex-1">
         <Home />
      </main>

      <Footer />
    </div>
  );
}

export default App;