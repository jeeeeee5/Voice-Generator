import { useEffect, useState } from "react";

  export default function Header() {
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect( () => {
      const handleScroll = () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          // Scrolling down
          setShowHeader(false);
        } else {
          // Scrolling up
          setShowHeader(true);
        }

        setLastScrollY(currentScrollY);
      };

      window.addEventListener("scroll", handleScroll);

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, [lastScrollY]);

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50
                 transition-transform duration-100
                 ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="px-6 py-6 md:px-28 xl:px-32 md:py-8">

        <div className="flex items-center space-x-2 cursor-pointer">
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-full">
            <img
              src="/logo.png"
              alt="LOCAL AI TTS"
              className="w-10 h-10 object-cover"
            />
          </div>

          <span className="tracking-widest text-sm font-semibold text-gray-300">
            LOCAL AI TTS
          </span>
        </div>

      </div>
    </nav>
  );
}