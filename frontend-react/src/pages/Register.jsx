import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ voterId: '', name: '', age: '', college: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegisterInit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || "";
            const res = await fetch(`${API_BASE}/api/auth/register-init`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                alert("OTP has been sent to your email and phone!");
                setStep(2); // Move to OTP step
            } else {
                alert(data.error || "Failed to initialize registration");
            }
        } catch (err) {
            alert("Server connection failed. Is the Java backend running?");
        }
        setLoading(false);
    };

    const handleRegisterVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || "";
            const res = await fetch(`${API_BASE}/api/auth/register-verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voterId: formData.voterId, otp })
            });
            const data = await res.json();
            
            if (res.ok) {
                alert("Registration Successful!");
                navigate('/login');
            } else {
                alert(data.error || "Invalid OTP");
            }
        } catch (err) {
            alert("Server connection failed.");
        }
        setLoading(false);
    };

    return (
        <div className="flex w-full min-h-screen bg-gray-50">
            <div className="hidden lg:flex flex-col justify-center items-center w-1/3 fixed top-0 left-0 bottom-0 bg-[#0f172a] overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply blur-3xl opacity-30 animate-blob"></div>
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Your Vote, Your Future</h2>
                    <p className="text-gray-300 max-w-sm mb-8 text-sm leading-relaxed">Join thousands exercising their democratic right through our highly secure platform.</p>
                </div>
            </div>

            <div className="w-full lg:w-2/3 lg:ml-[33.333%] flex items-center justify-center py-12 px-6 sm:px-12 bg-gray-50 min-h-screen">
                <div className="w-full max-w-3xl bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 relative">
                    <div className="mb-10 text-center relative">
                        <Link to="/" className="text-4xl font-bold cursor-pointer block mb-4 lg:hidden mt-12">Vote<span className="text-blue-600">Wise</span></Link>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 mt-4">Create Voter Account 🛂</h2>
                        <p className="text-gray-500">{step === 1 ? "Register once to cast your vote securely." : "Verify your identity with OTP."}</p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleRegisterInit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Legal Name</label>
                                <input type="text" name="name" onChange={handleInputChange} placeholder="As per ID" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Voter ID</label>
                                <input type="text" name="voterId" onChange={handleInputChange} placeholder="Unique 10 Digit ID" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                                <input type="number" name="age" onChange={handleInputChange} min="18" placeholder="Must be 18+" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">College / Institution</label>
                                <input type="text" name="college" onChange={handleInputChange} placeholder="Your college" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input type="email" name="email" onChange={handleInputChange} placeholder="example@college.edu" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Secure Password</label>
                                <input type="password" name="password" onChange={handleInputChange} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                                <input type="password" name="confirmPassword" onChange={handleInputChange} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" required />
                            </div>
                            <div className="md:col-span-2 mt-4">
                                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700">
                                    {loading ? "Sending OTP..." : "Get OTP Verification"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterVerify} className="max-w-md mx-auto">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter 6-Digit OTP</label>
                                <p className="text-xs text-red-500 mb-2">Check your VS Code terminal for the dummy OTP!</p>
                                <input type="text" onChange={(e) => setOtp(e.target.value)} placeholder="000000" maxLength="6" className="w-full px-4 py-4 text-center text-2xl tracking-[1em] bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600" required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-600/30 hover:bg-green-700">
                                {loading ? "Verifying..." : "Verify & Complete Registration"}
                            </button>
                            <button type="button" onClick={() => setStep(1)} className="w-full mt-4 text-gray-500 hover:text-gray-800 font-semibold py-2">Go Back</button>
                        </form>
                    )}

                    <p className="text-center mt-8 text-gray-600 font-medium">Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Log in</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Register;
