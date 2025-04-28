import { useEffect, useState } from 'react';
import axios from 'axios';
import './Books.css';

function Books() {
    const [products, setProducts] = useState([]);
    const [flippedId, setFlippedId] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:5000/api/products')
            .then(response => {
                console.log(response.data);
                setProducts(response.data);
            })
            .catch(error => console.error('Error loading products:', error));
    }, []);

    // console.log([...products]);

    const handleFlip = (id) => {
        // const id = event.target.id;
        setFlippedId(prevId => (prevId === id ? null : id));
        // console.log(id);
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
                            key={product.title}
                            id={product.title}
                            className={`single-book ${flippedId === product.id ? 'flipped' : ''}`}
                            onClick={() => handleFlip(product.title)}
                        >
                            <div className="single-book-inner">
                                <div className="single-book-front">
                                    <img src={product.thumbnail} alt={product.title} className="book-thumbnail" />
                                    <h3>{product.title}</h3>
                                    <p>Автор: {product.authors}</p> <p> ID: {product.id}</p>
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
