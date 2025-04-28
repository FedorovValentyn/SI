import { Link } from 'react-router-dom';
import '/src/App.css';
function Navbar() {
    return (
        <nav className="navbar">
            <Link className="nav-link" to="/">Про книгарню</Link>
            <Link className="nav-link" to="/profile">Особистий кабінет</Link>
            <Link className="nav-link" to="/books">Вибір книг</Link>
            <Link className="nav-link" to="/recommendations">Підбірка книги за вподобанням</Link>
        </nav>
    );
}

export default Navbar;
