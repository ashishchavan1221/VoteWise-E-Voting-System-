import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [hasVoted, setHasVoted] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [loading, setLoading] = useState(true);

    const currentUser = localStorage.getItem('currentUser');
    const voterId = localStorage.getItem('voterId');
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser || !voterId) {
            alert('❌ Please login to access the dashboard');
            navigate('/login');
            return;
        }

        const fetchDashboardData = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_URL || "";

                // 1. Check if user already voted
                const voteRes = await fetch(`${API_BASE}/api/vote/check`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ voterId })
                });
                const voteData = await voteRes.json();
                if (voteData.voted) setHasVoted(true);

                // 2. Fetch all candidates
                const candRes = await fetch(`${API_BASE}/api/candidates`);
                const candData = await candRes.json();
                setCandidates(candData);
            } catch (err) {
                console.error("Failed to fetch dashboard data");
            }
            setLoading(false);
        };

        fetchDashboardData();
    }, [currentUser, voterId, navigate]);

    const handleVote = async () => {
        if (!selectedCandidate) return;

        try {
            const API_BASE = import.meta.env.VITE_API_URL || "";
            const res = await fetch(`${API_BASE}/api/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voterId, candidateId: selectedCandidate.id })
            });

            if (res.ok) {
                setHasVoted(true);
                setSelectedCandidate(null);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to vote");
            }
        } catch (err) {
            alert("Connection error while casting vote!");
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Loading secure portal...</div>;
    }

    if (hasVoted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gray-50">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full text-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-check text-5xl text-green-500"></i>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Vote Recorded</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">Thank you for participating! Your vote has been securely anonymized and legally recorded.</p>
                    <button onClick={() => navigate('/results')} className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition">
                        View Live Results
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate('/'); }} className="block mx-auto mt-4 text-gray-500 hover:text-gray-800 underline text-sm">
                        Secure Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-[#0f172a] text-white pt-24 pb-16 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <p className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-semibold mb-4 border border-blue-500/30 backdrop-blur-md">
                            <i className="fa-solid fa-shield-check mr-2"></i>Secure Standard Voting
                        </p>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Welcome back, <span className="text-blue-400">{currentUser}</span>!</h1>
                        <p className="text-lg text-gray-300 max-w-2xl">Please review the 10 candidate manifestos carefully. Your vote is confidential and can only be cast exactly once.</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 pb-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {candidates.map(candidate => (
                        <div key={candidate.id} className="bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition duration-300 p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner text-4xl">
                                    {candidate.symbol}
                                </div>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider">{candidate.party_or_group}</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{candidate.name}</h3>
                            <p className="text-blue-600 font-semibold text-sm mb-4">{candidate.manifesto}</p>

                            <hr className="border-gray-100 my-4 mt-auto" />

                            <button onClick={() => setSelectedCandidate(candidate)} className="w-full py-3 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg transition flex items-center justify-center gap-2">
                                <i className="fa-solid fa-check-to-slot"></i> Vote
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedCandidate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all p-8 scale-100">
                        <div className="w-20 h-20 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 text-4xl">
                            {selectedCandidate.symbol}
                        </div>
                        <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">Confirm Your Vote</h3>
                        <p className="text-center text-gray-600 mb-8 leading-relaxed">
                            You are placing a legal vote for <strong className="text-gray-900">{selectedCandidate.name}</strong>. This is permanently encrypted.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setSelectedCandidate(null)} className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200">Cancel</button>
                            <button onClick={handleVote} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700">Submit Vote</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
