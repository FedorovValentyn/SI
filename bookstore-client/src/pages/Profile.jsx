import { useState, useEffect } from "react";
import axios from "axios";
import './Profile.css'

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

function Profile() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
    });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [orders, setOrders] = useState([]);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            const fetchProfile = async () => {
                try {
                    const response = await api.get("/profile", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setProfileData(response.data);
                } catch (error) {
                    console.error("Помилка завантаження профілю:", error);
                    setMessage({ text: "Не вдалося завантажити профіль", type: "error" });
                }
            };

            const fetchOrders = async () => {
                try {
                    const response = await api.get("/orders", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setOrders(response.data);
                } catch (error) {
                    console.error(
                        "Помилка завантаження історії замовлень:",
                        error.response ? error.response.data : error
                    );
                    setMessage({
                        text: "Не вдалося завантажити історію замовлень",
                        type: "error",
                    });
                }
            };

            fetchProfile();
            fetchOrders();
        }
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });
        setIsLoading(true);

        try {
            const endpoint = isLogin ? "/login" : "/register";
            const body = isLogin
                ? { email: formData.email, password: formData.password }
                : formData;

            const response = await api.post(endpoint, body);

            setMessage({ text: response.data.message, type: "success" });
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
                window.location.href = "/profile";
            }
        } catch (error) {
            if (error.response) {
                setMessage({
                    text: error.response.data.error || "Сталася помилка",
                    type: "error",
                });
            } else {
                setMessage({
                    text: "Помилка при налаштуванні запиту",
                    type: "error",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setProfileData(null);
        setOrders([]);
        window.location.href = "/profile";
    };
    console.log("Profile data:", profileData);
    console.log("Orders:", orders);


    return (
        <div className="auth-container">
            {profileData ? (
                <div className="profile-info">
                    <h2>Ваш профіль</h2>
                    <p><strong>Ім'я:</strong> {profileData.firstName} {profileData.lastName}</p>
                    <p><strong>Email:</strong> {profileData.email}</p>
                    <p><strong>Телефон:</strong> {profileData.phone}</p>
                    <p><strong>Адреса доставки:</strong> {profileData.deliveryAddress}</p>

                    <h3>Історія замовлень</h3>
                    {orders.length > 0 ? (
                        <table className="orders-table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Назва товару</th>
                                <th>Кількість</th>
                                <th>Ціна</th>
                                <th>Сума</th>
                                <th>Дата</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map((order, index) => (
                                <tr key={order.id}>
                                    <td>{index + 1}</td>
                                    <td>{order.title}</td>  {/* Тепер використовуємо title */}
                                    <td>{order.quantity}</td>
                                    <td>{order.product_price} грн</td>  {/* Якщо додали product_price у запит */}
                                    <td>{order.total_price} грн</td>
                                    <td>{order.date}</td>
                                </tr>
                            ))}
                            </tbody>

                        </table>
                    ) : (
                        <p>У вас ще немає замовлень.</p>
                    )}

                    <button onClick={handleLogout} className="logout-btn">
                        Вийти
                    </button>
                </div>
            ) : (
                <>
                    <h1>{isLogin ? "Вхід" : "Реєстрація"}</h1>

                    {message.text && (
                        <div className={`message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Ім'я"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Прізвище"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Телефон"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Адреса доставки"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />
                            </>
                        )}
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Пароль"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? "Завантаження..." : isLogin ? "Увійти" : "Зареєструватися"}
                        </button>
                    </form>
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage({ text: "", type: "" });
                        }}
                        className="switch-btn"
                        disabled={isLoading}
                    >
                        {isLogin ? "Ще не маєте акаунту? Зареєструватися" : "Вже маєте акаунт? Увійти"}
                    </button>
                </>
            )}
        </div>
    );
}

export default Profile;
