import { useEffect, useState } from 'react';
import axios from 'axios';
import './Books.css';

function Books() {
    const [products, setProducts] = useState([]);
    const [flippedId, setFlippedId] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:5000/api/products')
            .then(response => {
                setProducts(response.data);
            })
            .catch(error => console.error('Error loading products:', error));
    }, []);

    const handleFlip = (id) => {
        setFlippedId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="books-container">
            <h1>Вибір книг</h1>

            {products.length === 0 ? (
                <p>Немає доступних книг.</p>
            ) : (
                <div className="books-list">
                    {products.map(product => (
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
                                    <p>ID: {product.id}</p>
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
