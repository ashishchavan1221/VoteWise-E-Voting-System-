import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const [voterId, setVoterId] = useState('');
    const [password, setPassword] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [captchaData, setCaptchaData] = useState({ id: '', text: '' });
    const [loading, setLoading] = useState(false);
    
    const canvasRef = useRef(null);
    const navigate = useNavigate();

    const fetchCaptcha = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || "";
            const res = await fetch(`${API_BASE}/api/auth/captcha`);
            const data = await res.json();
            setCaptchaData({ id: data.captchaId, text: data.text });
            drawCaptcha(data.text);
        } catch (err) {
            console.error("Failed to load captcha", err);
        }
    };

    const drawCaptcha = (text) => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, 150, 50);
        // Background noise
        ctx.fillStyle = '#f0f4f8';
        ctx.fillRect(0, 0, 150, 50);
        
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = '#1e3a8a';
        // Assembled text drawing with slight rotation to make it Captcha-like
        for(let i=0; i<text.length; i++) {
            ctx.save();
            ctx.translate(20 + (i*20), 30);
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillText(text[i], 0, 0);
            ctx.restore();
        }
        // Draw interference lines
        for(let j=0; j<5; j++) {
            ctx.strokeStyle = '#9ca3af';
            ctx.beginPath();
            ctx.moveTo(Math.random()*150, Math.random()*50);
            ctx.lineTo(Math.random()*150, Math.random()*50);
            ctx.stroke();
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const API_BASE = import.meta.env.VITE_API_URL || "";
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    voterId, 
                    password,
                    captchaId: captchaData.id,
                    captchaAnswer: captchaInput
                })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("currentUser", data.name);
                localStorage.setItem("voterId", data.voterId);
                alert("✅ Secure Login Successful!");
                navigate('/dashboard');
            } else {
                alert("❌ " + (data.error || "Login Failed"));
                fetchCaptcha(); // Refresh captcha on fail
                setCaptchaInput('');
            }
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message + " (Check console for details)");
        }
        setLoading(false);
    };

    return (
        <div className="flex w-full min-h-screen bg-gray-50">
            <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-[#0f172a] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob"></div>
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center text-white">
                    <h2 className="text-4xl font-bold mb-4">Secure. Anonymous. Verifiable.</h2>
                    <p className="text-lg text-gray-300 max-w-sm">Join the digital revolution of democracy. Your vote is protected by military-grade encryption.</p>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white shadow-xl lg:shadow-none max-w-2xl mx-auto rounded-3xl m-4 lg:m-0 z-10 relative">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition mb-6 bg-gray-50 px-4 py-2 rounded-full border">
                            <i className="fa-solid fa-arrow-left"></i> Back to Home
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back! 👋</h2>
                        <p className="text-gray-500">Please enter your credentials to login and cast your vote.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Voter ID Number</label>
                            <input type="text" value={voterId} onChange={e=>setVoterId(e.target.value)} placeholder="00000000" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600" required />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600" required />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Security CAPTCHA</label>
                            <div className="flex gap-4 items-center">
                                <div className="border border-gray-300 rounded-lg overflow-hidden relative" style={{width: '150px', height: '50px'}}>
                                    <canvas ref={canvasRef} width="150" height="50" className="cursor-pointer" onClick={fetchCaptcha} title="Click to refresh"></canvas>
                                </div>
                                <input type="text" value={captchaInput} onChange={e=>setCaptchaInput(e.target.value.toUpperCase())} placeholder="Type Captcha" maxLength="6" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600" required />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Click the image to generate a new CAPTCHA</p>
                        </div>

                        <button type="submit" disabled={loading} className="w-full mt-6 bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-700 transition">
                            {loading ? "Authenticating..." : "Secure Login"}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-gray-600 font-medium">
                        Don't have an account yet? <Link to="/register" className="text-blue-600 font-bold hover:underline">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
