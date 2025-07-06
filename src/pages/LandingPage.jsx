import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    useEffect(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('opacity-0', 'pointer-events-none');
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }, 1500); // Match preloader animation duration
        }
    }, []);

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center bg-white z-[1000] transition-opacity duration-500 ease-linear" id="preloader">
                <span className="absolute w-24 h-24 bg-teal-500 opacity-50 rounded-full transform scale-0 animate-preloader-pulse"></span>
                <span className="absolute w-24 h-24 bg-teal-500 opacity-50 rounded-full transform scale-0 animate-preloader-pulse-delay"></span>
            </div>

            <a href="#" className="fixed bottom-6 right-6 w-12 h-12 bg-teal-500 text-white flex items-center justify-center rounded-md transition-all duration-300 ease-linear z-10 hidden hover:bg-gray-800 shadow-md" aria-label="Go back to top"><i className="fa-solid fa-chevron-up"></i></a>


            <header id="header" className="bg-teal-500 text-white text-center flex flex-col gap-10 pt-32 pb-12 px-6">
                <section className="header__text">
                    <h1 className="text-4xl font-extrabold leading-tight text-shadow-md animate-fade-in-left">Plan Your Next Adventure, Together.</h1>
                    <p className="mt-4 mb-10 animate-fade-in-left delay-150">Create collaborative travel itineraries with AI-powered suggestions and manage group expenses effortlessly.</p>
                    <div className="flex flex-col items-center gap-2 animate-fade-in-left delay-300">
                        <Link to="/login" className="bg-white text-teal-500 w-44 flex justify-center items-center gap-2 border-2 border-white rounded-full py-3 transition-all duration-300 ease-in-out hover:bg-transparent hover:text-white"><span>Get Started</span></Link>
                    </div>
                </section>
                <div className="header__img">
                    <img src="./images/phone.png" alt="Appvilla mobile app's UI" className="animate-fade-in-right delay-500" />
                </div>
            </header>

            <div className="bg-blue-50 py-12 px-3" id="features">
                <section className="text-center mb-20">
                    <h3 className="text-teal-500 text-sm font-semibold uppercase animate-fade-in-up">Features</h3>
                    <h2 className="text-gray-800 text-2xl font-extrabold leading-tight mt-2 animate-fade-in-up delay-150">Everything You Need for the Perfect Trip</h2>
                    <p className="text-gray-600 mt-4 animate-fade-in-up delay-300">Plan your travels, manage expenses, and collaborate with your group, all in one place.</p>
                </section>
                <div className="grid justify-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <section className="bg-white p-8 border border-gray-200 rounded-lg hover:animate-move-up">
                        <div className="w-16 h-16 bg-teal-500 text-white text-2xl flex justify-center items-center rounded-lg">
                            <i className="fas fa-lightbulb"></i>
                        </div>
                        <h3 className="text-gray-800 text-xl font-semibold mt-6 mb-4">AI-Powered Suggestions</h3>
                        <p className="text-gray-600">Get intelligent recommendations for destinations, activities, and restaurants based on your preferences.</p>
                    </section>
                    <section className="bg-white p-8 border border-gray-200 rounded-lg hover:animate-move-up">
                        <div className="w-16 h-16 bg-teal-500 text-white text-2xl flex justify-center items-center rounded-lg">
                            <i className="fas fa-users"></i>
                        </div>
                        <h3 className="text-gray-800 text-xl font-semibold mt-6 mb-4">Collaborative Planning</h3>
                        <p className="text-gray-600">Invite your friends to plan together in real-time. Share ideas, create polls, and build your itinerary as a team.</p>
                    </section>
                    <section className="bg-white p-8 border border-gray-200 rounded-lg hover:animate-move-up">
                        <div className="w-16 h-16 bg-teal-500 text-white text-2xl flex justify-center items-center rounded-lg">
                            <i className="fas fa-wallet"></i>
                        </div>
                        <h3 className="text-gray-800 text-xl font-semibold mt-6 mb-4">Group Expense Tracking</h3>
                        <p className="text-gray-600">Easily split bills, track who paid for what, and settle up debts at the end of the trip. No more awkward conversations about money.</p>
                    </section>
                </div>
            </div>
        </>
    );
};

export default LandingPage;
