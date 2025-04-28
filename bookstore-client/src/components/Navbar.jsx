import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav style={{ backgroundColor: '#f2f2f2', padding: '10px' }}>
            <Link to="/" style={{ margin: '10px' }}>Про книгарню</Link>
            <Link to="/profile" style={{ margin: '10px' }}>Особистий кабінет</Link>
            <Link to="/books" style={{ margin: '10px' }}>Вибір книг</Link>
            <Link to="/recommendations" style={{ margin: '10px' }}>Підбірка книги за вподобанням</Link>
        </nav>
    );
}

export default Navbar;
