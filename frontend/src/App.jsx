import Header from "./components/Header";
import Main from "./components/Main";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#222226] text-white overflow-hidden">
      <Header />

      <main className="flex-1">
         <Main />
      </main>

      <Footer />
    </div>
  );
}

export default App;