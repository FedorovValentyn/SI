import React, { useState } from 'react';
import axios from 'axios';
import './Recommendations.css'; // залишаємо для стилів

function Recommendations() {
    const [bookName, setBookName] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setBookName(e.target.value);
    };

    const handleRecommend = async () => {
        if (!bookName.trim()) {
            setError('Будь ласка, введіть назву книги.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/recommend', { bookName });

            if (response.data.error) {
                setError(response.data.error);
                setRecommendations([]);
            } else {
                setRecommendations(response.data);
                setError('');
            }
        } catch (error) {
            setError('Не вдалося отримати рекомендації.');
            setRecommendations([]);
        }
    };

    // Підкомпонент BookCard прямо тут
    const BookCard = ({ book }) => (
        <div className="book-card">
            <h3>{book.title}</h3>
            <p><strong>Автор:</strong> {book.authors}</p>
            <p><strong>Рік:</strong> {book.published_year}</p>
            <p><strong>Рейтинг:</strong> {book.average_rating}</p>
            {book.thumbnail && <img src={book.thumbnail} alt={book.title} className="book-thumbnail" />}
            <div className="description">{book.description}</div>
            <button className="btn-buy">Купити</button>
        </div>
    );

    return (
        <div className="recommendation-container">
            <h1>Підбірка книги за вподобанням</h1>

            <div className="input-group">
                <input
                    type="text"
                    value={bookName}
                    onChange={handleInputChange}
                    placeholder="Введіть назву книги"
                    className="search-input"
                />
                <button onClick={handleRecommend} className="btn-recommend">Показати рекомендації</button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="recommendation-grid">
                {recommendations.map((book, index) => (
                    <BookCard key={index} book={book} />
                ))}
            </div>
        </div>
    );
}

export default Recommendations;
