import { Link } from "react-router-dom"
import logo from "./Images/taskaroo.svg"

export default function Navigator() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center  overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex items-center justify-between py-4 px-6 border-b border-slate-300 max-w-screen-xl">
        <img src={logo} alt="Logo" className="w-40 md:w-60" />
      </header>

      {/* Main Container */}
      <main className="flex flex-col items-center justify-center flex-1 w-full px-4 mt-6 max-w-screen-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Welcome to Taskaroo Navigator
        </h1>

        {/* CARD GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full px-2 ml-32 md:ml-67 lg:ml-80 mb-12">
            <Link
                to="/login"
                className="w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[320px] bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-5 lg:p-7 border border-gray-200 hover:border-teal-300 group touch-manipulation active:scale-95"
            >
                <div className="text-center">
                    <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3">👤</div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 group-hover:text-teal-700 transition-colors">
                        Client
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 leading-tight sm:leading-relaxed">
                        Hire skilled freelancers for your tasks
                    </p>
                </div>
            </Link>
            <Link
                to="/worker_login"
                className="w-full max-w-[280px] sm:max-w-[300px] lg:max-w-[320px] bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-5 lg:p-7 border border-gray-200 hover:border-teal-300 group touch-manipulation active:scale-95"
            >
                <div className="text-center">
                    <div className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3">🛠️</div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 group-hover:text-teal-700 transition-colors">
                        Freelancer
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 leading-tight sm:leading-relaxed">
                        Offer your skills and earn money
                    </p>
                </div>
            </Link>
        </div>
      </main>
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Taskify. All rights reserved.
      </footer>
    </div>
  );
}
