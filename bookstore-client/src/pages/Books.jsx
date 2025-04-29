import { useEffect, useState } from 'react';
import axios from 'axios';
import './Books.css';

function Books() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [flippedId, setFlippedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('');
    const [isOrdering, setIsOrdering] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupProduct, setPopupProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        axios.get('http://localhost:5000/api/products')
            .then(response => {
                const formattedProducts = response.data.map(product => ({
                    ...product,
                    published_year: parseInt(product.published_year, 10),
                }));
                setProducts(formattedProducts);
                setFilteredProducts(formattedProducts);
            })
            .catch(error => {
                console.error('Error loading products:', error);
                showNotification('Помилка завантаження продуктів', 'error');
            });
    }, []);

    useEffect(() => {
        let filtered = products.filter(product =>
            product.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortOption === 'genre') {
            filtered = filtered.sort((a, b) => (a.categories || '').localeCompare(b.categories || ''));
        } else if (sortOption === 'date') {
            filtered = filtered.sort((a, b) => b.published_year - a.published_year);
        } else if (sortOption === 'alphabet') {
            filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
        }

        setFilteredProducts(filtered);
    }, [searchTerm, sortOption, products]);

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ ...notification, show: false });
        }, 5000);
    };

    const handleFlip = (id) => {
        setFlippedId(prevId => (prevId === id ? null : id));
    };

    const openPopup = (product) => {
        setPopupProduct(product);
        setQuantity(1);
        setShowPopup(true);
    };

    const closePopup = () => {
        setShowPopup(false);
        setPopupProduct(null);
    };

    const handleOrder = async () => {
        if (!popupProduct) return;

        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Будь ласка, увійдіть в систему, щоб зробити замовлення', 'error');
            return;
        }

        const totalPrice = quantity * popupProduct.price;

        setIsOrdering(true);
        try {
            const response = await axios.post(
                'http://localhost:5000/api/orders',
                {
                    productId: popupProduct.id,
                    quantity,
                    totalPrice,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            showNotification(`Замовлення #${response.data.orderId} успішно оформлено!`);
            closePopup();
        } catch (error) {
            console.error('Помилка при оформленні замовлення:', error);
            showNotification(error.response?.data?.error || 'Сталася помилка при оформленні замовлення', 'error');
        } finally {
            setIsOrdering(false);
        }
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
                                        disabled={isOrdering}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openPopup(product);
                                        }}
                                    >
                                        {isOrdering ? 'Обробка...' : 'Купити'}
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

            {/* Модальне вікно для замовлення */}
            {showPopup && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Оформлення замовлення</h3>
                            <button className="modal-close" onClick={closePopup}>
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="product-info">
                                <img src={popupProduct.thumbnail} alt={popupProduct.title} className="modal-thumbnail" />
                                <div>
                                    <h4>{popupProduct.title}</h4>
                                    <p>Автор: {popupProduct.authors}</p>
                                    <p className="price">Ціна: {popupProduct.price} грн</p>
                                </div>
                            </div>

                            <div className="quantity-control">
                                <label htmlFor="quantity">Кількість:</label>
                                <input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                            </div>

                            <div className="total-price">
                                <strong>До сплати: {quantity * popupProduct.price} грн</strong>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-confirm"
                                onClick={handleOrder}
                                disabled={isOrdering}
                            >
                                {isOrdering ? (
                                    <>
                                        <span className="spinner"></span>
                                        Обробка...
                                    </>
                                ) : (
                                    'Підтвердити замовлення'
                                )}
                            </button>
                            <button className="btn-cancel" onClick={closePopup}>
                                Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Сповіщення */}
            {notification.show && (
                <div className={`notification ${notification.type}`}>
                    <div className="notification-content">
                        <span className="notification-message">{notification.message}</span>
                        <button
                            className="notification-close"
                            onClick={() => setNotification({ ...notification, show: false })}
                        >
                            &times;
                        </button>
                    </div>
                    <div className="notification-progress"></div>
                </div>
            )}
        </div>
    );
}

export default Books;