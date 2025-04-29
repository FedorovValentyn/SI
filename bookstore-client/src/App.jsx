import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import About from './pages/About';
import Profile from './pages/Profile';
import Books from './pages/Books';
import Recommendations from './pages/Recommendations';
import './App.css';
import { Helmet } from "react-helmet";

function App() {
    return (
        <div>
            <Helmet>
                <title>Bookstore App</title>
            </Helmet>
        <Router>
            <Navbar />
            <div style={{ padding: '20px' }}>
                <Routes>
                    <Route path="/" element={<About />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/books" element={<Books />} />
                    <Route path="/recommendations" element={<Recommendations />} />
                </Routes>
            </div>
        </Router>
</div>
    );
}

export default App;
