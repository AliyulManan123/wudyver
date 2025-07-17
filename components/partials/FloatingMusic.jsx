'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import YouTube from 'react-youtube';
import apiConfig from "@/configs/apiConfig";

const FloatingMusicWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [currentSong, setCurrentSong] = useState(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeTab, setActiveTab] = useState('search');
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const [playerKey, setPlayerKey] = useState(0);
    const [playlist, setPlaylist] = useState([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(-1);

    const playerRef = useRef(null);
    const openCardRef = useRef(null);
    const timeUpdateInterval = useRef(null);

    const btnSize = 'w-10 h-10';
    const iconSize = 'text-xl';

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
        };
    }, []);

    const showToast = (message, type = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const searchYouTube = async () => {
        if (!searchQuery.trim()) {
            showToast("Mohon masukkan kata kunci pencarian!", 'warn');
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`https://${apiConfig.DOMAIN_URL}/api/search/youtube/v4?action=search&query=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data.code && data.code.error === "00000" && data.data && data.data.items) {
                const processedResults = data.data.items.map(item => ({
                    id: item.id,
                    title: item.title,
                    url: item.url,
                    thumbnail: item.thumbnail,
                    duration: item.duration,
                    creator: item.creator,
                    viewCount: item.viewCount,
                    publishedAt: item.publishedAt,
                    description: item.description
                }));
                setSearchResults(processedResults);
                showToast(`Ditemukan ${processedResults.length} video!`, 'success');
            } else {
                showToast("Tidak ada hasil pencarian ditemukan", 'warn');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            showToast("Terjadi kesalahan saat mencari video", 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const playSong = useCallback((item, index) => {
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = null;
        }

        if (playerRef.current) {
            try {
                const player = playerRef.current.getInternalPlayer();
                if (player && player.stopVideo) {
                    player.stopVideo();
                }
            } catch (error) {
                console.log('Error stopping previous video:', error);
            }
        }

        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setCurrentSong(item);
        setCurrentSongIndex(index);
        setPlayerKey(prev => prev + 1);
        showToast(`Video "${item.title}" berhasil dipilih!`, 'success');
    }, []);

    const selectSearchResult = (item) => {
        const newPlaylist = [...searchResults];
        const index = newPlaylist.findIndex(song => song.id === item.id);
        playSong(item, index);
        setPlaylist(newPlaylist);
    };

    const getYouTubeVideoId = (url) => {
        const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v=|&v=))([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    };

    const handleYouTubeSubmit = async () => {
        if (!youtubeUrl.trim()) {
            showToast("Mohon masukkan URL YouTube!", 'warn');
            return;
        }

        const videoId = getYouTubeVideoId(youtubeUrl);
        if (videoId) {
            try {
                const response = await fetch(`https://${apiConfig.DOMAIN_URL}/api/search/youtube/v4?action=search&query=${encodeURIComponent(videoId)}`);
                const data = await response.json();

                let videoDetails = null;
                if (data.code && data.code.error === "00000" && data.data && data.data.items && data.data.items.length > 0) {
                    videoDetails = data.data.items[0];
                } else {
                    videoDetails = {
                        id: videoId,
                        title: "YouTube Video",
                        url: youtubeUrl,
                        thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                        duration: "Unknown",
                        creator: "Unknown",
                        viewCount: "N/A",
                        publishedAt: "Unknown",
                        description: "Direct YouTube URL"
                    };
                }

                const newPlaylist = [videoDetails];
                setPlaylist(newPlaylist);
                playSong(videoDetails, 0);
                showToast("Video YouTube berhasil dimuat!", 'success');
            } catch (error) {
                console.error('Error fetching video details:', error);
                showToast("Terjadi kesalahan saat memuat video dari URL", 'error');
            }
        } else {
            showToast("URL YouTube tidak valid!", 'error');
        }
    };

    const togglePlayPause = () => {
        if (!currentSong) {
            showToast("Mohon pilih video terlebih dahulu!", 'warn');
            return;
        }

        if (playerRef.current) {
            try {
                const player = playerRef.current.getInternalPlayer();
                const state = player.getPlayerState();
                
                if (state === 1) {
                    player.pauseVideo();
                } else if (state === 2) {
                    player.playVideo();
                } else {
                    player.playVideo();
                }
            } catch (error) {
                console.log('Error toggling play/pause:', error);
                showToast("Tidak dapat memutar/menjeda video.", 'error');
            }
        }
    };

    const playNextSong = () => {
        if (playlist.length === 0) {
            showToast("Tidak ada lagu di playlist.", 'info');
            return;
        }
        const nextIndex = (currentSongIndex + 1) % playlist.length;
        playSong(playlist[nextIndex], nextIndex);
    };

    const playPreviousSong = () => {
        if (playlist.length === 0) {
            showToast("Tidak ada lagu di playlist.", 'info');
            return;
        }
        const prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        playSong(playlist[prevIndex], prevIndex);
    };

    const shufflePlaylist = () => {
        if (playlist.length <= 1) {
            showToast("Tidak ada cukup lagu untuk diacak.", 'warn');
            return;
        }
        let shuffled = [...playlist];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setPlaylist(shuffled);
        if (currentSong) {
            const newCurrentIndex = shuffled.findIndex(song => song.id === currentSong.id);
            if (newCurrentIndex !== -1) {
                setCurrentSongIndex(newCurrentIndex);
            } else {
                playSong(shuffled[0], 0);
            }
        } else {
            playSong(shuffled[0], 0);
        }
        showToast("Playlist berhasil diacak!", 'success');
    };

    const handleSeekChange = useCallback((event) => {
        const newTime = parseFloat(event.target.value);
        setCurrentTime(newTime);
        if (playerRef.current) {
            try {
                const player = playerRef.current.getInternalPlayer();
                if (player && player.seekTo) {
                    player.seekTo(newTime, true);
                }
            } catch (error) {
                console.log('Error seeking video:', error);
            }
        }
    }, []);

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViewCount = (viewCount) => {
        if (viewCount === "N/A" || !viewCount) return "N/A";
        if (typeof viewCount === 'string') {
            const numStr = viewCount.replace(/[MKB]/g, '');
            const multiplier = viewCount.includes('M') ? 1000000 : viewCount.includes('K') ? 1000 : viewCount.includes('B') ? 1000000000 : 1;
            const num = parseFloat(numStr) * multiplier;
            return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num);
        }
        return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(viewCount);
    };

    const opts = {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            rel: 0,
            showinfo: 0
        },
    };

    const onPlayerReady = (event) => {
        playerRef.current = event.target;
        try {
            const duration = event.target.getDuration();
            setDuration(duration);
            setIsPlaying(true);
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
            }
            timeUpdateInterval.current = setInterval(() => {
                if (playerRef.current) {
                    try {
                        const player = playerRef.current.getInternalPlayer();
                        if (player && player.getCurrentTime) {
                            const currentTime = player.getCurrentTime();
                            setCurrentTime(currentTime);
                        }
                    } catch (error) {
                        console.log('Error getting current time:', error);
                    }
                }
            }, 1000);
        } catch (error) {
            console.log('Error setting up player:', error);
        }
    };

    const onPlayerStateChange = (event) => {
        if (event.data === 0) {
            setIsPlaying(false);
            setCurrentTime(0);
            if (timeUpdateInterval.current) {
                clearInterval(timeUpdateInterval.current);
                timeUpdateInterval.current = null;
            }
            playNextSong();
        } else if (event.data === 1) {
            setIsPlaying(true);
        } else if (event.data === 2) {
            setIsPlaying(false);
        }
    };

    const onPlayerError = (event) => {
        setIsPlaying(false);
        showToast("Terjadi kesalahan saat memutar video", 'error');
        if (timeUpdateInterval.current) {
            clearInterval(timeUpdateInterval.current);
            timeUpdateInterval.current = null;
        }
    };

    const handleTryItClick = () => {
        window.location.href = '/try-it';
    };

    return (
        <>
            {toastMessage && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white text-sm max-w-sm animate-in slide-in-from-top-2 duration-300 ${
                    toastType === 'success' ? 'bg-emerald-500' :
                    toastType === 'error' ? 'bg-red-500' :
                    toastType === 'warn' ? 'bg-yellow-500' :
                    'bg-sky-500'
                }`}>
                    {toastMessage}
                </div>
            )}

            <div style={{ display: 'none' }}>
                {currentSong && (
                    <YouTube
                        key={playerKey}
                        videoId={currentSong.id}
                        opts={opts}
                        onReady={onPlayerReady}
                        onStateChange={onPlayerStateChange}
                        onError={onPlayerError}
                    />
                )}
            </div>

            {!isOpen && (
                <div
                    className="fixed right-0 z-50 transition-all duration-300"
                    style={{ top: 'calc(100vh / 12 * 2.5)' }}
                >
                    <div className="flex flex-col space-y-2">
                        <div
                            className={`relative ${btnSize} bg-gradient-to-br from-teal-500 to-cyan-600 rounded-l-xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform border-l-2 border-t-2 border-b-2 border-teal-300 cursor-pointer`}
                            onClick={() => setIsOpen(true)}
                        >
                            <Icon icon="mdi:music" className={`${iconSize} text-white`} />
                            {(isPlaying || currentSong) && (
                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            )}
                        </div>
                        <div
                            className={`relative ${btnSize} bg-gradient-to-br from-blue-500 to-purple-600 rounded-l-xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform border-l-2 border-t-2 border-b-2 border-blue-300 cursor-pointer`}
                            onClick={handleTryItClick}
                        >
                            <Icon icon="mdi:play-circle" className={`${iconSize} text-white`} />
                        </div>
                    </div>
                </div>
            )}

            {isOpen && (
                <div
                    ref={openCardRef}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={(e) => {
                        if (openCardRef.current === e.target) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-teal-500/30 dark:border-teal-600/50 w-full max-w-6xl mx-4 md:mx-auto animate-in zoom-in-95 ease-out duration-300">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-md">
                                        <Icon icon="mdi:music" className="text-lg text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Music Player</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">YouTube Music</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <Icon icon="mdi:close" className="text-xl text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[calc(100vh-160px)] overflow-y-auto">
                            <div className="p-4 space-y-4">
                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setActiveTab('search')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                                            activeTab === 'search'
                                                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <Icon icon="mdi:magnify" className="w-4 h-4" />
                                        <span>Cari</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('url')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                                            activeTab === 'url'
                                                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <Icon icon="mdi:youtube" className="w-4 h-4" />
                                        <span>URL</span>
                                    </button>
                                </div>

                                {activeTab === 'search' && (
                                    <div className="space-y-3">
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Cari lagu atau artis..."
                                                className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-200"
                                                onKeyPress={(e) => e.key === 'Enter' && searchYouTube()}
                                            />
                                            <button
                                                onClick={searchYouTube}
                                                disabled={isSearching}
                                                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                            >
                                                {isSearching ? 'Cari...' : 'Cari'}
                                            </button>
                                        </div>

                                        {searchResults.length > 0 && (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {searchResults.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => selectSearchResult(item)}
                                                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                                            currentSong && currentSong.id === item.id
                                                                ? 'bg-teal-100 dark:bg-teal-900/30 border border-teal-300 dark:border-teal-600'
                                                                : 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
                                                        }`}
                                                    >
                                                        <img
                                                            src={item.thumbnail}
                                                            alt={item.title}
                                                            className="w-12 h-9 rounded object-cover"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {item.creator} • {item.duration}
                                                            </p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                                {formatViewCount(item.viewCount)} views • {item.publishedAt}
                                                            </p>
                                                        </div>
                                                        {currentSong && currentSong.id === item.id && (
                                                            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'url' && (
                                    <div className="flex space-x-2">
                                        <input
                                            type="url"
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                            placeholder="Paste YouTube URL here..."
                                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-slate-200"
                                            onKeyPress={(e) => e.key === 'Enter' && handleYouTubeSubmit()}
                                        />
                                        <button
                                            onClick={handleYouTubeSubmit}
                                            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium"
                                        >
                                            Load
                                        </button>
                                    </div>
                                )}

                                {currentSong && (
                                    <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={currentSong.thumbnail}
                                                alt={currentSong.title}
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                    {currentSong.title}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                    {currentSong.creator}
                                                </div>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                        </div>
                                        <div className="mt-4">
                                            <input
                                                type="range"
                                                min="0"
                                                max={duration}
                                                step="0.1"
                                                value={currentTime}
                                                onChange={handleSeekChange}
                                                className="w-full h-2 rounded-full appearance-none bg-slate-300 dark:bg-slate-700 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-teal-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow"
                                                style={{ background: `linear-gradient(to right, #14b8a6 ${(currentTime / duration) * 100}%, #cbd5e1 ${(currentTime / duration) * 100}%)` }}
                                            />
                                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-center items-center mt-4 space-x-4">
                                            <button
                                                onClick={playPreviousSong}
                                                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                                title="Lagu Sebelumnya"
                                            >
                                                <Icon icon="mdi:skip-previous" className="text-2xl" />
                                            </button>
                                            <button
                                                onClick={togglePlayPause}
                                                className="p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-colors shadow-md"
                                                title={isPlaying ? "Jeda" : "Mainkan"}
                                            >
                                                <Icon icon={isPlaying ? "mdi:pause" : "mdi:play"} className="text-2xl" />
                                            </button>
                                            <button
                                                onClick={playNextSong}
                                                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                                title="Lagu Berikutnya"
                                            >
                                                <Icon icon="mdi:skip-next" className="text-2xl" />
                                            </button>
                                            <button
                                                onClick={shufflePlaylist}
                                                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                                title="Acak Playlist"
                                            >
                                                <Icon icon="mdi:shuffle" className="text-xl" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingMusicWidget;