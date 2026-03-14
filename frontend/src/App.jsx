// App.jsx - Root application component
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="app-layout">
      {/* Fixed Left Sidebar */}
      <Sidebar />
      
      {/* Scrollable Main Content Area */}
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
