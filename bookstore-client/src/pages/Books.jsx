import { useEffect, useState } from 'react';
import axios from 'axios';
import './Books.css';

function Books() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [flippedId, setFlippedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/api/products')
            .then(response => {
                const formattedProducts = response.data.map(product => ({
                    ...product,
                    published_year: parseInt(product.published_year, 10), // Convert published_year string to integer year
                }));
                setProducts(formattedProducts);
                setFilteredProducts(formattedProducts);
            })
            .catch(error => console.error('Error loading products:', error));
    }, []);

    useEffect(() => {
        let filtered = products.filter(product =>
            product.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortOption === 'genre') {
            filtered = filtered.sort((a, b) => (a.categories || '').localeCompare(b.categories || ''));
        } else if (sortOption === 'date') {
            filtered = filtered.sort((a, b) => b.published_year - a.published_year); // Sort by newest year first
        } else if (sortOption === 'alphabet') {
            filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
        }

        setFilteredProducts(filtered);
    }, [searchTerm, sortOption, products]);

    const handleFlip = (id) => {
        setFlippedId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="books-container">
            <h1>Вибір книг</h1>

            <div className="search-sort-container">
                <input
                    type="text"
                    placeholder="Пошук книг..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="sort-select"
                >
                    <option value="">Сортувати за</option>
                    <option value="alphabet">За алфавітом</option>
                    <option value="genre">За жанром</option>
                    <option value="date">За датою</option>
                </select>
            </div>

            {filteredProducts.length === 0 ? (
                <p>Немає доступних книг.</p>
            ) : (
                <div className="books-list">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="single-book"
                            onClick={() => handleFlip(product.id)}
                        >
                            <div className={`single-book-inner ${flippedId === product.id ? 'flipped' : ''}`}>
                                <div className="single-book-front">
                                    <img src={product.thumbnail} alt={product.title} className="book-thumbnail" />
                                    <h3>{product.title}</h3>
                                    <p>Автор: {product.authors}</p>
                                    <p>Жанр: {product.categories}</p>
                                    <p>Рік публікації: {product.published_year}</p>
                                    <p><strong>Ціна: {product.price} грн</strong></p>
                                    <button
                                        className="btn-buy"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Купити
                                    </button>
                                </div>
                                <div className="single-book-back">
                                    <p>{product.description}</p>
                                    <button
                                        className="btn-close"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFlippedId(null);
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Books;
