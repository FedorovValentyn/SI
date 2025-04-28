import { useState } from "react";
import axios from "axios";

// Створюємо екземпляр axios з базовими налаштуваннями
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
        address: ""
    });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
                // Перенаправлення на головну сторінку після успішного входу
                window.location.href = "/";
            }
        } catch (error) {
            if (error.response) {
                // Сервер відповів зі статусом, що не входить у 2xx
                setMessage({
                    text: error.response.data.error || "Сталася помилка",
                    type: "error"
                });
            } else if (error.request) {
                // Запит був зроблений, але не отримано відповіді
                setMessage({
                    text: "Не вдалося отримати відповідь від сервера",
                    type: "error"
                });
            } else {
                // Щось сталося під час налаштування запиту
                setMessage({
                    text: "Помилка при налаштуванні запиту",
                    type: "error"
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
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
                    {isLoading ? "Завантаження..." : (isLogin ? "Увійти" : "Зареєструватися")}
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
        </div>
    );
}

export default Profile;