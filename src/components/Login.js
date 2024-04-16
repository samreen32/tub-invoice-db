import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

function Login() {
    let navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        const hardcodedEmail = "rivera_tubpros@yahoo.com";
        const hardcodedPassword = "Tubpr@s131";

        if (email === hardcodedEmail && password === hardcodedPassword) {
            console.log("Login successful");
            navigate('/main', {
                replace: true
            });
        } else {
            setErrorMessage("Enter correct credentials to login.");
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <>
            <div className="container login-container my-5" style={{ position: 'relative' }}>
                <form id="loginForm" onSubmit={handleSubmit}
                    style={{
                        display: 'flex', flexDirection: 'column', gap: '10px', alignItems: "center",
                        marginTop: "100px", justifyContent: "center", textAlign: "center"
                    }}
                >
                    <p className="mt-5" style={{ fontSize: "23px", color: "black" }}>Admin Login</p>
                    {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div style={{ position: 'relative', display: 'flex', width: "50%" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <span onClick={togglePasswordVisibility} style={{ cursor: 'pointer', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                            {showPassword ? "👁️‍🗨️" : "👁️"}
                        </span>
                    </div>
                    <br />
                    <button className="login-btn" type="submit">Sign in</button>
                </form>

            </div>
        </>
    );
}

export default Login;
