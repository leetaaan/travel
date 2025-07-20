import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage = () => {
    const { isDark } = useTheme();

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
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 dark:from-dark-900 dark:to-dark-800 z-[1000] transition-opacity duration-500 ease-linear" id="preloader">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <span className="absolute w-16 h-16 bg-primary-500 opacity-60 rounded-full animate-ping"></span>
                        <span className="absolute w-16 h-16 bg-blue-500 opacity-40 rounded-full animate-ping animation-delay-300"></span>
                        <span className="relative w-16 h-16 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"></path>
                            </svg>
                        </span>
                    </div>
                    <p className="text-primary-600 dark:text-primary-400 font-medium animate-pulse">Đang tải...</p>
                </div>
            </div>

            <button className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 text-white flex items-center justify-center rounded-full transition-all duration-300 ease-linear z-10 opacity-0 hover:opacity-100 hover:scale-110 shadow-lg backdrop-blur-sm" aria-label="Go back to top">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
            </button>


            <header id="header" className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 dark:from-primary-700 dark:via-primary-800 dark:to-blue-800 text-white overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full animate-float"></div>
                    <div className="absolute top-32 right-20 w-16 h-16 bg-white opacity-5 rounded-full animate-float-delay"></div>
                    <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white opacity-10 rounded-full animate-float"></div>
                </div>
                <div className="relative z-10 text-center flex flex-col gap-12 pt-32 pb-16 px-6 max-w-6xl mx-auto">
            <div className="relative z-10 text-center flex flex-col gap-12 pt-32 pb-16 px-6 max-w-6xl mx-auto">
                <section className="header__text">
                    <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent animate-fade-in-up">
                        Lên Kế Hoạch Du Lịch <br />
                        <span className="text-4xl md:text-5xl">Cùng Nhau</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-150">
                        Tạo lịch trình du lịch hợp tác với gợi ý từ AI và quản lý chi phí nhóm một cách dễ dàng
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                        <Link to="/login" className="group bg-white text-primary-600 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-blue-50 hover:scale-105 hover:shadow-xl flex items-center gap-3">
                            <span>Bắt Đầu Ngay</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                            </svg>
                        </Link>
                        <Link to="/planning" className="group border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-white hover:text-primary-600 hover:scale-105 flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                            <span>Khám Phá Tính Năng</span>
                        </Link>
                    </div>
                </section>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-primary-400 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative max-w-md mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-teal-400 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
                                    <div className="h-4 bg-gradient-to-r from-primary-400 to-blue-400 rounded-full w-3/4"></div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded-full w-1/2"></div>
                                        <div className="h-20 bg-gradient-to-br from-primary-100 to-blue-100 rounded-xl"></div>
                                        <div className="h-20 bg-gradient-to-br from-blue-100 to-primary-100 rounded-xl"></div>
                                    <div className="h-20 bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl"></div>
                                    <div className="h-8 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full mt-6"></div>
                                </div>
                                <div className="h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mt-6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="bg-gradient-to-b from-blue-50 to-white dark:from-dark-900 dark:to-dark-800 py-20 px-6 transition-colors duration-300" id="features">
                <div className="max-w-7xl mx-auto">
                <section className="text-center mb-20">
                    <span className="inline-block bg-gradient-to-r from-primary-500 to-blue-500 text-white text-sm font-semibold uppercase px-4 py-2 rounded-full mb-4 animate-fade-in-up">
                        Tính Năng
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 leading-tight mb-6 animate-fade-in-up delay-150">
                        Mọi Thứ Bạn Cần Cho <br />
                        <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">Chuyến Đi Hoàn Hảo</span>
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in-up delay-300">
                        Lập kế hoạch du lịch, quản lý chi phí và hợp tác với nhóm của bạn, tất cả trong một nơi
                    </p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <section className="group bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-dark-700">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-2xl flex justify-center items-center rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                        </div>
                        <h3 className="text-gray-800 dark:text-gray-100 text-xl font-bold mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Gợi Ý Từ AI</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Nhận các đề xuất thông minh về điểm đến, hoạt động và nhà hàng dựa trên sở thích của bạn</p>
                    </section>
                    <section className="group bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-dark-700">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl flex justify-center items-center rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <h3 className="text-gray-800 dark:text-gray-100 text-xl font-bold mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Lập Kế Hoạch Cộng Tác</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Mời bạn bè cùng lập kế hoạch theo thời gian thực. Chia sẻ ý tưởng, tạo bình chọn và xây dựng lịch trình cùng nhau</p>
                    </section>
                    <section className="group bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-dark-700">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-primary-500 text-white text-2xl flex justify-center items-center rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <h3 className="text-gray-800 dark:text-gray-100 text-xl font-bold mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Theo Dõi Chi Phí Nhóm</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Dễ dàng chia hóa đơn, theo dõi ai đã trả gì và thanh toán nợ cuối chuyến đi. Không còn cuộc trò chuyện khó xử về tiền bạc</p>
                    </section>
                </div>
                </div>
            </div>
        </>
    );
};

export default LandingPage;
