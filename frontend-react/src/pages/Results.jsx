import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Results() {
    const [chartData, setChartData] = useState(null);
    const [totalVotes, setTotalVotes] = useState(0);
    const [candidateStats, setCandidateStats] = useState([]);
    
    const navigate = useNavigate();
    const currentUser = localStorage.getItem('currentUser');

    const chartColors = [
        "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
        "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#6366F1"
    ];

    useEffect(() => {
        // Security Check
        if (!currentUser) {
            alert('❌ Please login to view secure results.');
            navigate('/login');
            return;
        }

        const fetchResults = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_URL || "";
                const candRes = await fetch(`${API_BASE}/api/candidates`);
                let stats = await candRes.json();
                
                // Sort by highest votes
                stats.sort((a, b) => b.votes - a.votes);

                // Assign colors dynamically for chart matching
                stats = stats.map((c, index) => ({
                    ...c,
                    color: chartColors[index % chartColors.length]
                }));

                setCandidateStats(stats);

                const labels = stats.map(c => c.name);
                const dataCounts = stats.map(c => c.votes);
                const bgColors = stats.map(c => c.color);

                setTotalVotes(dataCounts.reduce((a, b) => a + b, 0));

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: 'Total Votes Verified',
                            data: dataCounts,
                            backgroundColor: bgColors,
                            borderRadius: 8,
                            borderWidth: 0,
                            barThickness: 'flex',
                            maxBarThickness: 60
                        }
                    ]
                });
            } catch(e) {
                console.error("Error fetching live results");
            }
        };

        fetchResults();
        const interval = setInterval(fetchResults, 3000); // Live poll every 3s
        return () => clearInterval(interval);
    }, [currentUser, navigate]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: { size: 14, family: "'Public Sans', sans-serif" },
                bodyFont: { size: 16, weight: 'bold', family: "'Public Sans', sans-serif" },
                padding: 12,
                displayColors: false,
                callbacks: { label: (ctx) => `${ctx.raw} Votes` }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false }, ticks: { font: { family: "'Public Sans', sans-serif" }, stepSize: 1 } },
            x: { grid: { display: false, drawBorder: false }, ticks: { font: { family: "'Public Sans', sans-serif", weight: 'bold' } } }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
    };

    if (!currentUser) return null;

    return (
        <div className="bg-gray-50 min-h-[90vh] py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-full font-semibold text-sm mb-4">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                        <span>Live Data securely viewed by {currentUser}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">Live Election Analytics</h1>
                    <p className="text-lg text-gray-600">Track the ongoing election results securely and anonymously in real-time. Data is fetched directly from the database.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl shadow-inner"><i className="fa-solid fa-users"></i></div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Turnout</p>
                            <h3 className="text-4xl font-black text-gray-900">{totalVotes}</h3>
                        </div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-3xl shadow-inner"><i className="fa-solid fa-shield-check"></i></div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Integrity Status</p>
                            <h3 className="text-2xl font-black text-green-500">100% Secure</h3>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl shadow-inner"><i className="fa-solid fa-clock-rotate-left"></i></div>
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Last Updated</p>
                            <h3 className="text-xl font-black text-gray-900">Just Now</h3>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-2xl shadow-gray-200/40 border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                            <i className="fa-solid fa-chart-column text-blue-600"></i> Server Polled Results
                        </h3>
                        <div className="h-[400px]">
                            {chartData ? <Bar data={chartData} options={options} /> : <p>Loading Data from Database...</p>}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-gray-200/40 border border-gray-100 max-h-[500px] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                            <i className="fa-solid fa-clipboard-list text-blue-600"></i> Candidate Ledger
                        </h3>
                        <div className="space-y-4">
                            {candidateStats.map((c, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm bg-white" style={{ borderLeft: `4px solid ${c.color}` }}>
                                            {c.symbol}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 truncate max-w-[120px]" title={c.name}>{c.name}</h4>
                                            <p className="text-xs font-semibold text-gray-500 truncate max-w-[120px]">{c.party_or_group}</p>
                                        </div>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        <div className="text-xl font-black" style={{ color: c.color }}>{c.votes}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Results;
